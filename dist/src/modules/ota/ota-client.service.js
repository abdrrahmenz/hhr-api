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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OtaClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtaClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let OtaClientService = OtaClientService_1 = class OtaClientService {
    configService;
    logger = new common_1.Logger(OtaClientService_1.name);
    client;
    config;
    accessToken = null;
    tokenExpiresAt = 0;
    constructor(configService) {
        this.configService = configService;
        this.config = {
            baseUrl: this.configService.get('ota.baseUrl') || '',
            apiKey: this.configService.get('ota.apiKey') || '',
            tenant: this.configService.get('ota.tenant') || '',
            agentId: this.configService.get('ota.agentId') || '',
            agentName: this.configService.get('ota.agentName') || '',
            clientSecret: this.configService.get('ota.clientSecret') || '',
            username: this.configService.get('ota.username') || '',
            password: this.configService.get('ota.password') || '',
        };
        this.client = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/xml',
                'Accept': 'application/xml',
            },
        });
    }
    async getAccessToken() {
        const now = Date.now();
        if (this.accessToken && this.tokenExpiresAt > now + 60000) {
            return this.accessToken;
        }
        try {
            const response = await axios_1.default.post(`${this.config.baseUrl}/realms/${this.config.tenant}/protocol/openid-connect/token`, new URLSearchParams({
                grant_type: 'password',
                client_id: 'sms4',
                client_secret: this.config.clientSecret,
                username: this.config.username,
                password: this.config.password,
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            this.accessToken = response.data.access_token;
            this.tokenExpiresAt = now + (response.data.expires_in * 1000);
            return this.accessToken;
        }
        catch (error) {
            this.logger.error('Failed to get OTA access token', error);
            throw new common_1.HttpException('OTA authentication failed', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
    async getHeaders() {
        const token = await this.getAccessToken();
        return {
            'Authorization': `Bearer ${token}`,
            'x-api-key': this.config.apiKey,
            'local-name': this.config.agentName,
            'Content-Type': 'application/xml',
            'Accept': 'application/xml',
        };
    }
    async searchLowFare(params) {
        const { origin, destination, departureDate, returnDate, passengerCount, tripType } = params;
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
        }
        catch (error) {
            this.logger.error('Low fare search failed', error);
            throw new common_1.HttpException('Failed to search trains', common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async createBooking(bookingData) {
        const bookXml = this.buildBookingXml(bookingData);
        try {
            const headers = await this.getHeaders();
            const response = await this.client.post('/ota/book', bookXml, { headers });
            return this.parseBookingResponse(response.data);
        }
        catch (error) {
            this.logger.error('Create booking failed', error);
            throw new common_1.HttpException('Failed to create booking', common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async readBooking(bookingRef) {
        try {
            const headers = await this.getHeaders();
            const readXml = this.buildReadBookingXml(bookingRef);
            const response = await this.client.post('/ota/read', readXml, { headers });
            return this.parseReadBookingResponse(response.data);
        }
        catch (error) {
            this.logger.error('Read booking failed', error);
            throw new common_1.HttpException('Failed to read booking', common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async cancelBooking(bookingRef) {
        try {
            const headers = await this.getHeaders();
            const cancelXml = this.buildCancelBookingXml(bookingRef);
            const response = await this.client.post('/ota/cancel', cancelXml, { headers });
            return this.parseCancelResponse(response.data);
        }
        catch (error) {
            this.logger.error('Cancel booking failed', error);
            throw new common_1.HttpException('Failed to cancel booking', common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async processPaymentAndTicketing(bookingRef, paymentDetails) {
        try {
            const headers = await this.getHeaders();
            const paymentXml = this.buildPaymentXml(bookingRef, paymentDetails);
            const response = await this.client.post('/ota/payment', paymentXml, { headers });
            return this.parsePaymentResponse(response.data);
        }
        catch (error) {
            this.logger.error('Payment/ticketing failed', error);
            throw new common_1.HttpException('Failed to process payment', common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async downloadTickets(bookingRef) {
        try {
            const headers = await this.getHeaders();
            const response = await this.client.get(`/ota/tickets/${bookingRef}`, {
                headers,
                responseType: 'arraybuffer',
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Download tickets failed', error);
            throw new common_1.HttpException('Failed to download tickets', common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async getAvailableRoutes() {
        try {
            const headers = await this.getHeaders();
            const response = await this.client.get('/ota/routes', { headers });
            return response.data;
        }
        catch (error) {
            this.logger.error('Get routes failed', error);
            throw new common_1.HttpException('Failed to get routes', common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    buildLowFareSearchXml(params) {
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
    buildBookingXml(params) {
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
    buildReadBookingXml(bookingRef) {
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
    buildCancelBookingXml(bookingRef) {
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
    buildPaymentXml(bookingRef, paymentDetails) {
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
    parseLowFareResponse(xml) {
        return {
            rawXml: xml,
            fares: [],
            success: !xml.includes('<Error'),
        };
    }
    parseBookingResponse(xml) {
        return {
            rawXml: xml,
            bookingRef: '',
            pnr: '',
            success: !xml.includes('<Error'),
        };
    }
    parseReadBookingResponse(xml) {
        return {
            rawXml: xml,
            booking: null,
            success: !xml.includes('<Error'),
        };
    }
    parseCancelResponse(xml) {
        return {
            rawXml: xml,
            success: !xml.includes('<Error'),
        };
    }
    parsePaymentResponse(xml) {
        return {
            rawXml: xml,
            ticketed: false,
            success: !xml.includes('<Error'),
        };
    }
};
exports.OtaClientService = OtaClientService;
exports.OtaClientService = OtaClientService = OtaClientService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OtaClientService);
//# sourceMappingURL=ota-client.service.js.map