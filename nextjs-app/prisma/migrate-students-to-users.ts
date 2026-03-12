import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.studentProfile.findMany();

  if (students.length === 0) {
    console.log('No students found to migrate.');
    return;
  }

  console.log(`Migrating ${students.length} students to users...`);

  const defaultPasswordHash = await hash('password123', 12);

  for (const student of students) {
    const name = `${student.firstName} ${student.lastName}`.trim();

    const user = await prisma.user.create({
      data: {
        email: student.email,
        passwordHash: defaultPasswordHash,
        name,
        phone: student.phone,
        role: UserRole.STUDENT,
        status: student.accountStatus || 'active',
        propertyId: student.propertyId || undefined,
      },
    });

    await prisma.studentProfile.update({
      where: { id: student.id },
      data: {
        userId: user.id,
      },
    });

    await prisma.account.updateMany({
      where: { userId: student.id },
      data: { userId: user.id },
    });

    await prisma.session.updateMany({
      where: { userId: student.id },
      data: { userId: user.id },
    });

    console.log(`Migrated student ${student.id} -> user ${user.id}`);
  }

  console.log('Migration completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

