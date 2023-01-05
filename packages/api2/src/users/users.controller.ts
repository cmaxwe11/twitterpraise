import { UpdateUserRoleInputDto } from './dto/update-user-role-input.dto';
import { UsersService } from './users.service';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ObjectIdPipe } from '../shared/pipes/object-id.pipe';
import { User } from './schemas/users.schema';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { Permission } from '@/auth/enums/permission.enum';
import { PermissionsGuard } from '@/auth/guards/permissions.guard';
import { EventLogService } from '@/event-log/event-log.service';
import { AuthGuard } from '@nestjs/passport';
import { MongooseClassSerializerInterceptor } from '@/shared/mongoose-class-serializer.interceptor';
import { UserWithStatsDto } from './dto/user-with-stats.dto';

@Controller('users')
@ApiTags('Users')
@SerializeOptions({
  excludePrefixes: ['__'],
})
@UseInterceptors(MongooseClassSerializerInterceptor(User))
@UseGuards(PermissionsGuard)
@UseGuards(AuthGuard(['jwt', 'api-key']))
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventLogService: EventLogService,
  ) {}

  @Get()
  @Permissions(Permission.UsersFind)
  @ApiResponse({
    status: 200,
    description: 'All users',
    type: [User],
  })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Permissions(Permission.UsersFind)
  @ApiResponse({
    status: 200,
    description: 'A single user',
    type: UserWithStatsDto,
  })
  @ApiParam({ name: 'id', type: String })
  async findOne(
    @Param('id', ObjectIdPipe) id: Types.ObjectId,
  ): Promise<UserWithStatsDto> {
    const user = await this.usersService.findOneById(id);
    if (!user) throw new BadRequestException('User not found.');
    return user;
  }

  @Patch(':id/addRole')
  @Permissions(Permission.UsersManageRoles)
  @ApiResponse({
    status: 200,
    description: 'The updated user',
    type: UserWithStatsDto,
  })
  @ApiParam({ name: 'id', type: String })
  async addRole(
    @Param('id', ObjectIdPipe) id: Types.ObjectId,
    @Body() roleChange: UpdateUserRoleInputDto,
  ): Promise<UserWithStatsDto> {
    return this.usersService.addRole(id, roleChange);
  }

  @Patch(':id/removeRole')
  @Permissions(Permission.UsersManageRoles)
  @ApiResponse({
    status: 200,
    description: 'The updated user',
    type: UserWithStatsDto,
  })
  @ApiParam({ name: 'id', type: String })
  async removeRole(
    @Param('id', ObjectIdPipe) id: Types.ObjectId,
    @Body() roleChange: UpdateUserRoleInputDto,
  ): Promise<UserWithStatsDto> {
    return this.usersService.removeRole(id, roleChange);
  }
}
