export declare enum MarkupType {
    PERCENTAGE = "PERCENTAGE",
    FIXED = "FIXED"
}
export declare class CreateOrganizationDto {
    name: string;
    code: string;
    address?: string;
    phone?: string;
    email?: string;
    markupType?: MarkupType;
    markupValue?: number;
}
declare const UpdateOrganizationDto_base: import("@nestjs/common").Type<Partial<CreateOrganizationDto>>;
export declare class UpdateOrganizationDto extends UpdateOrganizationDto_base {
    isActive?: boolean;
}
export declare class OrganizationResponseDto {
    id: string;
    name: string;
    code: string;
    address?: string;
    phone?: string;
    email?: string;
    markupType: string;
    markupValue: number;
    isActive: boolean;
    userCount: number;
}
export {};
