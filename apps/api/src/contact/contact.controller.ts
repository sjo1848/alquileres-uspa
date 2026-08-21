import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ContactService } from './contact.service.js';
import {
  CreateContactEventDto,
  UpdateContactEventStateDto,
} from './contact.types.js';

@Controller('public/listings')
export class ContactController {
  constructor(private readonly contacts: ContactService) {}
  @Post(':id/contact')
  create(@Param('id') id: string, @Body() input: CreateContactEventDto) {
    return this.contacts.create(id, input);
  }
}

@Controller('owner/contact-events')
@Roles(Role.OWNER)
@UseGuards(AuthGuard, RolesGuard)
export class OwnerContactController {
  constructor(private readonly contacts: ContactService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.contacts.listMine(req.user!.id);
  }

  @Get(':id')
  get(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.contacts.getMine(req.user!.id, id);
  }

  @Patch(':id/state')
  updateState(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() input: UpdateContactEventStateDto,
  ) {
    return this.contacts.updateState(req.user!.id, id, input.state);
  }
}
