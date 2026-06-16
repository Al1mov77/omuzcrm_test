import { PrismaClient, Role, StudentStatus, Language } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing database...');
  await prisma.refreshToken.deleteMany({});
  await prisma.coinTransaction.deleteMany({});
  await prisma.rewardRedemption.deleteMany({});
  await prisma.rewardItem.deleteMany({});
  await prisma.journalEntry.deleteMany({});
  await prisma.weekExam.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.week.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.groupStudent.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.branch.deleteMany({});

  console.log('Seeding branches...');
  const branchProfsouz = await prisma.branch.create({
    data: { name: 'Profsouz' },
  });
  const branchDushanbe = await prisma.branch.create({
    data: { name: 'Dushanbe' },
  });

  console.log('Hashing passwords...');
  const saPasswordHash = await bcrypt.hash('000000000', 12);
  const commonPasswordHash = await bcrypt.hash('password123', 12);

  console.log('Seeding users...');
  // Super Admin
  await prisma.user.create({
    data: {
      phone: '000000000',
      passwordHash: saPasswordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      branchId: branchProfsouz.id,
      address: 'Profsouz St 12',
      birthDate: new Date('1990-01-01'),
      language: Language.RU,
    },
  });

  // Mentor
  const mentor = await prisma.user.create({
    data: {
      phone: '992000001',
      passwordHash: commonPasswordHash,
      firstName: 'Muhammadsurur',
      lastName: 'Abdulloev',
      role: Role.MENTOR,
      branchId: branchProfsouz.id,
      address: 'Dushanbe, Rudaki 45',
      birthDate: new Date('1994-08-15'),
      language: Language.RU,
    },
  });

  // 14 Students Data
  const studentsData = [
    { phone: '200500102', firstName: 'Ahmadshoh', lastName: 'Hayotov', coins: 150, status: StudentStatus.ACTIVE },
    { phone: '200500101', firstName: 'Amirjon', lastName: 'Shukurov', coins: 180, status: StudentStatus.ACTIVE },
    { phone: '902374422', firstName: 'Muhammadumar', lastName: 'Azizov', coins: 100, status: StudentStatus.FINISHED },
    { phone: '200500104', firstName: 'Alijon', lastName: 'Fazilzod', coins: 120, status: StudentStatus.ACTIVE },
    { phone: '200500112', firstName: 'Firuz', lastName: 'Sharipov', coins: 90, status: StudentStatus.ACTIVE },
    { phone: '110801555', firstName: 'Valid', lastName: 'Qodiri', coins: 110, status: StudentStatus.FINISHED },
    { phone: '900420003', firstName: 'Ahmadsho', lastName: 'Raufov', coins: 95, status: StudentStatus.FINISHED },
    { phone: '200000000', firstName: 'Test', lastName: 'Student', coins: 28, parentPhone: '987650319', birthDate: new Date('2010-12-13'), address: 'Firdavsi', status: StudentStatus.FINISHED },
    { phone: '918934480', firstName: 'Abubakr', lastName: 'Umarov', coins: 85, status: StudentStatus.FINISHED },
    { phone: '909765000', firstName: 'Yusuf', lastName: 'Karimov', coins: 89, status: StudentStatus.FINISHED },
    { phone: '200500106', firstName: 'Iso', lastName: 'Musoev', coins: 88, status: StudentStatus.ACTIVE },
    { phone: '200500113', firstName: 'Kawsar', lastName: 'Temirov', coins: 88, status: StudentStatus.ACTIVE },
    { phone: '200500108', firstName: 'Muhammadyusuf', lastName: 'Samadov', coins: 88, status: StudentStatus.ACTIVE },
    { phone: '200500114', firstName: 'Ismoil', lastName: 'Abdulloev', coins: 87, status: StudentStatus.ACTIVE },
  ];

  const students: any[] = [];
  for (const s of studentsData) {
    const user = await prisma.user.create({
      data: {
        id: s.phone === '200000000' ? 'bab2dfbb-c5f8-47f1-a985-800a795c87b6' : undefined,
        phone: s.phone,
        passwordHash: commonPasswordHash,
        firstName: s.firstName,
        lastName: s.lastName,
        role: Role.STUDENT,
        branchId: branchProfsouz.id,
        coins: s.coins,
        parentPhone: s.parentPhone || '987654321',
        birthDate: s.birthDate || new Date('2009-05-15'),
        address: s.address || 'Dushanbe St',
        language: Language.RU,
      },
    });
    students.push({ user, status: s.status });
  }

  console.log('Seeding groups...');
  const group = await prisma.group.create({
    data: {
      name: 'Next js - 10',
      startDate: new Date('2026-04-06'),
      endDate: new Date('2026-05-08'),
      branchId: branchProfsouz.id,
      mentorId: mentor.id,
      classroom: 'Room 303',
      resourceUrl: 'https://github.com/omuz/nextjs10-resources',
      isActive: true,
    },
  });

  console.log('Adding students to group...');
  for (const s of students) {
    await prisma.groupStudent.create({
      data: {
        groupId: group.id,
        studentId: s.user.id,
        status: s.status,
      },
    });
  }

  console.log('Seeding schedule...');
  await prisma.schedule.createMany({
    data: [
      { groupId: group.id, dayOfWeek: 1, startTime: '18:00', endTime: '20:00', classroom: 'Room 303' },
      { groupId: group.id, dayOfWeek: 2, startTime: '18:00', endTime: '20:00', classroom: 'Room 303' },
      { groupId: group.id, dayOfWeek: 3, startTime: '18:00', endTime: '20:00', classroom: 'Room 303' },
      { groupId: group.id, dayOfWeek: 4, startTime: '18:00', endTime: '20:00', classroom: 'Room 303' },
      { groupId: group.id, dayOfWeek: 5, startTime: '18:00', endTime: '20:00', classroom: 'Room 303' },
      { groupId: group.id, dayOfWeek: 6, startTime: '18:00', endTime: '20:00', classroom: 'Room 303' },
    ],
  });

  console.log('Seeding weeks, lessons and grades...');
  // 5 weeks, Monday to Friday dates
  const weeksDates = [
    // Week 1
    [new Date('2026-04-06'), new Date('2026-04-07'), new Date('2026-04-08'), new Date('2026-04-09'), new Date('2026-04-10')],
    // Week 2
    [new Date('2026-04-13'), new Date('2026-04-14'), new Date('2026-04-15'), new Date('2026-04-16'), new Date('2026-04-17')],
    // Week 3
    [new Date('2026-04-20'), new Date('2026-04-21'), new Date('2026-04-22'), new Date('2026-04-23'), new Date('2026-04-24')],
    // Week 4
    [new Date('2026-04-27'), new Date('2026-04-28'), new Date('2026-04-29'), new Date('2026-04-30'), new Date('2026-05-01')],
    // Week 5
    [new Date('2026-05-04'), new Date('2026-05-05'), new Date('2026-05-06'), new Date('2026-05-07'), new Date('2026-05-08')],
  ];

  // Specific student exam sums for Weeks 1 to 5 to show progress
  // Weeks mapping: [W1, W2, W3, W4, W5]
  const examSums: Record<string, number[]> = {
    'Ahmadshoh Hayotov': [95, 96, 98, 98, 99],
    'Amirjon Shukurov': [93, 95, 96, 96, 96],
    'Muhammadumar Azizov': [94, 95, 96, 96, 95],
    'Alijon Fazilzod': [92, 93, 94, 95, 94],
    'Firuz Sharipov': [88, 89, 90, 90, 91],
    'Valid Qodiri': [87, 88, 89, 89, 88],
    'Ahmadsho Raufov': [86, 87, 89, 89, 89],
    'Test Student': [87, 88, 89, 89, 90],
    'Abubakr Umarov': [85, 86, 88, 89, 89],
    'Yusuf Karimov': [86, 87, 89, 89, 88],
    'Iso Musoev': [85, 86, 87, 88, 87],
    'Kawsar Temirov': [84, 85, 87, 88, 88],
    'Muhammadyusuf Samadov': [85, 86, 87, 88, 88],
    'Ismoil Abdulloev': [84, 85, 86, 87, 86],
  };

  for (let w = 1; w <= 5; w++) {
    const week = await prisma.week.create({
      data: { groupId: group.id, weekNumber: w },
    });

    const dates = weeksDates[w - 1];
    for (const d of dates) {
      const lesson = await prisma.lesson.create({
        data: { weekId: week.id, date: d },
      });

      for (const s of students) {
        const fullName = `${s.user.firstName} ${s.user.lastName}`;
        // Attendance probability: Umar is present on most, others are mostly present
        let attended = true;
        let note = undefined;

        // Custom absences and notes for Alijon Fazilzod in Week 2
        if (fullName === 'Alijon Fazilzod' && w === 2) {
          if (d.getDate() === 13) {
            attended = true;
            note = 'Был на встрече с директором';
          } else if (d.getDate() === 15) {
            attended = true;
            note = 'Опоздал по семейным обстоятельствам';
          } else if (d.getDate() === 16) {
            attended = true;
            note = 'Опоздал из-за пробок';
          }
        }

        // Randomly set some student absent with note
        if (fullName !== 'Alijon Fazilzod' && Math.random() > 0.92) {
          attended = false;
          note = 'Пропустил урок по болезни';
        }

        await prisma.journalEntry.create({
          data: {
            lessonId: lesson.id,
            studentId: s.user.id,
            attended,
            score: attended ? Math.floor(Math.random() * 2) + 4 : 0, // mostly 4 or 5
            note,
          },
        });
      }
    }

    // Week Exams
    for (const s of students) {
      const fullName = `${s.user.firstName} ${s.user.lastName}`;
      const sum = examSums[fullName] ? examSums[fullName][w - 1] : 85;
      
      // Bonus: Shukurov has 10 bonus in Week 2, others have 0 or small bonus
      let bonus = 0;
      if (fullName === 'Amirjon Shukurov' && w === 2) {
        bonus = 10;
      } else if (Math.random() > 0.8) {
        bonus = Math.floor(Math.random() * 4);
      }
      
      const examScore = sum - bonus;

      await prisma.weekExam.create({
        data: {
          weekId: week.id,
          studentId: s.user.id,
          bonus,
          examScore,
          sum,
        },
      });
    }
  }

  // Rewards catalog
  console.log('Seeding rewards...');
  await prisma.rewardItem.create({
    data: { title: 'Omuz T-shirt', coinCost: 100, imageUrl: '/rewards/tshirt.png', isAvailable: true },
  });
  await prisma.rewardItem.create({
    data: { title: 'Omuz Ceramic Mug', coinCost: 50, imageUrl: '/rewards/mug.png', isAvailable: true },
  });

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
