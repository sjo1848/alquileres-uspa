import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export type AdminAuditInput = {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  listingId?: string;
  targetOwnerId?: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(
    input: AdminAuditInput,
    db: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    return db.adminAuditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        listingId: input.listingId,
        targetOwnerId: input.targetOwnerId,
        metadata: input.metadata ?? {},
      },
    });
  }

  list(listingId?: string) {
    return this.prisma.adminAuditLog.findMany({
      where: listingId ? { listingId } : undefined,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    });
  }
}
