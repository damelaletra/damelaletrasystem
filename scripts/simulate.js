import readline from "readline";
import { stateMachine } from "../src/core/stateMachine.js";
import { cascadingEngine } from "../src/core/cascading.js";
import { concierge } from "../src/core/concierge.js";
import { db } from "../src/core/db.js";
import dotenv from "dotenv";

dotenv.config();
process.env.NODE_ENV = "test"; // Keep Twilio silent during interactive local simulation

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function runInteractiveLab() {
  console.clear();
  console.log("\x1b[1m\x1b[36m=================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[37m   🇨🇺 DAME LA LETRA (DML) — LABORATORIO DE PRUEBAS INTERACTIVO   \x1b[0m");
  console.log("\x1b[36m=================================================================\x1b[0m");
  console.log("\x1b[90mPrueba cualquier frase en jerga cubana, modismos, Spanglish o situaciones reales.\x1b[0m\n");

  while (true) {
    console.log("\x1b[33m-----------------------------------------------------------------\x1b[0m");
    const input = await ask("\x1b[1m\x1b[32m[👤 CLIENTE] Escribe lo que necesitas (o 'salir'):\x1b[0m\n> ");
    
    if (!input || input.trim().toLowerCase() === "salir" || input.trim().toLowerCase() === "exit") {
      console.log("\n¡Hasta pronto!");
      rl.close();
      break;
    }

    const conversationRef = "sim-client-" + Date.now();
    console.log("\n\x1b[90m[Procesando con Gemini AI & Motor Semántico...]\x1b[0m");
    
    const result = await stateMachine.processCustomerInput(input, "WEB", conversationRef);
    const req = result.request || db.getRequestById(result.request?.id);

    console.log("\n\x1b[1m\x1b[35m[🧠 ANÁLISIS DE INTELIGENCIA ARTIFICIAL]\x1b[0m");
    console.log(`  • Categoría: \x1b[33m${req?.service_category || "N/A"}\x1b[0m | Tipo: \x1b[33m${req?.service_type || "N/A"}\x1b[0m`);
    console.log(`  • Ubicación: \x1b[36m${req?.location_raw || "Louisville Metro"}\x1b[0m`);
    console.log(`  • Urgencia:  \x1b[31m${req?.urgency || "MEDIUM"}\x1b[0m | Propiedad: \x1b[37m${req?.property_type || "UNKNOWN"}\x1b[0m`);

    if (req?.status === "HUMAN_REVIEW") {
      console.log("\x1b[31m  ⚠ Solicitud ambigua. El Concierge pidió aclaración al cliente.\x1b[0m\n");
      continue;
    }

    if (req?.status === "NO_PROVIDER") {
      console.log("\x1b[33m  ℹ No hay técnicos directos. Se activó Fallback de Directorio Público de Louisville.\x1b[0m\n");
      continue;
    }

    const provider = db.getProviderById(req?.matched_provider_id);
    console.log(`\n\x1b[1m\x1b[34m[📲 ALERTA ENVIADA AL TÉCNICO: ${provider?.name || "Proveedor"}]\x1b[0m`);
    console.log(`  "\x1b[37mHola ${provider?.name}. Tenemos un cliente que necesita ayuda con '${req?.raw_message}' en ${req?.location_raw}. ¿Cuánto cobras y en qué tiempo llegas?\x1b[0m"`);

    const provReply = await ask(`\n\x1b[1m\x1b[34m[🛠️ ${provider?.name?.toUpperCase()}] Escribe la respuesta del técnico (ej. 'Cobro 80 llego en 10 min'):\x1b[0m\n> `);

    console.log("\n\x1b[90m[Procesando cotización del técnico...]\x1b[0m");
    const provAnalysis = await concierge.analyzeProviderMessageAsync(provReply, req, provider);
    
    console.log("\x1b[1m\x1b[35m[🧠 INTERPRETACIÓN DE LA COTIZACIÓN]\x1b[0m");
    console.log(`  • Precio detectado: \x1b[32m${provAnalysis.priceDisplay || "N/A"}\x1b[0m`);
    console.log(`  • Tiempo de llegada: \x1b[36m${provAnalysis.eta || "N/A"}\x1b[0m`);

    if (provAnalysis.intent === "PROVIDER_ASK_QUESTION") {
      console.log(`  • Pregunta al cliente: \x1b[33m"${provAnalysis.question}"\x1b[0m`);
    } else if (provAnalysis.intent === "PROVIDER_DECLINED") {
      console.log(`  • Técnico declinó el trabajo. Se avanza al siguiente candidato.`);
    } else {
      console.log(`\n\x1b[1m\x1b[32m[💬 MENSAJE ENTREGADO AL CLIENTE]\x1b[0m`);
      console.log(`  "Listo. ${provider?.display_name} puede atenderte en ${provAnalysis.eta} y cobra ${provAnalysis.priceDisplay}. ¿Quieres que te lo conecte?"`);

      const custDecision = await ask(`\n\x1b[1m\x1b[32m[👤 CLIENTE] ¿Confirmar cotización? (ej. 'Sí, dale' / 'No, muy caro'):\x1b[0m\n> `);
      const isAccepted = concierge.isCustomerAcceptance(custDecision);

      if (isAccepted) {
        console.log(`\n\x1b[1m\x1b[42m\x1b[30m  ✔ ¡CONEXIÓN CONFIRMADA CON ÉXITO!  \x1b[0m`);
        console.log(`  ➔ Teléfono directo del técnico entregado al cliente: \x1b[1m${provider?.phone}\x1b[0m`);
        console.log(`  ➔ Contacto del cliente entregado a ${provider?.name}.\n`);
      } else {
        console.log(`\n\x1b[31m  ✖ Cliente canceló o solicitó buscar otro proveedor.\x1b[0m\n`);
      }
    }
  }
}

runInteractiveLab().catch(console.error);
