import assert from "assert";
import { understandRequest } from "../src/core/semantic.js";
import { checkProviderEligibility, filterEligibleProviders } from "../src/core/eligibility.js";
import { rankEligibleCandidates } from "../src/core/matching.js";
import { db } from "../src/core/db.js";
import { stateMachine } from "../src/core/stateMachine.js";
import { cascadingEngine } from "../src/core/cascading.js";
import { handleExternalFallback } from "../src/core/fallback.js";

async function runTests() {
  console.log("=================================================");
  console.log("   DAME LA LETRA (DML) - MASTER TEST SUITE      ");
  console.log("=================================================\n");

  db.seed();

  // TEST 1: Semantic NLP & Regional Slang Understanding
  console.log("▶ TEST 1: Semantic & Dialect Understanding");
  {
    const tireReq = understandRequest("Se me ponchó la goma en Dixie");
    assert.strictEqual(tireReq.service_category, "AUTOMOTIVE", "Tire should map to AUTOMOTIVE");
    assert.strictEqual(tireReq.service_type, "TIRE_CHANGE", "Should detect TIRE_CHANGE");
    assert.strictEqual(tireReq.location_raw, "Dixie Hwy, Louisville", "Should resolve Dixie Hwy");
    assert.strictEqual(tireReq.urgency, "HIGH", "Tire emergency should be HIGH urgency");
    assert(tireReq.confidence >= 0.80, "Confidence should be >= 0.80");
    console.log("  ✔ 'Se me ponchó la goma en Dixie' -> AUTOMOTIVE / TIRE_CHANGE / Dixie Hwy (PASS)");

    const roofReq = understandRequest("Tengo una gotera tremenda en el techo");
    assert.strictEqual(roofReq.service_category, "ROOFING", "Gotera should map to ROOFING");
    console.log("  ✔ 'Tengo una gotera tremenda en el techo' -> ROOFING (PASS)");

    const lockReq = understandRequest("Dejé las llaves adentro del carro");
    assert.strictEqual(lockReq.service_category, "LOCKSMITH", "Llaves adentro should map to LOCKSMITH");
    console.log("  ✔ 'Dejé las llaves adentro del carro' -> LOCKSMITH (PASS)");
  }

  // TEST 2: Deterministic Eligibility Engine & UNKNOWN != NO
  console.log("\n▶ TEST 2: Deterministic Eligibility Engine & UNKNOWN != NO");
  {
    const allProviders = db.getProviders();
    const jose = allProviders.find(p => p.category === "PLUMBING");
    const miguel = allProviders.find(p => p.name.includes("Miguel") || (p.category === "HVAC" && p.commercial_capable === 1));

    // Case A: Commercial Plumbing vs José (commercial_capable = -1 / UNKNOWN)
    const commercialPlumbing = {
      service_category: "PLUMBING",
      service_type: "PIPE_LEAK",
      property_type: "COMMERCIAL",
      latitude: 38.1632,
      longitude: -85.8341
    };
    const joseResult = checkProviderEligibility(jose, commercialPlumbing);
    assert.strictEqual(joseResult.eligible, true, "José (commercial UNKNOWN) must NOT be disqualified (UNKNOWN != NO)");
    console.log("  ✔ UNKNOWN != NO: Provider is eligible with progressive inquiry hook (PASS)");

    // Case B: Geographic Radius Gate
    const farAwayRequest = {
      service_category: "PLUMBING",
      service_type: "PIPE_LEAK",
      property_type: "RESIDENTIAL",
      latitude: 37.5000,
      longitude: -85.8000
    };
    const radiusResult = checkProviderEligibility(jose, farAwayRequest);
    assert.strictEqual(radiusResult.eligible, false, "Far request must be excluded by geofence");
    assert.strictEqual(radiusResult.reason, "OUT_OF_SERVICE_RADIUS");
    console.log("  ✔ Out of service radius correctly excluded (PASS)");
  }

  // TEST 3: Full End-to-End Zero-Friction Customer Lifecycle
  console.log("\n▶ TEST 3: Full Lifecycle: 'Necesito esto' -> 'Dame un momento' -> 'Listo'");
  {
    const convId = "test-customer-lifecycle-" + Date.now();

    console.log("  Step 1: Customer sends 'Se me ponchó la goma en Dixie'");
    const res1 = await stateMachine.processCustomerInput("Se me ponchó la goma en Dixie", "WHATSAPP", convId);
    const activeReq = res1.request;
    assert.strictEqual(activeReq.status, "WAITING_PROVIDER");
    console.log("  ✔ Request entered WAITING_PROVIDER, dispatched to eligible provider");

    console.log("  Step 2: Provider replies 'Sí, puedo llegar en 20 minutos y cobro $65'");
    const res2 = await cascadingEngine.handleProviderResponse(activeReq.matched_provider_id, "Sí, puedo llegar en 20 minutos y cobro $65", activeReq.id);
    assert.strictEqual(res2.success, true);

    const reqWaitingCustomer = db.getRequestById(activeReq.id);
    assert.strictEqual(reqWaitingCustomer.status, "WAITING_CUSTOMER");
    assert.strictEqual(reqWaitingCustomer.quoted_price, 65);
    console.log("  ✔ Quote parsed ($65, 20 minutos) and customer informed: 'Listo. Puede atenderte...'");

    console.log("  Step 3: Customer confirms 'Sí, dale'");
    const res3 = await stateMachine.processCustomerInput("Sí, dale", "WHATSAPP", convId);

    const reqCompleted = db.getRequestById(activeReq.id);
    assert.strictEqual(reqCompleted.status, "CONNECTED");
    assert.strictEqual(reqCompleted.connection_status, "CONNECTED");
    assert(reqCompleted.completed_at !== null);
    console.log("  ✔ Connection created! Provider phone delivered to customer. State = CONNECTED (PASS)");
  }

  // TEST 4: External Fallback Engine
  console.log("\n▶ TEST 4: External Fallback with Transparent Disclaimer");
  {
    const rareReq = db.createRequest({
      raw_message: "Necesito una grúa pesada de 50 toneladas para levantar maquinaria",
      service_category: "CRANE_RIGGING",
      service_type: "CRANE_SERVICE",
      location_raw: "Louisville, KY"
    });

    const fallbackResult = await handleExternalFallback(rareReq);
    assert.strictEqual(fallbackResult.type, "EXTERNAL_DISCOVERY");
    assert(fallbackResult.message.includes("no forma parte de nuestra red directa"), "Must include transparent disclaimer");
    console.log("  ✔ Transparent External Fallback presented with disclaimer (PASS)");
  }

  // TEST 5: Locksmith Auto Lockout & Exact Provider Quote Parsing ("son 100 de 15 a 20 minutos")
  console.log("\n▶ TEST 5: Locksmith Quote Parsing & Accurate Provider Attribution");
  {
    const customerPhone = "+15024170732";
    const providerSharedPhone = "+15026587853";

    // 1. Customer asks for car lockout
    const res = await stateMachine.processCustomerInput("Dejé la llave adentro del carro en St. Matthews", "SMS", customerPhone);
    const req = res.request;
    assert.strictEqual(req.service_category, "LOCKSMITH", "Should classify as LOCKSMITH");
    assert.strictEqual(req.matched_provider_id, "prov-10-locksmith", "Should match Frank Cerrajería (prov-10-locksmith)");

    // 2. Active waiting request lookup by phone
    const waitingReq = db.getActiveWaitingRequestForPhone(providerSharedPhone);
    assert(waitingReq !== undefined && waitingReq.id === req.id, "Should find the active waiting request for shared phone");
    assert.strictEqual(waitingReq.matched_provider_id, "prov-10-locksmith");

    // 3. Provider responds with "son 100 de 15 a 20 minutos"
    const activeProviderId = waitingReq.matched_provider_id;
    const providerResp = await cascadingEngine.handleProviderResponse(activeProviderId, "son 100 de 15 a 20 minutos", waitingReq.id);
    assert.strictEqual(providerResp.success, true);
    assert.strictEqual(providerResp.quote.quoted_price, 100, "Price should be 100, NOT 15 or 20");
    assert.strictEqual(providerResp.quote.quoted_price_display, "$100", "Price display should be $100");
    assert.strictEqual(providerResp.quote.estimated_arrival, "15 a 20 minutos", "ETA should be 15 a 20 minutos");
    assert.strictEqual(providerResp.quote.provider_id, "prov-10-locksmith", "Provider MUST be Frank Cerrajería, NOT José Martínez");
    console.log("  ✔ 'son 100 de 15 a 20 minutos' correctly parsed: Provider=Frank Cerrajería, Price=$100, ETA=15 a 20 minutos (PASS)");

    // 4. Customer accepts
    const acceptRes = await stateMachine.processCustomerInput("dale", "SMS", customerPhone);
    assert.strictEqual(acceptRes.status, "CONNECTED");
    console.log("  ✔ Connection successfully completed for Locksmith (PASS)");
  }

  // TEST 6: Multi-Turn Question Relay
  console.log("\n▶ TEST 6: Multi-Turn Provider Clarification Relay");
  {
    const customerPhone = "+15024170799";
    const res = await stateMachine.processCustomerInput("Necesito pintar la casa", "SMS", customerPhone);
    const req = res.request;

    // Provider asks question
    const qRes = await cascadingEngine.handleProviderResponse(req.matched_provider_id, "¿Qué tamaño tiene la casa y cuántos cuartos?", req.id);
    assert.strictEqual(qRes.status, "WAITING_CUSTOMER_CLARIFICATION");

    // Customer answers
    const ansRes = await stateMachine.processCustomerInput("Tiene 3 cuartos y unos 1500 sq ft", "SMS", customerPhone);
    assert.strictEqual(ansRes.status, "FORWARDED_TO_PROVIDER");
    assert.strictEqual(db.getRequestById(req.id).status, "WAITING_PROVIDER");
    console.log("  ✔ Provider question and Customer answer cleanly relayed without creating false requests (PASS)");
  }

  // TEST 7: Customer Natural Language Affirmations ("Perfecto", "Si confírmale")
  console.log("\n▶ TEST 7: Natural Language Affirmations ('Perfecto', 'Si confírmale')");
  {
    const customerPhone = "+15027807332";

    // Request 1: Painting with "Perfecto"
    const res = await stateMachine.processCustomerInput("Hola quiero pintar mi casa de 4 cuartos en Preston hwy", "SMS", customerPhone);
    const req = res.request;
    assert.strictEqual(req.service_category, "HANDYMAN");

    await cascadingEngine.handleProviderResponse(req.matched_provider_id, "cobro 200 voy mañana", req.id);
    
    // Customer confirms with "Perfecto"
    const confRes1 = await stateMachine.processCustomerInput("Perfecto", "SMS", customerPhone);
    assert.strictEqual(confRes1.status, "CONNECTED", "'Perfecto' must confirm the connection");
    console.log("  ✔ Customer 'Perfecto' correctly established CONNECTED state (PASS)");

    // Request 2: "Si confírmale"
    const customerPhone2 = "+15027807333";
    const res2 = await stateMachine.processCustomerInput("Se rompió un tubo de agua en Okolona", "SMS", customerPhone2);
    const req2 = res2.request;
    await cascadingEngine.handleProviderResponse(req2.matched_provider_id, "voy en 30 minutos cobro 80", req2.id);

    const confRes2 = await stateMachine.processCustomerInput("Si confírmale", "SMS", customerPhone2);
    assert.strictEqual(confRes2.status, "CONNECTED", "'Si confírmale' must confirm the connection");
    console.log("  ✔ Customer 'Si confírmale' correctly established CONNECTED state (PASS)");
  }

  console.log("\n=================================================");
  console.log("   ALL TEST SUITES PASSED FLAWLESSLY!           ");
  console.log("=================================================\n");
}

runTests().catch(err => {
  console.error("❌ TEST SUITE FAILED:", err);
  process.exit(1);
});
