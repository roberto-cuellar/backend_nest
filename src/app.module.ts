import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuariosController } from './controllers/usuarios/usuarios.controller';
import { RolesController } from './controllers/roles/roles.controller';
import { UsersService } from './services/users/users.service';
import { RolesService } from './services/roles/roles.service';
import { AuthController } from './controllers/auth/auth.controller';
import { DatabaseModule } from './database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [
    AppController,
    UsuariosController,
    RolesController,
    AuthController,
  ],
  providers: [AppService, UsersService, RolesService, JwtStrategy],
})
export class AppModule {}
