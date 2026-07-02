import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import {
  OWNERSHIP_KEY,
  OwnershipMetadata,
} from '../decorators/ownership.decorator';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get<OwnershipMetadata>(
      OWNERSHIP_KEY,
      context.getHandler(),
    );
    if (!metadata) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) throw new UnauthorizedException();

    const resourceId = request.params[metadata.paramName];
    if (!resourceId) {
      throw new ForbiddenException('Resource identifier missing from request');
    }

    const participant = await this.prisma.participant.findFirst({
      where: { userId: user.id, interviewId: resourceId },
    });
    if (!participant) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }
}
