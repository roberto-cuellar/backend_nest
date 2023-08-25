import { Client } from 'pg';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleDto } from 'src/dtos/roles.dto';

@Injectable()
export class RolesService {
  constructor(
    @Inject('PG') private clientPg: Client,
    private readonly jwtService: JwtService,
  ) {
    this.ensureTableExists();
  }

  async ensureTableExists() {
    const createTableQuery = `
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                is_delete BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `;

    try {
      await this.clientPg.query(createTableQuery);
      console.log('Tabla de roles asegurada o creada.');
    } catch (error) {
      console.error('Error al crear la tabla de roles:', error);
    }
  }

  async create(payload: RoleDto) {
    const { role } = payload;
    const insertCreateRoleQuery = `
        INSERT INTO roles (name, is_delete, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING id, name, is_delete, created_at, updated_at;
    `;

    try {
      const result = await this.clientPg.query(insertCreateRoleQuery, [
        role,
        false,
      ]);

      if (result.rows[0]) {
        return result.rows;
      }
    } catch (error) {
      console.error('Error al crear un rol en la base de datos:', error);
      throw new ConflictException(`Error al crear el rol ${error}`);
    }
  }

  async updateRole(oldRoleName: string, newRole: RoleDto) {
    const checkRoleExistenceQuery = `SELECT id FROM roles WHERE name = $1;`;
    const roleExists = await this.clientPg.query(checkRoleExistenceQuery, [
      oldRoleName,
    ]);

    if (roleExists.rowCount === 0) {
      throw new NotFoundException(`Rol ${oldRoleName} no encontrado`);
    }

    const updateRoleQuery = `UPDATE roles SET name = $1 WHERE name = $2;`;
    await this.clientPg.query(updateRoleQuery, [newRole.role, oldRoleName]);

    const updateUserRoleQuery = `UPDATE users SET role = $1 WHERE role = $2;`;
    await this.clientPg.query(updateUserRoleQuery, [newRole.role, oldRoleName]);

    return { message: 'Rol actualizado exitosamente' };
  }

  async deleteRole(roleName: string) {
    const checkRoleExistenceQuery = `SELECT id FROM roles WHERE name = $1 AND is_delete = false;`;
    const roleExists = await this.clientPg.query(checkRoleExistenceQuery, [
      roleName,
    ]);

    if (roleExists.rowCount === 0) {
      throw new NotFoundException(`Rol ${roleName} no encontrado`);
    }

    const checkUsersWithRoleQuery = `SELECT id FROM users WHERE role = $1 AND is_delete = false;`;
    const usersWithRole = await this.clientPg.query(checkUsersWithRoleQuery, [
      roleName,
    ]);

    if (usersWithRole.rowCount > 0) {
      throw new ConflictException(
        `No puedes eliminar el rol ${roleName} porque hay usuarios asociados a él.`,
      );
    }

    const deleteRoleQuery = `UPDATE roles SET is_delete = true WHERE name = $1;`;
    await this.clientPg.query(deleteRoleQuery, [roleName]);

    return { message: 'Rol eliminado exitosamente' };
  }

  async getExistingRoles() {
    const fetchRolesQuery = `SELECT id, name, created_at, updated_at FROM roles WHERE is_delete = false;`;

    const roles = await this.clientPg.query(fetchRolesQuery);

    if (roles.rowCount === 0) {
      throw new NotFoundException('No hay roles disponibles');
    }

    return roles.rows;
  }
}
