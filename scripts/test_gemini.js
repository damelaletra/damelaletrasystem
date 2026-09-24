import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

async function testGeneration() {
  const models = ["models/gemini-flash-latest", "models/gemini-2.5-flash-lite"];
  for (const m of models) {
    try {
      console.log(`Testing ${m}...`);
      const response = await ai.models.generateContent({
        model: m,
        contents: "Traduce esta frase cubana a intención: 'Asere se me tupió el fregadero en Dixie'. Devuelve JSON."
      });
      console.log(`✔ SUCCESS with ${m}! Output:\n`, response.text);
      return m;
    } catch (e) {
      console.log(`✖ Error with ${m}:`, e.message);
    }
  }
}

testGeneration().catch(console.error);
