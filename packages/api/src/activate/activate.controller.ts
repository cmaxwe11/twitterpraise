import {
  Body,
  Controller,
  Post,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ActivateInputDto } from './dto/activate-input.dto';
import { User } from '../users/schemas/users.schema';
import { ActivateService } from './activate.service';
import { MongooseClassSerializerInterceptor } from '../shared/interceptors/mongoose-class-serializer.interceptor';
import { EventLogService } from '../event-log/event-log.service';
import { EventLogTypeKey } from '../event-log/enums/event-log-type-key';

@Controller('activate')
@ApiTags('Activate')
@SerializeOptions({
  excludePrefixes: ['__'],
})
@UseInterceptors(MongooseClassSerializerInterceptor(User))
export class ActivateController {
  constructor(
    private activateService: ActivateService,
    private readonly eventLogService: EventLogService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Activate a user account in order to be able to give praise and receive rewards. Activation a user account creates a new User object or adds user account to User if it already exists.',
  })
  @ApiResponse({
    status: 200,
    description: 'The created (or updated) user.',
    type: User,
  })
  async activate(@Body() activateInputDto: ActivateInputDto): Promise<User> {
    const user = await this.activateService.activate(activateInputDto);

    await this.eventLogService.logEvent({
      typeKey: EventLogTypeKey.USER_ACCOUNT,
      description: `User Account ${activateInputDto.accountId} activated.`,
    });

    return user;
  }
}
