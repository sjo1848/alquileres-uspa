import { Body, Controller, Param, Post } from '@nestjs/common';
import { ContactService } from './contact.service.js';
import { CreateContactEventDto } from './contact.types.js';

@Controller('public/listings')
export class ContactController {
  constructor(private readonly contacts: ContactService) {}
  @Post(':id/contact')
  create(@Param('id') id: string, @Body() input: CreateContactEventDto) {
    return this.contacts.create(id, input);
  }
}
