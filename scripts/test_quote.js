import { concierge } from "../src/core/concierge.js";

const samples = [
  "80 dólares estoy a diez minutos",
  "Cobro 100 llego en quince minutos",
  "Son 50 llego en veinte minutos",
  "Puedo ir por 90 en media hora",
  "Cobro 75 llego en 10 mins"
];

for (const s of samples) {
  const res = concierge.analyzeProviderMessage(s);
  console.log(`Input: "${s}" -> Price: ${res.priceDisplay} (${res.price}), ETA: "${res.eta}"`);
}
