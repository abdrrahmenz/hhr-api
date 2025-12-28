import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';
export declare class OrganizationsController {
    private organizationsService;
    constructor(organizationsService: OrganizationsService);
    findAll(isActive?: string, page?: string, limit?: string): Promise<{
        data: {
            id: string;
            name: string;
            code: string;
            address: string | null;
            phone: string | null;
            email: string | null;
            markupType: string;
            markupValue: number;
            isActive: boolean;
            userCount: number;
            createdAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        totalB2BBookings: number;
        totalB2BRevenue: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        code: string;
        address: string | null;
        phone: string | null;
        email: string | null;
        markupType: string;
        markupValue: number;
        isActive: boolean;
        userCount: number;
        bookingCount: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getOrganizationUsers(id: string, page?: string, limit?: string): Promise<{
        data: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: boolean;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    create(dto: CreateOrganizationDto): Promise<{
        id: string;
        name: string;
        code: string;
        markupType: string;
        markupValue: number;
    }>;
    update(id: string, dto: UpdateOrganizationDto): Promise<{
        id: string;
        name: string;
        code: string;
        markupType: string;
        markupValue: number;
        isActive: boolean;
    }>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
