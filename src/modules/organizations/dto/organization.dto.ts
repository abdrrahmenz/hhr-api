import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, Min, IsEmail } from 'class-validator';

export enum MarkupType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED = 'FIXED',
}

export class CreateOrganizationDto {
    @ApiProperty({ example: 'ABC Travel Agency' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'ABC-001' })
    @IsString()
    code: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ enum: MarkupType, default: MarkupType.PERCENTAGE })
    @IsOptional()
    @IsEnum(MarkupType)
    markupType?: MarkupType;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    markupValue?: number;
}

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class OrganizationResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    code: string;

    @ApiPropertyOptional()
    address?: string;

    @ApiPropertyOptional()
    phone?: string;

    @ApiPropertyOptional()
    email?: string;

    @ApiProperty()
    markupType: string;

    @ApiProperty()
    markupValue: number;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    userCount: number;
}
