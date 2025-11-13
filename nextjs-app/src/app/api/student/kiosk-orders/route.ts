/**
 * Student Kiosk Orders API
 * Order food/items from property kiosk
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logDataAccess, logAudit } from '@/lib/logger';
import { z } from 'zod';

// Validation schema
const kioskOrderItemSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  customizations: z.string().max(500).optional(),
});

const kioskOrderSchema = z.object({
  items: z.array(kioskOrderItemSchema).min(1),
  deliveryLocation: z.enum(['room', 'kiosk_pickup']),
  deliveryNotes: z.string().max(500).optional(),
  paymentMethod: z.enum(['cash', 'card', 'eft', 'student_account']),
});

/**
 * GET /api/student/kiosk-orders
 * Get student's kiosk orders
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      studentId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    // Fetch orders
    const [orders, total] = await Promise.all([
      prisma.kioskOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          items: {
            include: {
              item: {
                select: {
                  name: true,
                  price: true,
                  category: true,
                },
              },
            },
          },
        },
      }),
      prisma.kioskOrder.count({ where }),
    ]);

    logDataAccess({
      userId: session.user.id,
      resource: 'kiosk_orders',
      action: 'READ',
      metadata: { status, count: orders.length },
    });

    return NextResponse.json({
      orders,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching kiosk orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kiosk orders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/student/kiosk-orders
 * Create a new kiosk order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validation = kioskOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get student's property
    const student = await prisma.student.findUnique({
      where: { id: session.user.id },
      select: { propertyId: true },
    });

    if (!student?.propertyId) {
      return NextResponse.json(
        { error: 'No property assigned' },
        { status: 400 }
      );
    }

    // Fetch all items and validate
    const itemIds = data.items.map(item => item.itemId);
    const items = await prisma.kioskItem.findMany({
      where: {
        id: { in: itemIds },
        propertyId: student.propertyId,
        isAvailable: true,
      },
    });

    if (items.length !== itemIds.length) {
      return NextResponse.json(
        { error: 'Some items are not available' },
        { status: 400 }
      );
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = data.items.map(orderItem => {
      const item = items.find(i => i.id === orderItem.itemId);
      if (!item) {
        throw new Error('Item not found');
      }
      const itemTotal = item.price * orderItem.quantity;
      totalAmount += itemTotal;

      return {
        itemId: orderItem.itemId,
        quantity: orderItem.quantity,
        unitPrice: item.price,
        totalPrice: itemTotal,
        customizations: orderItem.customizations || null,
      };
    });

    // Check if student has outstanding orders (max 3 pending orders)
    const pendingOrdersCount = await prisma.kioskOrder.count({
      where: {
        studentId: session.user.id,
        status: { in: ['pending', 'preparing'] },
      },
    });

    if (pendingOrdersCount >= 3) {
      return NextResponse.json(
        { error: 'Maximum 3 pending orders allowed' },
        { status: 400 }
      );
    }

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.kioskOrder.create({
        data: {
          studentId: session.user.id,
          propertyId: student.propertyId,
          totalAmount,
          deliveryLocation: data.deliveryLocation,
          deliveryNotes: data.deliveryNotes || null,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentMethod === 'student_account' ? 'pending' : 'unpaid',
          status: 'pending',
        },
      });

      // Create order items
      await tx.kioskOrderItem.createMany({
        data: orderItems.map(item => ({
          orderId: newOrder.id,
          ...item,
        })),
      });

      return newOrder;
    });

    // Fetch complete order with items
    const completeOrder = await prisma.kioskOrder.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            item: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    // Audit log
    logAudit({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'kiosk_order',
      resourceId: order.id,
      success: true,
      metadata: {
        itemCount: data.items.length,
        totalAmount,
        paymentMethod: data.paymentMethod,
      },
    });

    return NextResponse.json(completeOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating kiosk order:', error);

    logAudit({
      userId: session?.user?.id,
      action: 'CREATE',
      resource: 'kiosk_order',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to create kiosk order' },
      { status: 500 }
    );
  }
}
