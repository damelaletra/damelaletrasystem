import twilio from "twilio";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Accept messages from up to 2 minutes ago to now
const startTime = new Date(Date.now() - 2 * 60 * 1000);
const seenMessageSids = new Set();
const seenCallSids = new Set();

console.log(`[${new Date().toLocaleTimeString()}] Iniciando monitor de Twilio...`);
console.log(`Buscando mensajes entrantes a partir de: ${startTime.toISOString()}`);
console.log(`Monitoreando número Twilio: ${process.env.TWILIO_PHONE_NUMBER || "Cuentas Twilio asociadas"}`);

const MAX_DURATION_MS = 15 * 60 * 1000; // 15 minutos máximo
const pollStart = Date.now();

async function poll() {
  try {
    // 1. Check Messages
    const messages = await client.messages.list({ limit: 5 });
    for (const m of messages) {
      if (m.direction === "inbound" && new Date(m.dateCreated) >= startTime) {
        if (!seenMessageSids.has(m.sid)) {
          seenMessageSids.add(m.sid);

          console.log("\n========================================");
          console.log("🎉 ¡NUEVO MENSAJE SMS RECIBIDO EN TWILIO!");
          console.log(`De: ${m.from}`);
          console.log(`Para: ${m.to}`);
          console.log(`Fecha: ${m.dateCreated.toISOString()}`);
          console.log(`Texto: "${m.body}"`);

          const codeMatch = m.body.match(/\b([A-Z0-9]{4,8})\b/i);
          const numericMatch = m.body.match(/\b(\d{4,8})\b/);
          const foundCode = numericMatch ? numericMatch[0] : (codeMatch ? codeMatch[0] : null);

          if (foundCode) {
            console.log(`\n🔑 CÓDIGO DETECTADO: ${foundCode}`);
          }
          console.log("========================================\n");

          const result = {
            sid: m.sid,
            from: m.from,
            to: m.to,
            date: m.dateCreated,
            body: m.body,
            code: foundCode
          };

          try {
            fs.mkdirSync("scratch", { recursive: true });
            fs.writeFileSync("scratch/latest_otp.json", JSON.stringify(result, null, 2));
          } catch (e) {}

          // Exit successfully to notify immediately
          process.exit(0);
        }
      }
    }

    // 2. Check Calls (in case of Voice OTP)
    const calls = await client.calls.list({ limit: 3 });
    for (const c of calls) {
      if (c.direction === "inbound" && new Date(c.dateCreated) >= startTime) {
        if (!seenCallSids.has(c.sid)) {
          seenCallSids.add(c.sid);
          console.log(`\n📞 [LLAMADA ENTRANTE DETECTADA] De: ${c.from} | Status: ${c.status} | Fecha: ${c.dateCreated.toISOString()}`);
        }
      }
    }
  } catch (err) {
    console.error("Error consultando Twilio:", err.message);
  }

  if (Date.now() - pollStart > MAX_DURATION_MS) {
    console.log("Tiempo límite de espera alcanzado (15 minutos). Finalizando monitor.");
    process.exit(0);
  }

  setTimeout(poll, 3000);
}

// Heartbeat
setInterval(() => {
  const elapsedSec = Math.round((Date.now() - pollStart) / 1000);
  console.log(`[${new Date().toLocaleTimeString()}] Monitoreando Twilio... (${elapsedSec}s transcurridos)`);
}, 30000);

poll();
