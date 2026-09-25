import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function checkSandbox() {
  console.log("=== CHECKING TWILIO WHATSAPP SANDBOX SETTINGS ===");
  try {
    // Check if account has sandbox properties
    const account = await client.api.v2010.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log("Account:", account.friendlyName);
    
    // Check messaging services or numbers
    const incoming = await client.incomingPhoneNumbers.list();
    console.log("Incoming numbers count:", incoming.length);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

checkSandbox().catch(console.error);
