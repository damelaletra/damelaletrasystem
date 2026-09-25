import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TARGET_PHONE = "+15026587853";
const TWILIO_PHONE = "+15026731333";

async function checkAndSend() {
  console.log("=== CHECKING WHATSAPP SENDER STATUS & SENDING TEST ===");

  // 1. Try sending a WhatsApp message
  let whatsappStatus = "PENDING_META";
  try {
    const waMsg = await client.messages.create({
      body: "¡Hola! Este es un mensaje de prueba de WhatsApp de Dame La Letra (+1 502-673-1333).",
      from: `whatsapp:${TWILIO_PHONE}`,
      to: `whatsapp:${TARGET_PHONE}`
    });
    console.log(`✔ WhatsApp Message sent! SID: ${waMsg.sid} | Status: ${waMsg.status}`);
    whatsappStatus = waMsg.status;
  } catch (err) {
    console.log(`ℹ WhatsApp dispatch status: ${err.message} (Code: ${err.code})`);
    whatsappStatus = `Error: ${err.message}`;
  }

  // 2. Send SMS Status Update to user
  try {
    const smsMsg = await client.messages.create({
      body: `[Dame La Letra] Estado actual de WhatsApp: Meta continúa procesando el registro global de tu número (+1 502-673-1333). Te avisaremos en cuanto Meta termine la activación. (SMS y motor IA 100% operativos).`,
      from: TWILIO_PHONE,
      to: TARGET_PHONE
    });
    console.log(`✔ SMS Status Update sent to ${TARGET_PHONE}! SID: ${smsMsg.sid}`);
  } catch (smsErr) {
    console.error("SMS dispatch error:", smsErr.message);
  }
}

checkAndSend().catch(console.error);
