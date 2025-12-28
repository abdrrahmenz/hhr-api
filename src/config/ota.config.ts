import { registerAs } from '@nestjs/config';

export default registerAs('ota', () => ({
    baseUrl: process.env.OTA_BASE_URL,
    apiKey: process.env.OTA_API_KEY,
    tenant: process.env.OTA_TENANT,
    agentId: process.env.OTA_AGENT_ID,
    agentName: process.env.OTA_AGENT_NAME,
    clientSecret: process.env.OTA_CLIENT_SECRET,
    username: process.env.OTA_USERNAME,
    password: process.env.OTA_PASSWORD,
}));
