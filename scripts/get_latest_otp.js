import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function getLatestCode() {
  console.log("=== CHECKING LATEST TWILIO INCOMING MESSAGES ===");
  const messages = await client.messages.list({ limit: 10 });
  for (const m of messages) {
    console.log(`Date: ${m.dateCreated.toISOString()} | Direction: ${m.direction}`);
    console.log(`From: ${m.from} -> To: ${m.to}`);
    console.log(`Body: "${m.body}"\n---`);
  }

  console.log("\n=== CHECKING LATEST CALLS (VOICE OTP) ===");
  const calls = await client.calls.list({ limit: 5 });
  for (const c of calls) {
    console.log(`Date: ${c.dateCreated.toISOString()}`);
    console.log(`From: ${c.from} -> To: ${c.to}`);
    console.log(`Status: ${c.status} | Duration: ${c.duration}s\n---`);
  }
}

getLatestCode().catch(console.error);
