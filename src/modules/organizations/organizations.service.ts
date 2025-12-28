import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';

@Injectable()
export class OrganizationsService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters?: { isActive?: boolean }, page = 1, limit = 20) {
        const where: any = {};
        if (filters?.isActive !== undefined) where.isActive = filters.isActive;

        const skip = (page - 1) * limit;

        const [organizations, total] = await Promise.all([
            this.prisma.organization.findMany({
                where,
                include: { _count: { select: { users: true } } },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.organization.count({ where }),
        ]);

        return {
            data: organizations.map(o => ({
                id: o.id,
                name: o.name,
                code: o.code,
                address: o.address,
                phone: o.phone,
                email: o.email,
                markupType: o.markupType,
                markupValue: o.markupValue.toNumber(),
                isActive: o.isActive,
                userCount: o._count.users,
                createdAt: o.createdAt,
            })),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async findOne(id: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id },
            include: { _count: { select: { users: true, bookings: true } } },
        });

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        return {
            id: org.id,
            name: org.name,
            code: org.code,
            address: org.address,
            phone: org.phone,
            email: org.email,
            markupType: org.markupType,
            markupValue: org.markupValue.toNumber(),
            isActive: org.isActive,
            userCount: org._count.users,
            bookingCount: org._count.bookings,
            createdAt: org.createdAt,
            updatedAt: org.updatedAt,
        };
    }

    async create(dto: CreateOrganizationDto) {
        const existing = await this.prisma.organization.findUnique({
            where: { code: dto.code },
        });

        if (existing) {
            throw new ConflictException('Organization code already exists');
        }

        const org = await this.prisma.organization.create({
            data: {
                name: dto.name,
                code: dto.code,
                address: dto.address,
                phone: dto.phone,
                email: dto.email,
                markupType: dto.markupType || 'PERCENTAGE',
                markupValue: dto.markupValue || 0,
            },
        });

        return {
            id: org.id,
            name: org.name,
            code: org.code,
            markupType: org.markupType,
            markupValue: org.markupValue.toNumber(),
        };
    }

    async update(id: string, dto: UpdateOrganizationDto) {
        const org = await this.prisma.organization.findUnique({ where: { id } });

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        if (dto.code && dto.code !== org.code) {
            const existing = await this.prisma.organization.findUnique({ where: { code: dto.code } });
            if (existing) {
                throw new ConflictException('Organization code already in use');
            }
        }

        const updated = await this.prisma.organization.update({
            where: { id },
            data: dto as any,
        });

        return {
            id: updated.id,
            name: updated.name,
            code: updated.code,
            markupType: updated.markupType,
            markupValue: updated.markupValue.toNumber(),
            isActive: updated.isActive,
        };
    }

    async delete(id: string) {
        const org = await this.prisma.organization.findUnique({ where: { id } });

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        await this.prisma.organization.update({
            where: { id },
            data: { isActive: false },
        });

        return { success: true, message: 'Organization deactivated' };
    }

    async getOrganizationUsers(id: string, page = 1, limit = 20) {
        const org = await this.prisma.organization.findUnique({ where: { id } });

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: { organizationId: id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where: { organizationId: id } }),
        ]);

        return {
            data: users.map(u => ({
                id: u.id,
                email: u.email,
                name: u.name,
                role: u.role,
                isActive: u.isActive,
            })),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async getOrganizationStats() {
        const [total, active, totalBookings, totalRevenue] = await Promise.all([
            this.prisma.organization.count(),
            this.prisma.organization.count({ where: { isActive: true } }),
            this.prisma.booking.count({ where: { organizationId: { not: null } } }),
            this.prisma.booking.aggregate({
                where: { organizationId: { not: null }, status: 'TICKETED' },
                _sum: { totalAmount: true },
            }),
        ]);

        return {
            total,
            active,
            inactive: total - active,
            totalB2BBookings: totalBookings,
            totalB2BRevenue: totalRevenue._sum.totalAmount?.toNumber() || 0,
        };
    }
}
