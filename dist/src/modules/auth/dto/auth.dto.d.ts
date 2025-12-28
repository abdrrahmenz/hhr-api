import { UserRole } from '@prisma/client';
export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
    phone?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class AdminCreateUserDto extends RegisterDto {
    role: UserRole;
    organizationId?: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
    };
}
