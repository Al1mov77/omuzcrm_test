import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GiveCoinsDto } from './dto/give-coins.dto';
import * as bcrypt from 'bcrypt';
import { Role, Language } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        branch: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Performance Calculations for students
    let performance = null;
    let groupsRoadmap: any[] = [];

    if (user.role === Role.STUDENT) {
      // Fetch journal entries
      const journalEntries = await this.prisma.journalEntry.findMany({
        where: { studentId: userId },
        include: {
          lesson: {
            include: {
              week: {
                include: {
                  group: {
                    include: {
                      schedules: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      let presentHours = 0;
      let absentHours = 0;
      let lateMins = 0;

      const weeklyStats: Record<number, { presentHours: number; absentHours: number; lateMins: number }> = {};
      for (let i = 1; i <= 5; i++) {
        weeklyStats[i] = { presentHours: 0, absentHours: 0, lateMins: 0 };
      }

      for (const entry of journalEntries) {
        const weekNum = entry.lesson.week.weekNumber;
        if (!weeklyStats[weekNum]) {
          weeklyStats[weekNum] = { presentHours: 0, absentHours: 0, lateMins: 0 };
        }

        // Calculate duration in hours
        const group = entry.lesson.week.group;
        // Find schedule matching the day of the week
        const dateObj = new Date(entry.lesson.date);
        const dayOfWeek = dateObj.getDay();
        const prismaDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Adjust Sunday to 7
        const schedule = group.schedules.find(s => s.dayOfWeek === prismaDayOfWeek) || group.schedules[0];

        let durationHours = 2; // Default fallback
        if (schedule && typeof schedule.startTime === 'string' && typeof schedule.endTime === 'string') {
          try {
            const [startH, startM] = schedule.startTime.split(':').map(Number);
            const [endH, endM] = schedule.endTime.split(':').map(Number);
            if (!isNaN(startH) && !isNaN(endH)) {
              durationHours = (endH + (endM || 0) / 60) - (startH + (startM || 0) / 60);
            }
          } catch (e) {
            console.error('Error calculating duration hours', e);
          }
        }

        if (entry.attended) {
          presentHours += durationHours;
          weeklyStats[weekNum].presentHours += durationHours;
          // Parse late minutes from note
          if (entry.note) {
            const match = entry.note.match(/late\s*(\d+)/i) || entry.note.match(/опоздал\s*на\s*(\d+)/i) || entry.note.match(/дер\s*(\d+)/i);
            if (match) {
              const mins = parseInt(match[1], 10);
              lateMins += mins;
              weeklyStats[weekNum].lateMins += mins;
            }
          }
        } else {
          absentHours += durationHours;
          weeklyStats[weekNum].absentHours += durationHours;
        }
      }

      // Round weekly hours
      Object.keys(weeklyStats).forEach(key => {
        const w = weeklyStats[Number(key)];
        w.presentHours = Math.round(w.presentHours);
        w.absentHours = Math.round(w.absentHours);
      });

      const sortedEntries = [...journalEntries].sort(
        (a, b) => new Date(a.lesson.date).getTime() - new Date(b.lesson.date).getTime()
      );
      const attendanceHistory = sortedEntries.map((entry, index) => {
        let late = 0;
        if (entry.note) {
          const match = entry.note.match(/late\s*(\d+)/i) || entry.note.match(/опоздал\s*на\s*(\d+)/i) || entry.note.match(/дер\s*(\d+)/i);
          if (match) {
            late = parseInt(match[1], 10);
          }
        }
        return {
          lesson: `Урок ${index + 1}`,
          score: entry.attended ? entry.score : 0,
          present: entry.attended ? 'Был' : 'Н/Б',
          late,
          comment: entry.note || '',
          date: entry.lesson.date ? new Date(entry.lesson.date).toLocaleDateString() : '',
        };
      });

      performance = {
        presentHours: Math.round(presentHours),
        absentHours: Math.round(absentHours),
        lateMins,
        attendanceHistory,
        weeklyStats,
      };

      // Groups Roadmap with scores
      const studentGroups = await this.prisma.groupStudent.findMany({
        where: { studentId: userId },
        include: {
          group: {
            include: {
              mentor: true,
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
      const uniqueStudentGroupsMap = new Map<string, typeof studentGroups[0]>();
      for (const gs of studentGroups) {
        if (!uniqueStudentGroupsMap.has(gs.groupId)) {
          uniqueStudentGroupsMap.set(gs.groupId, gs);
        }
      }
      const uniqueStudentGroups = Array.from(uniqueStudentGroupsMap.values());

      groupsRoadmap = uniqueStudentGroups.map(gs => {
        const group = gs.group;

        const weeksData = group.weeks.map(w => {
          let weekScoreSum = 0;
          let weekScoreCount = 0;

          w.lessons.forEach(l => {
            l.journalEntries.forEach(je => {
              if (je.studentId === userId && je.attended) {
                weekScoreSum += je.score;
                weekScoreCount++;
              }
            });
          });

          const exam = w.exams.find(e => e.studentId === userId);
          const averageLessonScore = weekScoreCount > 0 ? (weekScoreSum / weekScoreCount) : 0;
          const weekExamScore = exam ? exam.examScore : 0;
          const weekBonus = exam ? exam.bonus : 0;
          const weekTotalSum = exam ? exam.sum : 0;

          return {
            weekNumber: w.weekNumber,
            averageScore: Math.round(averageLessonScore * 10) / 10,
            examScore: weekExamScore,
            bonus: weekBonus,
            sum: weekTotalSum,
          };
        });

        // Compute overall average (mapped to 0-100 or 0-10 based on standard)
        let overallAverage = 0;
        let totalWeeksCount = 0;
        let weeklySumAccumulator = 0;

        group.weeks.forEach(w => {
          // Check if ANY student in the group has a graded exam or attendance in this week
          const anyExamGraded = w.exams.some(e => e.examScore > 0 || e.bonus > 0 || e.sum > 0 || e.attended === false);
          
          let myWeekScoreSum = 0;
          let myWeekScoreCount = 0;
          w.lessons.forEach(l => {
            l.journalEntries.forEach(je => {
              if (je.studentId === userId && je.attended) {
                myWeekScoreSum += je.score;
                myWeekScoreCount++;
              }
            });
          });

          const anyLessonGraded = w.lessons.some(l =>
            l.journalEntries.some(je => je.score > 0 || je.attended === false)
          );

          const isGraded = anyExamGraded || anyLessonGraded;

          if (isGraded) {
            const myExam = w.exams.find(e => e.studentId === userId);
            let weekGrade = 0;

            if (myExam && myExam.attended) {
              weekGrade = myExam.sum;
            } else if (myWeekScoreCount > 0) {
              const myAvg = myWeekScoreSum / myWeekScoreCount;
              weekGrade = Math.round(myAvg * 20);
            }

            weeklySumAccumulator += weekGrade;
            totalWeeksCount++;
          }
        });

        if (totalWeeksCount > 0) {
          overallAverage = Math.round(weeklySumAccumulator / totalWeeksCount);
        }

        return {
          groupId: group.id,
          groupName: group.name,
          mentorName: group.mentor ? `${group.mentor.firstName} ${group.mentor.lastName}` : 'TBD',
          status: gs.status,
          joinedAt: gs.joinedAt,
          overallAverage,
          weeks: weeksData.sort((a, b) => a.weekNumber - b.weekNumber),
        };
      });
    }

    const { passwordHash, ...safeUser } = user;
    return {
      ...safeUser,
      performance,
      groupsRoadmap,
    };
  }

  async updateMe(userId: string, updateDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: updateDto.firstName,
        lastName: updateDto.lastName,
        address: updateDto.address,
        parentPhone: updateDto.parentPhone,
        language: updateDto.language,
        birthDate: updateDto.birthDate ? new Date(updateDto.birthDate) : undefined,
      },
    });

    return this.getMe(userId);
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return this.getMe(userId);
  }

  async findOne(userId: string) {
    return this.getMe(userId);
  }

  async findAll(role?: Role, branchId?: string, search?: string, groupId?: string, courseId?: string) {
    const where: any = {};

    if (role) {
      where.role = role;
    }
    if (branchId) {
      where.branchId = branchId;
    }
    if (groupId) {
      where.groupStudents = {
        some: {
          groupId,
        },
      };
    }
    if (courseId) {
      where.groupStudents = {
        some: {
          group: {
            courseId,
          },
        },
      };
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      include: { 
        branch: true,
        groupStudents: {
          include: {
            group: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    return users.map(({ passwordHash, ...safeUser }) => safeUser);
  }

  async createUser(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { phone: createUserDto.phone },
    });
    if (existing) {
      throw new BadRequestException('User with this phone number already exists');
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        phone: createUserDto.phone,
        passwordHash,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: createUserDto.role,
        branchId: createUserDto.branchId,
        address: createUserDto.address,
        parentPhone: createUserDto.parentPhone,
        language: createUserDto.language || Language.RU,
        birthDate: createUserDto.birthDate ? new Date(createUserDto.birthDate) : undefined,
      },
    });

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async deleteUser(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }

  async giveCoins(userId: string, giveCoinsDto: GiveCoinsDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== Role.STUDENT) {
      throw new BadRequestException('Coins can only be awarded to students');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        coins: {
          increment: giveCoinsDto.amount,
        },
      },
    });

    // Create CoinTransaction
    await this.prisma.coinTransaction.create({
      data: {
        userId,
        amount: giveCoinsDto.amount,
        reason: giveCoinsDto.reason,
      },
    });

    const { passwordHash: _, ...safeUser } = updatedUser;
    return safeUser;
  }

  async updateUser(userId: string, updateDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data: any = {
      firstName: updateDto.firstName,
      lastName: updateDto.lastName,
      address: updateDto.address,
      parentPhone: updateDto.parentPhone,
      language: updateDto.language,
      role: updateDto.role,
      branchId: updateDto.branchId,
    };

    if (updateDto.birthDate) {
      data.birthDate = new Date(updateDto.birthDate);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.getMe(userId);
  }
}
