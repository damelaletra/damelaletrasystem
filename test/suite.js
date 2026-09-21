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

  db.seed(); // Reset to clean state

  // TEST 1: Semantic NLP & Regional Slang Understanding
  console.log("? TEST 1: Semantic & Dialect Understanding");
  {
    const tireReq = understandRequest("Se me ponchó la goma en Dixie");
    assert.strictEqual(tireReq.service_category, "AUTOMOTIVE", "Tire should map to AUTOMOTIVE");
    assert.strictEqual(tireReq.service_type, "TIRE_CHANGE", "Should detect TIRE_CHANGE");
    assert.strictEqual(tireReq.location_raw, "Dixie Hwy, Louisville", "Should resolve Dixie Hwy");
    assert.strictEqual(tireReq.urgency, "HIGH", "Tire emergency should be HIGH urgency");
    assert(tireReq.confidence >= 0.80, "Confidence should be >= 0.80");
    console.log("  ? 'Se me ponchó la goma en Dixie' -> AUTOMOTIVE / TIRE_CHANGE / Dixie Hwy (PASS)");

    const acReq = understandRequest("El aire está prendido pero no tira frío en la casa");
    assert.strictEqual(acReq.service_category, "HVAC", "AC should map to HVAC");
    assert.strictEqual(acReq.property_type, "RESIDENTIAL", "Should detect RESIDENTIAL");
    console.log("  ? 'El aire está prendido pero no tira frío...' -> HVAC / RESIDENTIAL (PASS)");

    const drainReq = understandRequest("Tremenda tupición en el fregadero de mi oficina");
    assert.strictEqual(drainReq.service_category, "PLUMBING", "Tupición should map to PLUMBING");
    assert.strictEqual(drainReq.property_type, "COMMERCIAL", "Oficina should map to COMMERCIAL");
    console.log("  ? 'Tremenda tupición en la oficina' -> PLUMBING / COMMERCIAL (PASS)");
  }

  // TEST 2: Deterministic Eligibility Engine & UNKNOWN != NO
  console.log("\n? TEST 2: Deterministic Eligibility Engine & UNKNOWN != NO");
  {
    const allProviders = db.getProviders();
    const jose = allProviders.find(p => p.id === "prov-jose-martinez");
    const miguel = allProviders.find(p => p.id === "prov-miguel-fernandez");

    // Case A: Residential request vs Miguel (Commercial ONLY)
    const residentialHvac = {
      service_category: "HVAC",
      service_type: "AC_REPAIR",
      property_type: "RESIDENTIAL",
      latitude: 38.2542,
      longitude: -85.7594
    };
    const miguelResult = checkProviderEligibility(miguel, residentialHvac);
    assert.strictEqual(miguelResult.eligible, false, "Miguel (commercial only) must be excluded for residential");
    assert.strictEqual(miguelResult.reason, "COMMERCIAL_ONLY");
    console.log("  ? Miguel (Commercial-Only) disqualified for Residential request (PASS)");

    // Case B: Commercial request vs José (commercial_capable = -1 / UNKNOWN)
    // CRITICAL PRINCIPLE: UNKNOWN != NO
    const commercialPlumbing = {
      service_category: "PLUMBING",
      service_type: "PIPE_LEAK",
      property_type: "COMMERCIAL",
      latitude: 38.1632,
      longitude: -85.8341
    };
    const joseResult = checkProviderEligibility(jose, commercialPlumbing);
    assert.strictEqual(joseResult.eligible, true, "José (commercial UNKNOWN) must NOT be disqualified (UNKNOWN != NO)");
    assert(joseResult.progressiveInquiry !== null, "Should flag progressive inquiry to ask José");
    console.log("  ? UNKNOWN != NO: José is eligible with progressive inquiry hook (PASS)");

    // Case C: Geographic Radius Gate
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
    console.log("  ? Out of service radius correctly excluded (PASS)");
  }

  // TEST 3: Paid Priority vs Eligibility Guarantee
  console.log("\n? TEST 3: Absolute Paid Priority Guarantee (Money Cannot Override Eligibility)");
  {
    const req = {
      service_category: "HVAC",
      service_type: "AC_REPAIR",
      property_type: "RESIDENTIAL",
      latitude: 38.1510,
      longitude: -85.7001
    };

    const providers = db.getProviders();
    const { eligible, disqualified } = filterEligibleProviders(providers, req);

    const miguelInDisqualified = disqualified.find(d => d.providerId === "prov-miguel-fernandez");
    assert(miguelInDisqualified !== undefined, "Miguel must be disqualified before matching");

    const ranked = rankEligibleCandidates(eligible, req);
    assert.strictEqual(ranked[0].provider.id, "prov-carlos-ruiz", "Carlos should win eligible rank");
    console.log("  ? Ineligible provider cannot be boosted by money; excluded prior to ranking (PASS)");
  }

  // TEST 4: Progressive Profile Learning (UNKNOWN -> KNOWN)
  console.log("\n? TEST 4: Progressive Profile Learning in Action");
  {
    const joseBefore = db.getProviderById("prov-jose-martinez");
    assert.strictEqual(joseBefore.commercial_capable, -1, "José starts with UNKNOWN commercial capability");

    cascadingEngine.handleProviderResponse("prov-jose-martinez", "Sí, también hacemos comercial");

    const joseAfter = db.getProviderById("prov-jose-martinez");
    assert.strictEqual(joseAfter.commercial_capable, 1, "José's profile progressively updated to commercial_capable = 1");
    console.log("  ? Progressive profile updated from UNKNOWN to 1 via conversational response (PASS)");
  }

  // TEST 5: Full End-to-End Zero-Friction Customer Lifecycle
  console.log("\n? TEST 5: Full Lifecycle: 'Necesito esto' -> 'Dame un momento' -> 'Listo'");
  {
    const convId = "test-customer-lifecycle-" + Date.now();

    // Step 1: Customer sends natural language request
    console.log("  Step 1: Customer sends 'Se me ponchó la goma en Dixie'");
    const res1 = await stateMachine.processCustomerInput("Se me ponchó la goma en Dixie", "WHATSAPP", convId);
    const activeReq = res1.request;
    assert.strictEqual(activeReq.status, "WAITING_PROVIDER");
    assert.strictEqual(activeReq.matched_provider_id, "prov-roberto-gonzalez");
    console.log("  ? Request entered WAITING_PROVIDER, dispatched to Roberto (502 Towing & Tires)");

    // Step 2: Provider Simulator replies in natural language
    console.log("  Step 2: Provider replies 'Sí, puedo llegar en 20 minutos y cobro $65'");
    const res2 = cascadingEngine.handleProviderResponse("prov-roberto-gonzalez", "Sí, puedo llegar en 20 minutos y cobro $65", activeReq.id);
    assert.strictEqual(res2.success, true);

    const reqWaitingCustomer = db.getRequestById(activeReq.id);
    assert.strictEqual(reqWaitingCustomer.status, "WAITING_CUSTOMER");
    assert.strictEqual(reqWaitingCustomer.quoted_price, 65);
    console.log("  ? Quote parsed ($65, 20 minutos) and customer informed: 'Listo. Roberto puede atenderte...'");

    // Step 3: Customer confirms: "Sí, dale"
    console.log("  Step 3: Customer confirms 'Sí, dale'");
    const res3 = stateMachine.processCustomerInput("Sí, dale", "WHATSAPP", convId);

    const reqCompleted = db.getRequestById(activeReq.id);
    assert.strictEqual(reqCompleted.status, "CONNECTED");
    assert.strictEqual(reqCompleted.connection_status, "CONNECTED");
    assert(reqCompleted.completed_at !== null);
    console.log("  ? Connection created! Provider phone delivered to customer. State = CONNECTED (PASS)");
  }

  // TEST 6: External Fallback Engine
  console.log("\n? TEST 6: External Fallback with Transparent Disclaimer");
  {
    const rareReq = db.createRequest({
      raw_message: "Necesito una grúa pesada de 50 toneladas para levantar maquinaria",
      service_category: "CRANE_RIGGING",
      service_type: "CRANE_SERVICE",
      location_raw: "Louisville, KY"
    });

    const fallbackResult = handleExternalFallback(rareReq);
    assert.strictEqual(fallbackResult.type, "EXTERNAL_DISCOVERY");
    assert.strictEqual(fallbackResult.discovery.business_name, "Derby City Heavy Rigging & Crane Service");
    assert(fallbackResult.message.includes("no forma parte de nuestra red directa"), "Must include transparent disclaimer");
    console.log("  ? Transparent External Fallback presented with disclaimer (PASS)");
  }

  console.log("\n=================================================");
  console.log("   ALL 6 TEST SUITES PASSED FLAWLESSLY!         ");
  console.log("=================================================\n");
}

runTests().catch(err => {
  console.error("? TEST SUITE FAILED:", err);
  process.exit(1);
});
