import { PrismaService } from '../../prisma';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserRole } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(filters?: {
        role?: UserRole;
        organizationId?: string;
        isActive?: boolean;
    }, page?: number, limit?: number): Promise<{
        data: {
            id: string;
            email: string;
            name: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: boolean;
            organization: {
                id: string;
                name: string;
            } | null;
            createdAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        name: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        organization: {
            id: string;
            email: string | null;
            name: string;
            phone: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            address: string | null;
            markupType: string;
            markupValue: import("@prisma/client-runtime-utils").Decimal;
        } | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateUserDto): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getUserStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        byRole: {};
    }>;
}
