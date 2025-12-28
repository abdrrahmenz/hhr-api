import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsInt, Min, Max, IsOptional, IsEnum } from 'class-validator';

export enum TripType {
    ONE_WAY = 'ONE_WAY',
    ROUND_TRIP = 'ROUND_TRIP',
}

export class SearchTrainDto {
    @ApiProperty({ example: 'CITY_A' })
    @IsString()
    origin: string;

    @ApiProperty({ example: 'CITY_B' })
    @IsString()
    destination: string;

    @ApiProperty({ example: '2024-01-15' })
    @IsDateString()
    departureDate: string;

    @ApiPropertyOptional({ example: '2024-01-20' })
    @IsOptional()
    @IsDateString()
    returnDate?: string;

    @ApiProperty({ default: 1, minimum: 1, maximum: 9 })
    @IsInt()
    @Min(1)
    @Max(9)
    passengerCount: number;

    @ApiProperty({ enum: TripType, default: TripType.ONE_WAY })
    @IsEnum(TripType)
    tripType: TripType;
}

export class PassengerDto {
    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiProperty()
    @IsString()
    idType: string;

    @ApiProperty()
    @IsString()
    idNumber: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;
}

export class CreateBookingDto {
    @ApiProperty({ description: 'Selected train/fare ID from search' })
    @IsString()
    fareId: string;

    @ApiProperty({ enum: TripType })
    @IsEnum(TripType)
    tripType: TripType;

    @ApiProperty({ example: 'CITY_A' })
    @IsString()
    origin: string;

    @ApiProperty({ example: 'CITY_B' })
    @IsString()
    destination: string;

    @ApiProperty()
    @IsDateString()
    departureDate: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    returnDate?: string;

    @ApiProperty({ type: [PassengerDto] })
    passengers: PassengerDto[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    returnFareId?: string;
}

export class BookingResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    bookingCode: string;

    @ApiProperty()
    otaBookingRef: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    priceIDR: number;

    @ApiProperty()
    priceSAR: number;

    @ApiProperty()
    totalAmount: number;
}
