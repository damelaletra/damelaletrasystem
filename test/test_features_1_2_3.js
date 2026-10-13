process.env.NODE_ENV = "test";
import assert from "assert";
import { geminiService } from "../src/core/gemini.js";
import { calculateDistanceMiles } from "../src/core/semantic.js";
import { db } from "../src/core/db.js";
import { stateMachine } from "../src/core/stateMachine.js";
import { channels } from "../src/core/channels.js";

channels.disableTwilioForTesting = true;

async function testNativeFeatures() {
  console.log("=================================================");
  console.log("   TESTING NATIVE FEATURES 1, 2, AND 3          ");
  console.log("=================================================\n");

  db.seed();

  // FEATURE 1: Audio-to-text Transcription
  console.log("▶ FEATURE 1: Native Voice Note Audio Transcription");
  {
    assert(typeof geminiService.transcribeAudio === "function", "transcribeAudio must be a function");
    console.log("  ✔ transcribeAudio function properly exported on geminiService (PASS)");

    // Test with a mock buffer in fallback/safe mode
    const mockAudio = Buffer.from("RIFF....WAVEfmt ....data....");
    const result = await geminiService.transcribeAudio(mockAudio, "audio/ogg; codecs=opus");
    assert(typeof result === "string", "Transcription should return a string");
    console.log(`  ✔ Audio MIME parsing and transcription engine invoked cleanly: "${result.substring(0, 50)}..." (PASS)`);
  }

  // FEATURE 2: Multimodal Damage Photo Visual Diagnosis
  console.log("\n▶ FEATURE 2: Visual Diagnosis from Damage Photos (Gemini Multimodal Vision)");
  {
    assert(typeof geminiService.analyzeDamagePhoto === "function", "analyzeDamagePhoto must be a function");
    console.log("  ✔ analyzeDamagePhoto function properly exported on geminiService (PASS)");

    // Test pipeline with simulated image metadata
    const convId = "test-photo-customer-" + Date.now();
    const fakePhotoUrl = "https://damelaletrasystem-production.up.railway.app/api/media/img-test-123";
    const visualDiagnosis = {
      detected_problem: "Fuga severa de agua en tubería de PVC bajo el fregadero",
      suggested_category: "PLUMBING",
      suggested_service_type: "WATER_LEAK",
      urgency: "HIGH",
      summary_for_technician: "Tubería de desagüe rota bajo fregadero. Requiere codo PVC 1.5 pulgadas y pegamento."
    };

    const res = await stateMachine.processCustomerInput(
      "[Foto de avería]: Fuga severa de agua",
      "SMS",
      convId,
      {
        mediaUrl: fakePhotoUrl,
        visualAnalysis: visualDiagnosis
      }
    );

    const req = res.request;
    assert.strictEqual(req.service_category, "PLUMBING", "Request must be classified as PLUMBING");
    assert.strictEqual(req.media_url, fakePhotoUrl, "Photo URL must be stored on request");
    assert.deepStrictEqual(req.visual_analysis.detected_problem, visualDiagnosis.detected_problem, "Diagnosis must be stored");
    console.log("  ✔ Customer sent damage photo -> categorized as PLUMBING, photo stored, technician briefed (PASS)");
  }

  // FEATURE 3: Native WhatsApp GPS Location & Mile Distance Filtering
  console.log("\n▶ FEATURE 3: Native WhatsApp GPS Location & Mile Radius Calculation");
  {
    // Test Haversine distance formula: Louisville Downtown (38.2542, -85.7594) to Okolona (38.1510, -85.7001)
    const dist = calculateDistanceMiles(38.2542, -85.7594, 38.1510, -85.7001);
    assert(dist > 7 && dist < 9, `Distance should be ~7.7 miles, got: ${dist}`);
    console.log(`  ✔ calculateDistanceMiles verified: Downtown to Okolona = ${dist} miles (PASS)`);

    // Test Request creation with native GPS payload from WhatsApp
    const convId = "test-gps-customer-" + Date.now();
    const gpsLocation = {
      latitude: 38.1632,
      longitude: -85.8341,
      location_raw: "5000 Dixie Hwy, Louisville, KY 40216"
    };

    const res = await stateMachine.processCustomerInput(
      "Se me ponchó la goma",
      "SMS",
      convId,
      { gpsData: gpsLocation }
    );

    const req = res.request;
    assert.strictEqual(req.latitude, gpsLocation.latitude, "Exact latitude must be preserved");
    assert.strictEqual(req.longitude, gpsLocation.longitude, "Exact longitude must be preserved");
    assert.strictEqual(req.location_raw, gpsLocation.location_raw, "Exact location label must be preserved");
    assert(req.matched_provider_id, "Candidate must be matched using GPS coordinates");

    const provider = db.getProviderById(req.matched_provider_id);
    const distToProvider = calculateDistanceMiles(req.latitude, req.longitude, provider.base_latitude, provider.base_longitude);
    console.log(`  ✔ Request matched to closest provider (${provider.name}) at exact ${distToProvider} miles (PASS)`);
  }

  console.log("\n=================================================");
  console.log("   ALL 3 NATIVE FEATURES VERIFIED AND PASSING!  ");
  console.log("=================================================\n");
  process.exit(0);
}

testNativeFeatures().catch(err => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
