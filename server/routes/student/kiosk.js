const express = require('express');
const router = express.Router();
const { runQuery, getOne, getAll } = require('../../database/init');
const { authenticateToken } = require('../../middleware/authMiddleware');
const { logDataAccess } = require('../../utils/logger');

// All routes require student authentication
router.use(authenticateToken);

/**
 * Get all available kiosk items at student's property
 * GET /api/student/kiosk/items
 */
router.get('/items', async (req, res) => {
  try {
    const studentId = req.user.id;
    const { category } = req.query;

    // Get student's property
    const lease = await getOne(
      'SELECT property_id FROM leases WHERE student_id = ? AND status = "active"',
      [studentId]
    );

    if (!lease) {
      return res.status(404).json({ error: 'No active lease found' });
    }

    let sql = `
      SELECT *
      FROM kiosk_items
      WHERE (property_id = ? OR property_id IS NULL)
      AND is_available = 1
    `;

    const params = [lease.property_id];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY category, name';

    const items = await getAll(sql, params);

    // Mark items that are low on stock
    const enrichedItems = items.map((item) => ({
      ...item,
      is_low_stock: item.stock_quantity > 0 && item.stock_quantity <= item.low_stock_threshold,
      is_out_of_stock: item.stock_quantity === 0,
    }));

    res.json(enrichedItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get single kiosk item
 * GET /api/student/kiosk/items/:id
 */
router.get('/items/:id', async (req, res) => {
  try {
    const itemId = req.params.id;

    const item = await getOne(
      'SELECT * FROM kiosk_items WHERE id = ? AND is_available = 1',
      [itemId]
    );

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({
      ...item,
      is_low_stock: item.stock_quantity > 0 && item.stock_quantity <= item.low_stock_threshold,
      is_out_of_stock: item.stock_quantity === 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Create a new kiosk order
 * POST /api/student/kiosk/orders
 */
router.post('/orders', async (req, res) => {
  try {
    const studentId = req.user.id;
    const { items, payment_method, notes } = req.body;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Get student's property
    const lease = await getOne(
      'SELECT property_id FROM leases WHERE student_id = ? AND status = "active"',
      [studentId]
    );

    if (!lease) {
      return res.status(404).json({ error: 'No active lease found' });
    }

    // Validate payment method
    const validPaymentMethods = ['cash', 'card', 'account', 'mobile'];
    const orderPaymentMethod = payment_method || 'account';
    if (!validPaymentMethods.includes(orderPaymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Calculate total and validate stock
    let totalAmount = 0;
    const orderItems = [];

    for (const orderItem of items) {
      const { item_id, quantity } = orderItem;

      if (!item_id || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid item or quantity' });
      }

      const item = await getOne('SELECT * FROM kiosk_items WHERE id = ? AND is_available = 1', [
        item_id,
      ]);

      if (!item) {
        return res.status(404).json({ error: `Item ${item_id} not found` });
      }

      if (item.stock_quantity < quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${item.name}. Available: ${item.stock_quantity}`,
        });
      }

      const subtotal = item.price * quantity;
      totalAmount += subtotal;

      orderItems.push({
        item_id,
        quantity,
        unit_price: item.price,
        subtotal,
        item_name: item.name,
      });
    }

    // Create order
    const orderResult = await runQuery(
      `INSERT INTO kiosk_orders (
        student_id, property_id, total_amount, status,
        payment_method, payment_status, notes
      ) VALUES (?, ?, ?, 'pending', ?, 'unpaid', ?)`,
      [studentId, lease.property_id, totalAmount, orderPaymentMethod, notes || null]
    );

    const orderId = orderResult.lastID;

    // Create order items and update stock
    for (const orderItem of orderItems) {
      await runQuery(
        `INSERT INTO kiosk_order_items (order_id, item_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, orderItem.item_id, orderItem.quantity, orderItem.unit_price, orderItem.subtotal]
      );

      // Decrease stock
      await runQuery('UPDATE kiosk_items SET stock_quantity = stock_quantity - ? WHERE id = ?', [
        orderItem.quantity,
        orderItem.item_id,
      ]);
    }

    logDataAccess({
      userId: studentId,
      resource: 'kiosk_order',
      action: 'CREATE',
      resourceId: orderId,
      ip: req.ip,
      success: true,
      metadata: { total_amount: totalAmount, item_count: orderItems.length },
    });

    res.status(201).json({
      message: 'Order created successfully',
      order_id: orderId,
      total_amount: totalAmount,
      status: 'pending',
      payment_method: orderPaymentMethod,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get all orders for student
 * GET /api/student/kiosk/orders
 */
router.get('/orders', async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status } = req.query;

    let sql = `
      SELECT o.*, p.name as property_name
      FROM kiosk_orders o
      JOIN properties p ON o.property_id = p.id
      WHERE o.student_id = ?
    `;

    const params = [studentId];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC LIMIT 50';

    const orders = await getAll(sql, params);

    logDataAccess({
      userId: studentId,
      resource: 'kiosk_orders',
      action: 'READ',
      resourceId: null,
      ip: req.ip,
      success: true,
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get single order with items
 * GET /api/student/kiosk/orders/:id
 */
router.get('/orders/:id', async (req, res) => {
  try {
    const studentId = req.user.id;
    const orderId = req.params.id;

    const order = await getOne(
      `SELECT o.*, p.name as property_name
       FROM kiosk_orders o
       JOIN properties p ON o.property_id = p.id
       WHERE o.id = ? AND o.student_id = ?`,
      [orderId, studentId]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const items = await getAll(
      `SELECT oi.*, ki.name as item_name, ki.category
       FROM kiosk_order_items oi
       JOIN kiosk_items ki ON oi.item_id = ki.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    res.json({
      ...order,
      items,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Cancel an order (only if pending)
 * DELETE /api/student/kiosk/orders/:id
 */
router.delete('/orders/:id', async (req, res) => {
  try {
    const studentId = req.user.id;
    const orderId = req.params.id;

    const order = await getOne(
      'SELECT * FROM kiosk_orders WHERE id = ? AND student_id = ?',
      [orderId, studentId]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res
        .status(400)
        .json({ error: 'Can only cancel pending orders. Contact staff for assistance.' });
    }

    // Restore stock for cancelled order
    const orderItems = await getAll('SELECT * FROM kiosk_order_items WHERE order_id = ?', [
      orderId,
    ]);

    for (const item of orderItems) {
      await runQuery('UPDATE kiosk_items SET stock_quantity = stock_quantity + ? WHERE id = ?', [
        item.quantity,
        item.item_id,
      ]);
    }

    // Mark order as cancelled
    await runQuery('UPDATE kiosk_orders SET status = "cancelled" WHERE id = ?', [orderId]);

    logDataAccess({
      userId: studentId,
      resource: 'kiosk_order',
      action: 'DELETE',
      resourceId: orderId,
      ip: req.ip,
      success: true,
    });

    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
