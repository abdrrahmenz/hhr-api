import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters?: { role?: UserRole; organizationId?: string; isActive?: boolean }, page = 1, limit = 20) {
        const where: any = {};

        if (filters?.role) where.role = filters.role;
        if (filters?.organizationId) where.organizationId = filters.organizationId;
        if (filters?.isActive !== undefined) where.isActive = filters.isActive;

        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: { organization: true },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users.map(u => ({
                id: u.id,
                email: u.email,
                name: u.name,
                phone: u.phone,
                role: u.role,
                isActive: u.isActive,
                organization: u.organization ? { id: u.organization.id, name: u.organization.name } : null,
                createdAt: u.createdAt,
            })),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { organization: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            organization: user.organization,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async create(dto: CreateUserDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                name: dto.name,
                phone: dto.phone,
                role: dto.role,
                organizationId: dto.organizationId,
            },
        });

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
    }

    async update(id: string, dto: UpdateUserDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const updateData: any = { ...dto };

        if (dto.password) {
            updateData.password = await bcrypt.hash(dto.password, 10);
        }

        if (dto.email && dto.email !== user.email) {
            const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
            if (existing) {
                throw new ConflictException('Email already in use');
            }
        }

        const updated = await this.prisma.user.update({
            where: { id },
            data: updateData,
        });

        return {
            id: updated.id,
            email: updated.email,
            name: updated.name,
            role: updated.role,
            isActive: updated.isActive,
        };
    }

    async delete(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Soft delete - just deactivate
        await this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });

        return { success: true, message: 'User deactivated' };
    }

    async getUserStats() {
        const [total, active, byRole] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { isActive: true } }),
            this.prisma.user.groupBy({
                by: ['role'],
                _count: true,
            }),
        ]);

        return {
            total,
            active,
            inactive: total - active,
            byRole: byRole.reduce((acc, r) => ({ ...acc, [r.role]: r._count }), {}),
        };
    }
}
