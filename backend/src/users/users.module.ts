import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { StudentController } from './student.controller';

@Module({
  controllers: [UsersController, StudentController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
