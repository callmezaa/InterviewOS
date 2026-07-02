import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { Plan } from '@prisma/client';
import type { Prisma } from '@prisma/client';

@Injectable()
export class BrandingService {
  constructor(private readonly prisma: PrismaService) {}

  async getBranding(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, plan: true },
    });

    if (!user?.organizationId) {
      return this.getDefaultBranding();
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    if (!org) return this.getDefaultBranding();

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logoUrl,
      primaryColor: org.primaryColor,
      isCustomized: true,
      theme: org.theme ?? null,
    };
  }

  async getBrandingBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (!org) return this.getDefaultBranding();

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logoUrl,
      primaryColor: org.primaryColor,
      isCustomized: true,
      theme: org.theme ?? null,
    };
  }

  async updateBranding(userId: string, dto: UpdateBrandingDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, plan: true },
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.plan !== Plan.ENTERPRISE) {
      throw new ForbiddenException(
        'Custom branding is available on the Enterprise plan.',
      );
    }

    const updateData: Prisma.OrganizationUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.logoUrl !== undefined) updateData.logoUrl = dto.logoUrl;
    if (dto.primaryColor !== undefined) updateData.primaryColor = dto.primaryColor;
    if (dto.theme !== undefined) {
      updateData.theme = dto.theme as unknown as Prisma.InputJsonValue;
    }

    let orgId = user.organizationId;

    if (!orgId) {
      const slug = this.generateSlug(dto.name || 'my-company');
      const org = await this.prisma.organization.create({
        data: {
          name: dto.name || 'My Company',
          slug,
          logoUrl: dto.logoUrl,
          primaryColor: dto.primaryColor || '#0066cc',
          theme: (dto.theme as unknown as Prisma.InputJsonValue) ?? undefined,
        },
      });
      orgId = org.id;

      await this.prisma.user.update({
        where: { id: userId },
        data: { organizationId: orgId },
      });
    } else {
      await this.prisma.organization.update({
        where: { id: orgId },
        data: updateData,
      });
    }

    return this.getBranding(userId);
  }

  private getDefaultBranding() {
    return {
      id: null,
      name: 'InterviewOS',
      slug: null,
      logoUrl: null,
      primaryColor: '#0066cc',
      isCustomized: false,
      theme: null,
    };
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
    return `${base}-${Date.now().toString(36)}`;
  }
}
