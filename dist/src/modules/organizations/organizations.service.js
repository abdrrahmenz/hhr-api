"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../../prisma");
let OrganizationsService = class OrganizationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filters, page = 1, limit = 20) {
        const where = {};
        if (filters?.isActive !== undefined)
            where.isActive = filters.isActive;
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
    async findOne(id) {
        const org = await this.prisma.organization.findUnique({
            where: { id },
            include: { _count: { select: { users: true, bookings: true } } },
        });
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
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
    async create(dto) {
        const existing = await this.prisma.organization.findUnique({
            where: { code: dto.code },
        });
        if (existing) {
            throw new common_1.ConflictException('Organization code already exists');
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
    async update(id, dto) {
        const org = await this.prisma.organization.findUnique({ where: { id } });
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        if (dto.code && dto.code !== org.code) {
            const existing = await this.prisma.organization.findUnique({ where: { code: dto.code } });
            if (existing) {
                throw new common_1.ConflictException('Organization code already in use');
            }
        }
        const updated = await this.prisma.organization.update({
            where: { id },
            data: dto,
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
    async delete(id) {
        const org = await this.prisma.organization.findUnique({ where: { id } });
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        await this.prisma.organization.update({
            where: { id },
            data: { isActive: false },
        });
        return { success: true, message: 'Organization deactivated' };
    }
    async getOrganizationUsers(id, page = 1, limit = 20) {
        const org = await this.prisma.organization.findUnique({ where: { id } });
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
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
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map