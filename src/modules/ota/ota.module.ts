import { Module } from '@nestjs/common';
import { OtaController } from './ota.controller';
import { OtaService } from './ota.service';
import { OtaClientService } from './ota-client.service';

@Module({
    controllers: [OtaController],
    providers: [OtaService, OtaClientService],
    exports: [OtaService, OtaClientService],
})
export class OtaModule { }
