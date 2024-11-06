const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioClient = twilio(accountSid, authToken);

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

// Middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}`);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  next();
});

app.get('/', (req, res) => {
    res.send('Hello, this is the Twilio server!');
});

app.post('/token', (req, res) => {
    try {
        const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioApiKey = process.env.TWILIO_API_KEY;
        const twilioApiSecret = process.env.TWILIO_API_SECRET;
        const outgoingApplicationSid = process.env.TWILIO_TWIML_APP_SID;
        const identity = 'user'; // You might want to generate this dynamically

        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: outgoingApplicationSid,
            incomingAllow: true,
        });

        const token = new AccessToken(
            twilioAccountSid,
            twilioApiKey,
            twilioApiSecret,
            {identity: identity, ttl: 3600}
        );
        token.addGrant(voiceGrant);

        const tokenString = token.toJwt();
        console.log('Generated token:', tokenString);

        res.json({
            token: tokenString,
            identity: identity,
            twilioNumber: twilioNumber
        });
    } catch (error) {
        console.error('Error generating token:', error);
        res.status(500).json({ error: 'Failed to generate token', details: error.message });
    }
});

app.post('/voice', (req, res) => {
    console.log('Received voice webhook call');
    console.log('Request body:', req.body);

    const twiml = new twilio.twiml.VoiceResponse();
    const { To, From, CallSid } = req.body;

    console.log(`Call SID: ${CallSid}`);
    console.log(`From: ${From}`);
    console.log(`To: ${To}`);

    try {
        if (To) {
            console.log(`Attempting to dial ${To}`);
            const dial = twiml.dial({ callerId: twilioNumber });
            dial.number(To);
        } else {
            console.log('No "To" number provided, responding with default message');
            twiml.say('Thanks for calling ABCD!');
        }

        const twimlString = twiml.toString();
        console.log('Generated TwiML:', twimlString);
        
        res.type('text/xml');
        res.send(twimlString);
    } catch (error) {
        console.error('Error generating TwiML:', error);
        res.status(500).send('Error generating TwiML');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log('Environment variables:');
    console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not set');
    console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not set');
    console.log('TWILIO_API_KEY:', process.env.TWILIO_API_KEY ? 'Set' : 'Not set');
    console.log('TWILIO_API_SECRET:', process.env.TWILIO_API_SECRET ? 'Set' : 'Not set');
    console.log('TWILIO_TWIML_APP_SID:', process.env.TWILIO_TWIML_APP_SID ? 'Set' : 'Not set');
    console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'Set' : 'Not set');
    console.log('TWILIO_TWIML_URL:', process.env.TWILIO_TWIML_URL ? 'Set' : 'Not set');
});