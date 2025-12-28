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
exports.BookingResponseDto = exports.CreateBookingDto = exports.PassengerDto = exports.SearchTrainDto = exports.TripType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var TripType;
(function (TripType) {
    TripType["ONE_WAY"] = "ONE_WAY";
    TripType["ROUND_TRIP"] = "ROUND_TRIP";
})(TripType || (exports.TripType = TripType = {}));
class SearchTrainDto {
    origin;
    destination;
    departureDate;
    returnDate;
    passengerCount;
    tripType;
}
exports.SearchTrainDto = SearchTrainDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'CITY_A' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchTrainDto.prototype, "origin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'CITY_B' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchTrainDto.prototype, "destination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SearchTrainDto.prototype, "departureDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-20' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SearchTrainDto.prototype, "returnDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: 1, minimum: 1, maximum: 9 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(9),
    __metadata("design:type", Number)
], SearchTrainDto.prototype, "passengerCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: TripType, default: TripType.ONE_WAY }),
    (0, class_validator_1.IsEnum)(TripType),
    __metadata("design:type", String)
], SearchTrainDto.prototype, "tripType", void 0);
class PassengerDto {
    title;
    firstName;
    lastName;
    idType;
    idNumber;
    phone;
    email;
    dateOfBirth;
}
exports.PassengerDto = PassengerDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PassengerDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PassengerDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PassengerDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PassengerDto.prototype, "idType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PassengerDto.prototype, "idNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PassengerDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PassengerDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], PassengerDto.prototype, "dateOfBirth", void 0);
class CreateBookingDto {
    fareId;
    tripType;
    origin;
    destination;
    departureDate;
    returnDate;
    passengers;
    returnFareId;
}
exports.CreateBookingDto = CreateBookingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Selected train/fare ID from search' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "fareId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: TripType }),
    (0, class_validator_1.IsEnum)(TripType),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "tripType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'CITY_A' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "origin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'CITY_B' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "destination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "departureDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "returnDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PassengerDto] }),
    __metadata("design:type", Array)
], CreateBookingDto.prototype, "passengers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "returnFareId", void 0);
class BookingResponseDto {
    id;
    bookingCode;
    otaBookingRef;
    status;
    priceIDR;
    priceSAR;
    totalAmount;
}
exports.BookingResponseDto = BookingResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingResponseDto.prototype, "bookingCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingResponseDto.prototype, "otaBookingRef", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BookingResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BookingResponseDto.prototype, "priceIDR", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BookingResponseDto.prototype, "priceSAR", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BookingResponseDto.prototype, "totalAmount", void 0);
//# sourceMappingURL=ota.dto.js.map