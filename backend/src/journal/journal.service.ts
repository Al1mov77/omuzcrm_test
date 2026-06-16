import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreateWeekDto } from './dto/create-week.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { Role } from '@prisma/client';

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  async getJournal(groupId: string, userId: string, role: Role) {
    if (role === Role.STUDENT) {
      const isMember = await this.prisma.groupStudent.findUnique({
        where: { groupId_studentId: { groupId, studentId: userId } },
      });
      if (!isMember) {
        throw new ForbiddenException('Access denied to this group journal');
      }
    }

    const weeks = await this.prisma.week.findMany({
      where: { groupId },
      include: {
        lessons: {
          include: {
            journalEntries: {
              where: role === Role.STUDENT ? { studentId: userId } : undefined,
              include: {
                student: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        },
        exams: {
          where: role === Role.STUDENT ? { studentId: userId } : undefined,
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { weekNumber: 'asc' },
    });

    return weeks;
  }

  async getWeekData(groupId: string, weekNumber: number, userId: string, role: Role) {
    if (role === Role.STUDENT) {
      const isMember = await this.prisma.groupStudent.findUnique({
        where: { groupId_studentId: { groupId, studentId: userId } },
      });
      if (!isMember) {
        throw new ForbiddenException('Access denied to this week data');
      }
    }

    const week = await this.prisma.week.findFirst({
      where: { groupId, weekNumber },
      include: {
        lessons: {
          include: {
            journalEntries: {
              where: role === Role.STUDENT ? { studentId: userId } : undefined,
              include: {
                student: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        },
        exams: {
          where: role === Role.STUDENT ? { studentId: userId } : undefined,
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!week) {
      throw new NotFoundException('Week not found');
    }

    return week;
  }

  async updateEntry(groupId: string, entryId: string, updateEntryDto: UpdateEntryDto) {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id: entryId } });
    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }

    return this.prisma.journalEntry.update({
      where: { id: entryId },
      data: {
        attended: updateEntryDto.attended,
        score: updateEntryDto.score,
        note: updateEntryDto.note,
      },
    });
  }

  async updateExam(groupId: string, examId: string, updateExamDto: UpdateExamDto) {
    const exam = await this.prisma.weekExam.findUnique({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException('Exam record not found');
    }

    const bonus = updateExamDto.bonus !== undefined ? updateExamDto.bonus : exam.bonus;
    const examScore = updateExamDto.examScore !== undefined ? updateExamDto.examScore : exam.examScore;
    const attended = updateExamDto.attended !== undefined ? updateExamDto.attended : exam.attended;

    return this.prisma.weekExam.update({
      where: { id: examId },
      data: {
        bonus,
        examScore,
        attended,
        sum: attended ? (examScore + bonus) : 0,
      },
    });
  }

  async createWeek(groupId: string, createWeekDto: CreateWeekDto) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { students: true },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (createWeekDto.weekNumber > 4) {
      throw new BadRequestException('Maximum of 4 weeks allowed');
    }

    const existing = await this.prisma.week.findUnique({
      where: {
        groupId_weekNumber: {
          groupId,
          weekNumber: createWeekDto.weekNumber,
        },
      },
    });
    if (existing) {
      throw new BadRequestException('Week already exists');
    }

    const week = await this.prisma.week.create({
      data: {
        groupId,
        weekNumber: createWeekDto.weekNumber,
      },
    });

    // Populate exams for current active students
    for (const student of group.students) {
      if (student.status === 'ACTIVE') {
        await this.prisma.weekExam.create({
          data: {
            weekId: week.id,
            studentId: student.studentId,
            bonus: 0,
            examScore: 0,
            sum: 0,
          },
        }).catch(() => {});
      }
    }

    return week;
  }

  async createLesson(groupId: string, weekId: string, createLessonDto: CreateLessonDto) {
    const week = await this.prisma.week.findUnique({
      where: { id: weekId },
      include: { lessons: true },
    });
    if (!week || week.groupId !== groupId) {
      throw new NotFoundException('Week not found in this group');
    }

    if (week.lessons.length >= 5) {
      throw new BadRequestException('This week already has 5 lessons');
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { students: true },
    });

    const lesson = await this.prisma.lesson.create({
      data: {
        weekId,
        date: new Date(createLessonDto.date),
      },
    });

    if (group) {
      for (const student of group.students) {
        if (student.status === 'ACTIVE') {
          await this.prisma.journalEntry.create({
            data: {
              lessonId: lesson.id,
              studentId: student.studentId,
              attended: true,
              score: 0,
            },
          }).catch(() => {});
        }
      }
    }

    // Automatically create next week if this is the 5th lesson and weekNumber < 4
    if (week.lessons.length + 1 === 5 && week.weekNumber < 4) {
      const nextWeekNumber = week.weekNumber + 1;
      const nextWeekExisting = await this.prisma.week.findFirst({
        where: {
          groupId,
          weekNumber: nextWeekNumber,
        },
      });

      if (!nextWeekExisting) {
        const nextWeek = await this.prisma.week.create({
          data: {
            groupId,
            weekNumber: nextWeekNumber,
          },
        });

        // Pre-populate week exams for all active students in the group
        if (group) {
          for (const student of group.students) {
            if (student.status === 'ACTIVE') {
              await this.prisma.weekExam.create({
                data: {
                  weekId: nextWeek.id,
                  studentId: student.studentId,
                  bonus: 0,
                  examScore: 0,
                  sum: 0,
                },
              }).catch(() => {});
            }
          }
        }
      }
    }

    return lesson;
  }

  async getChartData(groupId: string, userId: string, role: Role) {
    if (role === Role.STUDENT) {
      const isMember = await this.prisma.groupStudent.findUnique({
        where: { groupId_studentId: { groupId, studentId: userId } },
      });
      if (!isMember) {
        throw new ForbiddenException('Access denied to chart data');
      }
    }

    const weeks = await this.prisma.week.findMany({
      where: { groupId },
      include: {
        exams: true,
        lessons: {
          include: {
            journalEntries: true,
          },
        },
      },
      orderBy: { weekNumber: 'asc' },
    });

    const groupStudents = await this.prisma.groupStudent.findMany({
      where: { groupId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    const students = groupStudents.map(gs => gs.student);

    const data = weeks.map(w => {
      const hasExamsSet = w.exams.some(e => e.examScore > 0 || e.bonus > 0 || e.attended === false);
      const weekData: any = {
        week: `week ${w.weekNumber}`,
        hasExamsSet,
      };

      students.forEach(s => {
        const studentExam = w.exams.find(e => e.studentId === s.id);
        
        let weekScoreSum = 0;
        let weekScoreCount = 0;
        w.lessons.forEach(l => {
          l.journalEntries.forEach(je => {
            if (je.studentId === s.id && je.attended) {
              weekScoreSum += je.score;
              weekScoreCount++;
            }
          });
        });

        const averageLessonScore = weekScoreCount > 0 ? weekScoreSum / weekScoreCount : 0;
        const examGraded = studentExam && (studentExam.examScore > 0 || studentExam.bonus > 0 || studentExam.sum > 0);

        let grade = 0;
        if (examGraded || weekScoreCount > 0) {
          if (studentExam && studentExam.attended) {
            grade = studentExam.sum;
          } else if (weekScoreCount > 0) {
            grade = Math.round(averageLessonScore * 20);
          }
        }

        const name = `${s.firstName} ${s.lastName}`;
        weekData[name] = grade;
      });

      return weekData;
    });

    return {
      students: students.map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
      })),
      data,
    };
  }

  async deleteWeek(groupId: string, weekId: string) {
    const week = await this.prisma.week.findUnique({
      where: { id: weekId },
    });
    if (!week) {
      throw new NotFoundException('Week not found');
    }
    if (week.groupId !== groupId) {
      throw new BadRequestException('Week does not belong to this group');
    }

    return this.prisma.week.delete({
      where: { id: weekId },
    });
  }
}
