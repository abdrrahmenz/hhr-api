export declare enum TripType {
    ONE_WAY = "ONE_WAY",
    ROUND_TRIP = "ROUND_TRIP"
}
export declare class SearchTrainDto {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengerCount: number;
    tripType: TripType;
}
export declare class PassengerDto {
    title: string;
    firstName: string;
    lastName: string;
    idType: string;
    idNumber: string;
    phone?: string;
    email?: string;
    dateOfBirth?: string;
}
export declare class CreateBookingDto {
    fareId: string;
    tripType: TripType;
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: PassengerDto[];
    returnFareId?: string;
}
export declare class BookingResponseDto {
    id: string;
    bookingCode: string;
    otaBookingRef: string;
    status: string;
    priceIDR: number;
    priceSAR: number;
    totalAmount: number;
}
