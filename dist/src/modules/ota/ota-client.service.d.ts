import { ConfigService } from '@nestjs/config';
export declare class OtaClientService {
    private configService;
    private readonly logger;
    private client;
    private config;
    private accessToken;
    private tokenExpiresAt;
    constructor(configService: ConfigService);
    getAccessToken(): Promise<string>;
    private getHeaders;
    searchLowFare(params: {
        origin: string;
        destination: string;
        departureDate: string;
        returnDate?: string;
        passengerCount: number;
        tripType: string;
    }): Promise<any>;
    createBooking(bookingData: {
        fareId: string;
        passengers: any[];
        tripType: string;
        origin: string;
        destination: string;
        departureDate: string;
        returnDate?: string;
        returnFareId?: string;
    }): Promise<any>;
    readBooking(bookingRef: string): Promise<any>;
    cancelBooking(bookingRef: string): Promise<any>;
    processPaymentAndTicketing(bookingRef: string, paymentDetails: any): Promise<any>;
    downloadTickets(bookingRef: string): Promise<Buffer>;
    getAvailableRoutes(): Promise<any>;
    private buildLowFareSearchXml;
    private buildBookingXml;
    private buildReadBookingXml;
    private buildCancelBookingXml;
    private buildPaymentXml;
    private parseLowFareResponse;
    private parseBookingResponse;
    private parseReadBookingResponse;
    private parseCancelResponse;
    private parsePaymentResponse;
}
