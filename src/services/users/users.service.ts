import { Client } from 'pg';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserLoginDto, UserUpdateDto } from './user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @Inject('PG') private clientPg: Client,
    private readonly jwtService: JwtService,
  ) {
    this.ensureTableExists();
  }

  async ensureTableExists() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            phone BIGINT NOT NULL,
            role VARCHAR(50) NOT NULL,
            is_delete BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
      await this.clientPg.query(createTableQuery);
      console.log('Tabla de usuarios asegurada o creada.');
    } catch (error) {
      console.error('Error al crear la tabla de usuarios:', error);
    }
  }

  async createUser(payload: any) {
    const { full_name, email, password, phone, role } = payload;

    const availableRoles = await this.getAvailableRoles();

    if (availableRoles.length === 0) {
      throw new NotFoundException(
        'No hay roles disponibles, por favor crea primero roles.',
      );
    }

    if (!availableRoles.includes(role)) {
      throw new BadRequestException(
        `El role proporcionado no es válido. Roles Disponibles: ${availableRoles}`,
      );
    }

    const insertUserQuery = `
        INSERT INTO users (full_name, email, password, phone, role, is_delete, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, full_name, email, phone, role, is_delete, created_at, updated_at;
    `;

    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const result = await this.clientPg.query(insertUserQuery, [
        full_name,
        email,
        hashedPassword,
        phone,
        role,
        false,
      ]);

      if (result.rows[0]) {
        return result.rows;
      }
    } catch (error) {
      console.error('Error al insertar el usuario en la base de datos:', error);
      throw new ConflictException(`Error al crear el usuario ${error}`);
    }
  }

  async login(user: UserLoginDto) {
    const query = `SELECT id, full_name, role, password FROM users WHERE email = $1`;
    const result = await this.clientPg.query(query, [user.email]);

    if (result.rowCount === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const storedHashedPassword = result.rows[0].password;

    const passwordMatch = await bcrypt.compare(
      user.password,
      storedHashedPassword,
    );

    if (!passwordMatch) {
      throw new NotFoundException('Contraseña o Usuario incorrecto');
    }

    const payload = {
      userId: result.rows[0].id,
      userName: result.rows[0].full_name,
      userRole: result.rows[0].role,
    };

    const jwt = this.jwtService.sign(payload);

    return {
      message: 'Inicio de sesión exitoso',
      access_token: jwt,
      userData: payload,
    };
  }


  async deleteUser(userId: string) {
    const query = `UPDATE users SET is_delete = true WHERE id = $1 RETURNING *`;
    const result = await this.clientPg.query(query, [userId]);

    if (result.rowCount === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      message: 'Usuario inactivado con éxito',
    };
  }

  async update(userId: string, userUpdatePayload: UserUpdateDto): Promise<any> {
    // Comprobación de existencia de usuario
    const queryCheck = `SELECT * FROM users WHERE id = $1`;
    const resultCheck = await this.clientPg.query(queryCheck, [userId]);

    if (resultCheck.rowCount === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const availableRoles = await this.getAvailableRoles();

    if (availableRoles.length === 0) {
      throw new NotFoundException(
        'No hay roles disponibles, por favor crea primero roles.',
      );
    }

    if (
      userUpdatePayload.role &&
      !availableRoles.includes(userUpdatePayload.role)
    ) {
      throw new BadRequestException(
        `El role proporcionado no es válido. Roles disponibles: ${availableRoles}`,
      );
    }

    const updateFields = Object.entries(userUpdatePayload)
      .map(([key, value], index) => `${key} = $${index + 2}`)
      .join(', ');
    const queryUpdate = `UPDATE users SET ${updateFields} WHERE id = $1`;

    const values = [userId, ...Object.values(userUpdatePayload)];

    try {
      await this.clientPg.query(queryUpdate, values);
      return { message: 'Usuario actualizado exitosamente' };
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      throw new InternalServerErrorException('Error al actualizar el usuario');
    }
  }

  async getAvailableRoles(): Promise<string[]> {
    const query = `SELECT name FROM roles WHERE is_delete = false`;
    const result = await this.clientPg.query(query);
    return result.rows.map((row: any) => row.name);
  }
}
