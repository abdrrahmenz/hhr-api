import { UserRole } from '@prisma/client';
export declare class CreateUserDto {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: UserRole;
    organizationId?: string;
}
declare const UpdateUserDto_base: import("@nestjs/common").Type<Partial<CreateUserDto>>;
export declare class UpdateUserDto extends UpdateUserDto_base {
    isActive?: boolean;
}
export declare class UserResponseDto {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    isActive: boolean;
    organizationId?: string;
}
export {};
