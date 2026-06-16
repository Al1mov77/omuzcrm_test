import { Controller, Get, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('api/Student')
export class StudentController {
  constructor(private prisma: PrismaService) {}

  @Get('get-student-performance')
  async getStudentPerformance(
    @Query('StudentId') studentId: string,
    @Query('WeekPageNumber') weekPageStr: string,
  ) {
    const weekPage = parseInt(weekPageStr, 10) || 0;
    const weekNumber = weekPage + 1;

    // Find the student
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Find the most recent active group the student belongs to
    const groupStudent = await this.prisma.groupStudent.findFirst({
      where: { studentId },
      orderBy: { joinedAt: 'desc' },
      include: {
        group: {
          include: {
            schedules: true,
          },
        },
      },
    });

    if (!groupStudent) {
      return {
        data: null,
        statusCode: 200,
        errors: [],
      };
    }

    const group = groupStudent.group;

    // Find the week
    const week = await this.prisma.week.findFirst({
      where: {
        groupId: group.id,
        weekNumber,
      },
      include: {
        lessons: {
          include: {
            journalEntries: {
              where: { studentId },
            },
          },
        },
      },
    });

    if (!week) {
      return {
        data: null,
        statusCode: 200,
        errors: [],
      };
    }

    let countOfAbsent = 0;
    let countOfPresent = 0;
    let sumMinuteOfLate = 0;
    let countOfLate = 0;
    let currentScore = 0;

    const dailyPerformance = [];
    const lessonsDates = [];

    // Order lessons by date ascending
    const orderedLessons = [...week.lessons].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    for (const lesson of orderedLessons) {
      lessonsDates.push(lesson.date.toISOString());

      const entry = lesson.journalEntries[0];
      if (entry) {
        let late = 0;
        if (entry.note) {
          const match =
            entry.note.match(/late\s*(\d+)/i) ||
            entry.note.match(/опоздал\s*на\s*(\d+)/i) ||
            entry.note.match(/дер\s*(\d+)/i);
          if (match) {
            late = parseInt(match[1], 10);
            sumMinuteOfLate += late;
            countOfLate++;
          }
        }

        if (entry.attended) {
          countOfPresent++;
          currentScore += entry.score;
        } else {
          countOfAbsent++;
        }

        dailyPerformance.push({
          date: lesson.date.toISOString(),
          score: entry.attended ? entry.score : 0,
          present: entry.attended ? 'Был' : 'Н/Б',
          late,
          comment: entry.note || null,
        });
      } else {
        dailyPerformance.push({
          date: lesson.date.toISOString(),
          score: 0,
          present: 'Н/Б',
          late: 0,
          comment: null,
        });
      }
    }

    // Calculate sum of lesson in minutes
    // Assume 2 hours per lesson = 120 minutes
    const lessonMinutes = 120;
    const sumLessonInMinute = week.lessons.length * lessonMinutes;

    return {
      data: {
        countOfAbsent,
        countOfPresent,
        countOfComment: dailyPerformance.filter(d => d.comment).length,
        currentScore,
        sumMinuteOfLate,
        countOfLate,
        group: {
          id: group.id,
          groupName: group.name,
          description: group.name,
          startsAt: group.startDate.toISOString(),
          finishedAt: group.endDate.toISOString(),
          status: group.isActive ? 1 : 2,
        },
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          phone: student.phone,
          address: student.address || '',
          birthDate: student.birthDate ? student.birthDate.toISOString() : null,
        },
        dailyPerformance,
        lessons: lessonsDates,
        countOfLesson: week.lessons.length,
        sumLessonInMinute,
        totalWeek: 5, // Default weeks
        totalMonth: 1,
        totalProgressBook: week.lessons.length,
      },
      statusCode: 200,
      errors: [],
    };
  }

  @Get('id')
  async getStudentById(@Query('id') id: string) {
    const student = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const studentGroups = await this.prisma.groupStudent.findMany({
      where: { studentId: id },
      include: {
        group: {
          include: {
            weeks: {
              include: {
                lessons: {
                  include: {
                    journalEntries: true, // load for all to detect active weeks group-wide
                  },
                },
                exams: true, // load for all to detect active weeks group-wide
              },
            },
          },
        },
      },
    });

    // Deduplicate student groups by groupId
    const uniqueGroupsMap = new Map<string, typeof studentGroups[0]>();
    for (const gs of studentGroups) {
      if (!uniqueGroupsMap.has(gs.groupId)) {
        uniqueGroupsMap.set(gs.groupId, gs);
      }
    }
    const uniqueStudentGroups = Array.from(uniqueGroupsMap.values());

    const groupsData = uniqueStudentGroups.map(gs => {
      const group = gs.group;
      let totalWeeksCount = 0;
      let weeklySumAccumulator = 0;

      const weeklyGrade = group.weeks.map(w => {
        let weekScoreSum = 0;
        let weekScoreCount = 0;

        w.lessons.forEach(l => {
          l.journalEntries.forEach(je => {
            if (je.studentId === id && je.attended) {
              weekScoreSum += je.score;
              weekScoreCount++;
            }
          });
        });

        const exam = w.exams.find(e => e.studentId === id);
        const averageLessonScore = weekScoreCount > 0 ? weekScoreSum / weekScoreCount : 0;
        const examGraded = exam && (exam.examScore > 0 || exam.bonus > 0 || exam.sum > 0);

        let isGraded = false;
        let grade = 0;

        // Check active week status group-wide
        const anyExamGraded = w.exams.some(e => e.examScore > 0 || e.bonus > 0 || e.sum > 0 || e.attended === false);
        const anyLessonGraded = w.lessons.some(l =>
          l.journalEntries.some(je => je.score > 0 || je.attended === false)
        );

        if (anyExamGraded || anyLessonGraded) {
          isGraded = true;
          if (exam && exam.attended) {
            grade = exam.sum;
          } else if (weekScoreCount > 0) {
            grade = Math.round(averageLessonScore * 20);
          }
        }

        if (isGraded) {
          weeklySumAccumulator += grade;
          totalWeeksCount++;
        }

        return {
          weekNumber: w.weekNumber,
          grade,
        };
      });

      let totalAverage = 0;
      if (totalWeeksCount > 0) {
        totalAverage = Math.round(weeklySumAccumulator / totalWeeksCount);
      }

      return {
        id: group.id,
        groupName: group.name,
        courseLogo: 'default.png',
        startDate: group.startDate.toISOString(),
        weeklyGrade: weeklyGrade.sort((a, b) => a.weekNumber - b.weekNumber),
        totalAverage,
      };
    });

    return {
      data: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone,
        groups: groupsData,
      },
      statusCode: 200,
      errors: [],
    };
  }
}
