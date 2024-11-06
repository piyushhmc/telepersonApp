import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class TwilioService {

    private twilioClient: twilio.Twilio;
    private voiceGrant: typeof twilio.jwt.AccessToken.VoiceGrant;
    private AccessToken: typeof twilio.jwt.AccessToken;
    private twilioNumber: string;

    constructor(private configService: ConfigService) {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        this.twilioClient = twilio(accountSid, authToken);
        this.AccessToken = twilio.jwt.AccessToken;
        this.voiceGrant = twilio.jwt.AccessToken.VoiceGrant;
        this.twilioNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    }

    generateToken(identity: string): string {
        const twilioAccountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const twilioApiKey = this.configService.get<string>('TWILIO_API_KEY');
        const twilioApiSecret = this.configService.get<string>('TWILIO_API_SECRET');
        const outgoingApplicationSid = this.configService.get<string>('TWILIO_TWIML_APP_SID');

        const voiceGrant = new this.voiceGrant({
            outgoingApplicationSid: outgoingApplicationSid,
            incomingAllow: true,
        });

        const token = new this.AccessToken(
            twilioAccountSid,
            twilioApiKey,
            twilioApiSecret,
            { identity: identity, ttl: 3600 },
        );
        token.addGrant(voiceGrant);

        return token.toJwt();
    }

    generateTwiml(to: string): string {
        const twiml = new twilio.twiml.VoiceResponse();
        if (to) {
            const dial = twiml.dial({ callerId: this.twilioNumber });
            dial.number(to);
        } else {
            twiml.say('Thanks for calling ABCD!');
        }
        return twiml.toString();
    }

    getTwilioNumber():string{
        return this.twilioNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    }
}


