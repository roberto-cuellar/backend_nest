import {
  Controller,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
  Delete,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuardGuard } from 'src/guards/auth_guard.guard';
import {
  UserDto,
  UserLoginDto,
  UserUpdateDto,
} from 'src/services/users/user.entity';
import { UsersService } from 'src/services/users/users.service';

  @Controller('auth')
  export class AuthController {
    constructor(private usersService: UsersService) {}

  @Post('create')
  create(@Body() payload: UserDto) {
    return this.usersService.createUser(payload);
  }

  @Post('login')
  login(@Body() payload: UserLoginDto) {
    return this.usersService.login(payload);
  }

  @Patch('update')
  @UseGuards(AuthGuardGuard)
  update(@Body() payload: UserUpdateDto, @Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.usersService.update(userId, payload);
  }

  @Delete('delete/:userId')
  @UseGuards(AuthGuardGuard)
  delete(@Param('userId') userId: string, @Req() req: Request) {
    const userRole = (req.user as any).userRole;

    if (userRole !== 'admin') {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción.',
      );
    }
    return this.usersService.deleteUser(userId);
  }
}
