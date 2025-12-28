import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface OtaConfig {
    baseUrl: string;
    apiKey: string;
    tenant: string;
    agentId: string;
    agentName: string;
    clientSecret: string;
    username: string;
    password: string;
}

interface TokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token: string;
}

@Injectable()
export class OtaClientService {
    private readonly logger = new Logger(OtaClientService.name);
    private client: AxiosInstance;
    private config: OtaConfig;
    private accessToken: string | null = null;
    private tokenExpiresAt: number = 0;

    constructor(private configService: ConfigService) {
        this.config = {
            baseUrl: this.configService.get<string>('ota.baseUrl') || '',
            apiKey: this.configService.get<string>('ota.apiKey') || '',
            tenant: this.configService.get<string>('ota.tenant') || '',
            agentId: this.configService.get<string>('ota.agentId') || '',
            agentName: this.configService.get<string>('ota.agentName') || '',
            clientSecret: this.configService.get<string>('ota.clientSecret') || '',
            username: this.configService.get<string>('ota.username') || '',
            password: this.configService.get<string>('ota.password') || '',
        };

        this.client = axios.create({
            baseURL: this.config.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/xml',
                'Accept': 'application/xml',
            },
        });
    }

    async getAccessToken(): Promise<string> {
        const now = Date.now();

        if (this.accessToken && this.tokenExpiresAt > now + 60000) {
            return this.accessToken;
        }

        try {
            const response = await axios.post<TokenResponse>(
                `${this.config.baseUrl}/realms/${this.config.tenant}/protocol/openid-connect/token`,
                new URLSearchParams({
                    grant_type: 'password',
                    client_id: 'sms4',
                    client_secret: this.config.clientSecret,
                    username: this.config.username,
                    password: this.config.password,
                }),
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                },
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiresAt = now + (response.data.expires_in * 1000);

            return this.accessToken;
        } catch (error) {
            this.logger.error('Failed to get OTA access token', error);
            throw new HttpException('OTA authentication failed', HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    private async getHeaders(): Promise<Record<string, string>> {
        const token = await this.getAccessToken();
        return {
            'Authorization': `Bearer ${token}`,
            'x-api-key': this.config.apiKey,
            'local-name': this.config.agentName,
            'Content-Type': 'application/xml',
            'Accept': 'application/xml',
        };
    }

    async searchLowFare(params: {
        origin: string;
        destination: string;
        departureDate: string;
        returnDate?: string;
        passengerCount: number;
        tripType: string;
    }): Promise<any> {
        const { origin, destination, departureDate, returnDate, passengerCount, tripType } = params;

        // Build OTA_AirLowFareSearchRQ XML
        const searchXml = this.buildLowFareSearchXml({
            origin,
            destination,
            departureDate,
            returnDate,
            passengerCount,
            isRoundTrip: tripType === 'ROUND_TRIP',
        });

        try {
            const headers = await this.getHeaders();
            const response = await this.client.post('/ota/lowfaresearch', searchXml, { headers });

            return this.parseLowFareResponse(response.data);
        } catch (error) {
            this.logger.error('Low fare search failed', error);
            throw new HttpException('Failed to search trains', HttpStatus.BAD_GATEWAY);
        }
    }

    async createBooking(bookingData: {
        fareId: string;
        passengers: any[];
        tripType: string;
        origin: string;
        destination: string;
        departureDate: string;
        returnDate?: string;
        returnFareId?: string;
    }): Promise<any> {
        const bookXml = this.buildBookingXml(bookingData);

        try {
            const headers = await this.getHeaders();
            const response = await this.client.post('/ota/book', bookXml, { headers });

            return this.parseBookingResponse(response.data);
        } catch (error) {
            this.logger.error('Create booking failed', error);
            throw new HttpException('Failed to create booking', HttpStatus.BAD_GATEWAY);
        }
    }

    async readBooking(bookingRef: string): Promise<any> {
        try {
            const headers = await this.getHeaders();
            const readXml = this.buildReadBookingXml(bookingRef);
            const response = await this.client.post('/ota/read', readXml, { headers });

            return this.parseReadBookingResponse(response.data);
        } catch (error) {
            this.logger.error('Read booking failed', error);
            throw new HttpException('Failed to read booking', HttpStatus.BAD_GATEWAY);
        }
    }

    async cancelBooking(bookingRef: string): Promise<any> {
        try {
            const headers = await this.getHeaders();
            const cancelXml = this.buildCancelBookingXml(bookingRef);
            const response = await this.client.post('/ota/cancel', cancelXml, { headers });

            return this.parseCancelResponse(response.data);
        } catch (error) {
            this.logger.error('Cancel booking failed', error);
            throw new HttpException('Failed to cancel booking', HttpStatus.BAD_GATEWAY);
        }
    }

    async processPaymentAndTicketing(bookingRef: string, paymentDetails: any): Promise<any> {
        try {
            const headers = await this.getHeaders();
            const paymentXml = this.buildPaymentXml(bookingRef, paymentDetails);
            const response = await this.client.post('/ota/payment', paymentXml, { headers });

            return this.parsePaymentResponse(response.data);
        } catch (error) {
            this.logger.error('Payment/ticketing failed', error);
            throw new HttpException('Failed to process payment', HttpStatus.BAD_GATEWAY);
        }
    }

    async downloadTickets(bookingRef: string): Promise<Buffer> {
        try {
            const headers = await this.getHeaders();
            const response = await this.client.get(`/ota/tickets/${bookingRef}`, {
                headers,
                responseType: 'arraybuffer',
            });

            return response.data;
        } catch (error) {
            this.logger.error('Download tickets failed', error);
            throw new HttpException('Failed to download tickets', HttpStatus.BAD_GATEWAY);
        }
    }

    async getAvailableRoutes(): Promise<any> {
        try {
            const headers = await this.getHeaders();
            const response = await this.client.get('/ota/routes', { headers });

            return response.data;
        } catch (error) {
            this.logger.error('Get routes failed', error);
            throw new HttpException('Failed to get routes', HttpStatus.BAD_GATEWAY);
        }
    }

    // XML Building Methods
    private buildLowFareSearchXml(params: {
        origin: string;
        destination: string;
        departureDate: string;
        returnDate?: string;
        passengerCount: number;
        isRoundTrip: boolean;
    }): string {
        const timestamp = new Date().toISOString();

        let originDestOptions = `
      <OriginDestinationInformation>
        <DepartureDateTime>${params.departureDate}T00:00:00</DepartureDateTime>
        <OriginLocation LocationCode="${params.origin}"/>
        <DestinationLocation LocationCode="${params.destination}"/>
      </OriginDestinationInformation>`;

        if (params.isRoundTrip && params.returnDate) {
            originDestOptions += `
      <OriginDestinationInformation>
        <DepartureDateTime>${params.returnDate}T00:00:00</DepartureDateTime>
        <OriginLocation LocationCode="${params.destination}"/>
        <DestinationLocation LocationCode="${params.origin}"/>
      </OriginDestinationInformation>`;
        }

        return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_AirLowFareSearchRQ xmlns="http://www.opentravel.org/OTA/2003/05" 
  TimeStamp="${timestamp}" 
  Target="Production" 
  Version="2015B">
  <POS>
    <Source AgentSine="${this.config.agentId}">
      <RequestorID ID="${this.config.agentId}" Type="5" ID_Context="${this.config.tenant}"/>
    </Source>
  </POS>
  ${originDestOptions}
  <TravelerInfoSummary>
    <AirTravelerAvail>
      <PassengerTypeQuantity Code="ADT" Quantity="${params.passengerCount}"/>
    </AirTravelerAvail>
  </TravelerInfoSummary>
</OTA_AirLowFareSearchRQ>`;
    }

    private buildBookingXml(params: {
        fareId: string;
        passengers: any[];
        tripType: string;
        origin: string;
        destination: string;
        departureDate: string;
        returnDate?: string;
        returnFareId?: string;
    }): string {
        const timestamp = new Date().toISOString();

        const passengerXml = params.passengers.map((p, i) => `
      <AirTraveler PassengerTypeCode="ADT" TravelerRefNumber="${i + 1}">
        <PersonName>
          <NamePrefix>${p.title}</NamePrefix>
          <GivenName>${p.firstName}</GivenName>
          <Surname>${p.lastName}</Surname>
        </PersonName>
        <Document DocID="${p.idNumber}" DocType="${p.idType}"/>
        ${p.phone ? `<Telephone PhoneNumber="${p.phone}"/>` : ''}
        ${p.email ? `<Email>${p.email}</Email>` : ''}
      </AirTraveler>`).join('');

        return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_AirBookRQ xmlns="http://www.opentravel.org/OTA/2003/05" 
  TimeStamp="${timestamp}" 
  Target="Production" 
  Version="2015B">
  <POS>
    <Source AgentSine="${this.config.agentId}">
      <RequestorID ID="${this.config.agentId}" Type="5" ID_Context="${this.config.tenant}"/>
    </Source>
  </POS>
  <AirItinerary>
    <OriginDestinationOptions>
      <OriginDestinationOption FareID="${params.fareId}">
        <OriginLocation LocationCode="${params.origin}"/>
        <DestinationLocation LocationCode="${params.destination}"/>
      </OriginDestinationOption>
      ${params.returnFareId ? `
      <OriginDestinationOption FareID="${params.returnFareId}">
        <OriginLocation LocationCode="${params.destination}"/>
        <DestinationLocation LocationCode="${params.origin}"/>
      </OriginDestinationOption>` : ''}
    </OriginDestinationOptions>
  </AirItinerary>
  <TravelerInfo>
    ${passengerXml}
  </TravelerInfo>
</OTA_AirBookRQ>`;
    }

    private buildReadBookingXml(bookingRef: string): string {
        const timestamp = new Date().toISOString();

        return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_ReadRQ xmlns="http://www.opentravel.org/OTA/2003/05" 
  TimeStamp="${timestamp}" 
  Target="Production" 
  Version="2015B">
  <POS>
    <Source AgentSine="${this.config.agentId}">
      <RequestorID ID="${this.config.agentId}" Type="5" ID_Context="${this.config.tenant}"/>
    </Source>
  </POS>
  <UniqueID ID="${bookingRef}" Type="14"/>
</OTA_ReadRQ>`;
    }

    private buildCancelBookingXml(bookingRef: string): string {
        const timestamp = new Date().toISOString();

        return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_CancelRQ xmlns="http://www.opentravel.org/OTA/2003/05" 
  TimeStamp="${timestamp}" 
  Target="Production" 
  Version="2015B"
  CancelType="Commit">
  <POS>
    <Source AgentSine="${this.config.agentId}">
      <RequestorID ID="${this.config.agentId}" Type="5" ID_Context="${this.config.tenant}"/>
    </Source>
  </POS>
  <UniqueID ID="${bookingRef}" Type="14"/>
</OTA_CancelRQ>`;
    }

    private buildPaymentXml(bookingRef: string, paymentDetails: any): string {
        const timestamp = new Date().toISOString();

        return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_AirBookModifyRQ xmlns="http://www.opentravel.org/OTA/2003/05" 
  TimeStamp="${timestamp}" 
  Target="Production" 
  Version="2015B">
  <POS>
    <Source AgentSine="${this.config.agentId}">
      <RequestorID ID="${this.config.agentId}" Type="5" ID_Context="${this.config.tenant}"/>
    </Source>
  </POS>
  <AirBookModifyRQ>
    <UniqueID ID="${bookingRef}" Type="14"/>
    <Fulfillment>
      <PaymentDetails>
        <PaymentDetail PaymentType="Cash">
          <PaymentAmount Amount="${paymentDetails.amount}" CurrencyCode="${paymentDetails.currency || 'SAR'}"/>
        </PaymentDetail>
      </PaymentDetails>
    </Fulfillment>
  </AirBookModifyRQ>
</OTA_AirBookModifyRQ>`;
    }

    // XML Parsing Methods (simplified - you may need full XML parser)
    private parseLowFareResponse(xml: string): any {
        // In production, use xml2js or similar library
        // This is a simplified placeholder
        return {
            rawXml: xml,
            fares: [], // Parse actual fares from XML
            success: !xml.includes('<Error'),
        };
    }

    private parseBookingResponse(xml: string): any {
        return {
            rawXml: xml,
            bookingRef: '', // Extract from XML
            pnr: '', // Extract from XML
            success: !xml.includes('<Error'),
        };
    }

    private parseReadBookingResponse(xml: string): any {
        return {
            rawXml: xml,
            booking: null, // Parse booking details
            success: !xml.includes('<Error'),
        };
    }

    private parseCancelResponse(xml: string): any {
        return {
            rawXml: xml,
            success: !xml.includes('<Error'),
        };
    }

    private parsePaymentResponse(xml: string): any {
        return {
            rawXml: xml,
            ticketed: false, // Parse ticketing status
            success: !xml.includes('<Error'),
        };
    }
}
