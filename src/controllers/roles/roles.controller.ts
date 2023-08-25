import { Body, Controller, Post, Patch, Param, Delete } from '@nestjs/common';
import { RoleDto } from 'src/dtos/roles.dto';
import { RolesService } from 'src/services/roles/roles.service';

@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post('create')
  create(@Body() payload: RoleDto) {
    return this.rolesService.create(payload);
  }

  @Patch('update/:oldRoleName')
  updateRole(
    @Param('oldRoleName') oldRoleName: string,
    @Body() newRole: RoleDto,
  ) {
    return this.rolesService.updateRole(oldRoleName, newRole);
  }

  @Delete('delete/:roleName')
  deleteRole(@Param('roleName') roleName: string) {
    return this.rolesService.deleteRole(roleName);
  }
}
