import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function check() {
  console.log("=== TWILIO DIAGNOSTIC REPORT ===");

  console.log("\n1. RECENT MESSAGES (LAST 10):");
  const messages = await client.messages.list({ limit: 10 });
  for (const m of messages) {
    console.log(`- Date: ${m.dateCreated.toISOString()}`);
    console.log(`  SID: ${m.sid}`);
    console.log(`  Direction: ${m.direction}`);
    console.log(`  From: ${m.from} -> To: ${m.to}`);
    console.log(`  Status: ${m.status} | ErrorCode: ${m.errorCode || "None"}`);
    console.log(`  Body: "${m.body}"\n`);
  }

  console.log("2. INCOMING PHONE NUMBERS:");
  const numbers = await client.incomingPhoneNumbers.list();
  for (const n of numbers) {
    console.log(`- Number: ${n.phoneNumber}`);
    console.log(`  SMS URL: ${n.smsUrl || "EMPTY"}`);
    console.log(`  SMS Method: ${n.smsMethod}`);
    console.log(`  Voice URL: ${n.voiceUrl}`);
    console.log(`  Status Callback: ${n.statusCallback || "None"}\n`);
  }

  console.log("3. MESSAGING SERVICES:");
  const services = await client.messaging.v1.services.list();
  for (const s of services) {
    console.log(`- Service Name: ${s.friendlyName} (${s.sid})`);
    console.log(`  Inbound URL: ${s.inboundRequestUrl || "EMPTY"}`);
    console.log(`  Inbound Method: ${s.inboundMethod}`);
    const phoneNumbers = await client.messaging.v1.services(s.sid).phoneNumbers.list();
    console.log(`  Phone Numbers Attached: ${phoneNumbers.map(p => p.phoneNumber).join(", ") || "NONE"}\n`);
  }

  console.log("4. RECENT TWILIO ALERTS / ERRORS (LAST 5):");
  try {
    const alerts = await client.monitor.v1.alerts.list({ limit: 5 });
    for (const a of alerts) {
      console.log(`- [${a.alertText}] Code: ${a.errorCode} | Date: ${a.dateCreated} | URL: ${a.requestUrl || "N/A"}`);
    }
  } catch (e) {
    console.log("Alerts check error:", e.message);
  }
}

check().catch(console.error);
