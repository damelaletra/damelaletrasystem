process.env.NODE_ENV = "test";
import assert from "assert";
import { cognitiveEngine, GeminiCognitiveAdapter, DeterministicFallbackCognitiveAdapter } from "../src/core/cognitiveEngine.js";
import { db } from "../src/core/db.js";
import { cascadingEngine } from "../src/core/cascading.js";
import { checkProviderEligibility } from "../src/core/eligibility.js";
import { channels } from "../src/core/channels.js";
import { stateMachine } from "../src/core/stateMachine.js";

channels.disableTwilioForTesting = true;

async function runTests() {
  console.log("=================================================");
  console.log("  TESTING ARCHITECTURAL PRIORITIES (DML)        ");
  console.log("=================================================\n");

  db.seed();

  // --------------------------------------------------------------------------
  // TEST 1: CognitiveEngine Interface & Adapter Hot-Swapping
  // --------------------------------------------------------------------------
  console.log("▶ TEST 1: CognitiveEngine Interface & Anti-Vendor-Lock-in");
  {
    assert(cognitiveEngine.isAvailable(), "CognitiveEngine should be available");
    console.log(`  ✔ Active adapter detected: ${cognitiveEngine.adapter.constructor.name}`);

    // Switch to Deterministic Fallback Adapter
    const fallbackAdapter = new DeterministicFallbackCognitiveAdapter();
    cognitiveEngine.setAdapter(fallbackAdapter);
    assert.strictEqual(cognitiveEngine.adapter.constructor.name, "DeterministicFallbackCognitiveAdapter");
    console.log("  ✔ Hot-swapped to DeterministicFallbackCognitiveAdapter cleanly");

    // Test fallback parsing of provider message
    const parsedQuote = await cognitiveEngine.analyzeProviderResponse("Cobro 80 llego en 20 minutos");
    assert.strictEqual(parsedQuote.intent, "PROVIDER_GIVE_QUOTE");
    assert.strictEqual(parsedQuote.price, 80);
    assert(parsedQuote.eta.includes("20 minutos"));
    console.log("  ✔ Deterministic fallback correctly extracted price ($80) and ETA (20 minutos) (PASS)");

    // Restore Gemini Adapter
    const geminiAdapter = new GeminiCognitiveAdapter();
    cognitiveEngine.setAdapter(geminiAdapter);
    console.log("  ✔ Hot-swapped back to GeminiCognitiveAdapter (PASS)");
  }

  // --------------------------------------------------------------------------
  // TEST 2: Provider Inbound Return Path via Probabilistic Layer
  // --------------------------------------------------------------------------
  console.log("\n▶ TEST 2: Provider Inbound Probabilistic Layer (Quote, Decline, Off-Duty)");
  {
    // A) Provider gives quote: "cobro 65 y llego en 20 minutos"
    const analysisQuote = await cognitiveEngine.analyzeProviderResponse("cobro 65 y llego en 20 minutos");
    assert.strictEqual(analysisQuote.intent, "PROVIDER_GIVE_QUOTE");
    assert.strictEqual(analysisQuote.price, 65);
    console.log("  ✔ 'cobro 65 y llego en 20 minutos' -> PROVIDER_GIVE_QUOTE, price=$65 (PASS)");

    // B) Provider declines: "no puedo ir, estoy ocupado"
    const analysisDecline = await cognitiveEngine.analyzeProviderResponse("no puedo ir");
    assert.strictEqual(analysisDecline.intent, "PROVIDER_DECLINED");
    console.log("  ✔ 'no puedo ir' -> PROVIDER_DECLINED (PASS)");

    // C) Provider off duty: "hoy no trabajo"
    const analysisOffDuty = await cognitiveEngine.analyzeProviderResponse("hoy no trabajo ya cerre");
    assert.strictEqual(analysisOffDuty.intent, "PROVIDER_OFF_DUTY");
    console.log("  ✔ 'hoy no trabajo ya cerre' -> PROVIDER_OFF_DUTY (PASS)");

    // D) Provider asks question: "¿qué marca y modelo es el refrigerador?"
    const analysisQuestion = await cognitiveEngine.analyzeProviderResponse("¿qué marca y modelo es el refrigerador?");
    assert.strictEqual(analysisQuestion.intent, "PROVIDER_ASK_QUESTION");
    assert(analysisQuestion.question_to_customer && analysisQuestion.question_to_customer.length > 5);
    console.log("  ✔ '¿qué marca y modelo es el refrigerador?' -> PROVIDER_ASK_QUESTION (PASS)");
  }

  // --------------------------------------------------------------------------
  // TEST 3: Bug Fix Verification - Off-Duty Provider Never Creates Fake Quotes
  // --------------------------------------------------------------------------
  console.log("\n▶ TEST 3: Cascading Advance on Provider Off-Duty / Decline");
  {
    const req = db.createRequest({
      raw_message: "Se me ponchó la goma en Dixie",
      service_category: "AUTOMOTIVE",
      service_type: "TIRE_CHANGE",
      latitude: 38.1632,
      longitude: -85.8341
    });

    const candidate1 = db.getProviderById("prov-automotive-01"); // Roberto González
    candidate1.availability_status = "AVAILABLE";

    const candidate2 = {
      id: "prov-auto-pedro",
      name: "Pedro Towing & Gomas",
      display_name: "Pedro Towing & Gomas",
      phone: "+15025550999",
      category: "AUTOMOTIVE",
      services: ["TIRE_CHANGE", "TOWING"],
      base_latitude: 38.1632,
      base_longitude: -85.8341,
      max_radius_miles: 30,
      availability_status: "AVAILABLE",
      capacity_today: 10,
      capacity_used_today: 0,
      reliability_score: 0.95
    };
    db.data.providers.push(candidate2);

    // Start cascade with Roberto and Pedro
    await cascadingEngine.startCascade(req, [
      { provider: candidate1, scores: { final: 95 } },
      { provider: candidate2, scores: { final: 85 } }
    ]);

    const activeReq = db.getRequestById(req.id);
    assert.strictEqual(activeReq.status, "WAITING_PROVIDER");
    assert.strictEqual(activeReq.matched_provider_id, candidate1.id);

    // Roberto replies: "hoy no trabajo"
    await cascadingEngine.handleProviderResponse(candidate1.id, "hoy no trabajo", req.id);

    // Verify Roberto is marked OFF_DUTY and cascade advanced to Pedro
    const updatedRoberto = db.getProviderById(candidate1.id);
    assert.strictEqual(updatedRoberto.availability_status, "OFF_DUTY", "Roberto must be marked OFF_DUTY");

    const advancedReq = db.getRequestById(req.id);
    assert.strictEqual(advancedReq.cascade_step, 1, "Cascade step must advance to 1");
    assert.strictEqual(advancedReq.matched_provider_id, candidate2.id, "Candidate must now be Pedro (prov-auto-pedro)");
    console.log("  ✔ Provider saying 'hoy no trabajo' marked OFF_DUTY and cascade advanced immediately to next candidate (PASS)");
  }

  // --------------------------------------------------------------------------
  // TEST 4: Atomic Capacity Hold / Lease on Provider
  // --------------------------------------------------------------------------
  console.log("\n▶ TEST 4: Atomic Capacity Hold / Lease on Provider During Cascade");
  {
    const reqA = db.createRequest({
      raw_message: "Fuga de agua urgente",
      service_category: "PLUMBING",
      service_type: "WATER_LEAK",
      latitude: 38.2527,
      longitude: -85.7585
    });

    const plumber = db.getProviderById("prov-plumbing-01"); // José Martínez
    plumber.availability_status = "AVAILABLE";

    // Request A contacts plumber
    await cascadingEngine.startCascade(reqA, [{ provider: plumber, scores: { final: 90 } }]);

    const leasedPlumber = db.getProviderById(plumber.id);
    assert(leasedPlumber.capacity_lease, "Provider must have active capacity lease");
    assert.strictEqual(leasedPlumber.capacity_lease.request_id, reqA.id);
    console.log(`  ✔ Capacity held for request ${reqA.id} until ${leasedPlumber.capacity_lease.expires_at}`);

    // Request B arrives concurrently and checks eligibility for the same plumber
    const reqB = db.createRequest({
      raw_message: "Se rompió la tubería del baño",
      service_category: "PLUMBING",
      service_type: "WATER_LEAK",
      latitude: 38.2527,
      longitude: -85.7585
    });

    const eligibilityCheck = checkProviderEligibility(leasedPlumber, reqB);
    assert.strictEqual(eligibilityCheck.eligible, false, "Leased provider must be ineligible for concurrent Request B");
    assert.strictEqual(eligibilityCheck.reason, "CAPACITY_LEASED");
    console.log("  ✔ Concurrent Request B correctly blocked by CAPACITY_LEASED (PASS)");

    // Plumber responds to Request A: "cobro 80 y voy en 15 minutos"
    await cascadingEngine.handleProviderResponse(plumber.id, "cobro 80 y voy en 15 minutos", reqA.id);

    // Lease should be released
    const releasedPlumber = db.getProviderById(plumber.id);
    assert.strictEqual(releasedPlumber.capacity_lease, null, "Capacity lease must be released after response");
    console.log("  ✔ Capacity lease released upon provider response (PASS)");
  }

  console.log("\n=================================================");
  console.log("  ALL ARCHITECTURAL PRIORITIES PASSING 100%!     ");
  console.log("=================================================\n");
  process.exit(0);
}

runTests().catch(err => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
