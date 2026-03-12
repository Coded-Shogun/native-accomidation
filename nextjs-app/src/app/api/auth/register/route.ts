/**
 * Registration API Endpoint
 * Creates new student account with validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/security';
import { logAudit } from '@/lib/logger';
import { z } from 'zod';
import { validateSAIdNumber, calculateAge, calculateDistance } from '@/lib/utils';

// Registration schema (server-side validation)
const registerSchema = z.object({
  // Personal
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string(),
  idNumber: z.string().refine((val) => validateSAIdNumber(val)),
  dateOfBirth: z.string(),

  // University
  universityName: z.string().min(2),
  courseOfStudy: z.string().min(2),
  yearOfStudy: z.string(),
  studentNumber: z.string().min(5),

  // Address
  homeAddress: z.string().min(5),
  homeCity: z.string().min(2),
  homeProvince: z.string().min(2),
  homePostalCode: z.string().min(4),

  // Emergency Contact
  emergencyContactName: z.string().min(2),
  emergencyContactPhone: z.string(),
  emergencyRelationship: z.string().min(2),

  // Account
  password: z.string().min(8),

  // NSFAS
  nsfasBeneficiary: z.boolean(),
  nsfasReference: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if email already exists on user
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Check if student number already exists
    const existingStudentNumber = await prisma.studentProfile.findUnique({
      where: { studentNumber: data.studentNumber },
    });

    if (existingStudentNumber) {
      return NextResponse.json(
        { error: 'Student number already registered' },
        { status: 409 }
      );
    }

    // Check if ID number already exists
    const existingIdNumber = await prisma.studentProfile.findUnique({
      where: { idNumber: data.idNumber },
    });

    if (existingIdNumber) {
      return NextResponse.json(
        { error: 'ID number already registered' },
        { status: 409 }
      );
    }

    // Calculate age
    const age = calculateAge(new Date(data.dateOfBirth));
    if (age < 18) {
      return NextResponse.json(
        { error: 'You must be at least 18 years old to register' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user + student profile in a transaction
    const { user, studentProfile } = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: `${data.firstName} ${data.lastName}`.trim(),
          phone: data.phone,
          role: 'STUDENT',
          status: 'active',
        },
      });

      const createdStudentProfile = await tx.studentProfile.create({
        data: {
          userId: createdUser.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          idNumber: data.idNumber,
          dateOfBirth: new Date(data.dateOfBirth),
          universityName: data.universityName,
          courseOfStudy: data.courseOfStudy,
          yearOfStudy: parseInt(data.yearOfStudy),
          studentNumber: data.studentNumber,
          homeAddress: data.homeAddress,
          homeCity: data.homeCity,
          homeProvince: data.homeProvince,
          homePostalCode: data.homePostalCode,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          emergencyRelationship: data.emergencyRelationship,
          nsfasBeneficiary: data.nsfasBeneficiary,
          nsfasReference: data.nsfasReference || null,
          accountStatus: 'active',
        },
      });

      return { user: createdUser, studentProfile: createdStudentProfile };
    });

    // Audit log
    logAudit({
      action: 'CREATE',
      resource: 'student',
      resourceId: studentProfile.id,
      success: true,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Return success (without sensitive data)
    return NextResponse.json(
      {
        message: 'Registration successful',
        student: {
          id: studentProfile.id,
          email: studentProfile.email,
          studentNumber: studentProfile.studentNumber,
          userId: user.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Audit log failure
    logAudit({
      action: 'CREATE',
      resource: 'student',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
