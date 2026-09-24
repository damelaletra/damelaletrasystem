import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const RAILWAY_WEBHOOK_URL = "https://damelaletrasystem-a.up.railway.app/api/webhooks/twilio";

async function updateTwilio() {
  console.log("=== UPDATING TWILIO WEBHOOKS ===");

  // 1. Update Messaging Service Webhook
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    console.log(`Updating Messaging Service: ${process.env.TWILIO_MESSAGING_SERVICE_SID}`);
    const updatedService = await client.messaging.v1
      .services(process.env.TWILIO_MESSAGING_SERVICE_SID)
      .update({
        inboundRequestUrl: RAILWAY_WEBHOOK_URL,
        inboundMethod: "POST"
      });
    console.log(`✔ Messaging Service Inbound URL set to: ${updatedService.inboundRequestUrl}`);
  }

  // 2. Update Direct Phone Numbers (both +15026731333 and +15025187888)
  const incoming = await client.incomingPhoneNumbers.list();
  for (const num of incoming) {
    if (num.phoneNumber === "+15026731333" || num.phoneNumber === "+15025187888") {
      console.log(`Updating Phone Number ${num.phoneNumber} (${num.sid})...`);
      const updatedNum = await client.incomingPhoneNumbers(num.sid).update({
        smsUrl: RAILWAY_WEBHOOK_URL,
        smsMethod: "POST"
      });
      console.log(`✔ Phone Number ${updatedNum.phoneNumber} SMS URL set to: ${updatedNum.smsUrl}`);
    }
  }

  console.log("=== TWILIO CONFIGURATION COMPLETED SUCCESSFULLY ===");
}

updateTwilio().catch(console.error);
