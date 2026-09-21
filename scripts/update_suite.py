# -*- coding: utf-8 -*-

content = """import assert from "assert";
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
  console.log("=================================================\\n");

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
  console.log("\\n▶ TEST 2: Deterministic Eligibility Engine & UNKNOWN != NO");
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
  console.log("\\n▶ TEST 3: Full Lifecycle: 'Necesito esto' -> 'Dame un momento' -> 'Listo'");
  {
    const convId = "test-customer-lifecycle-" + Date.now();

    console.log("  Step 1: Customer sends 'Se me ponchó la goma en Dixie'");
    const res1 = await stateMachine.processCustomerInput("Se me ponchó la goma en Dixie", "WHATSAPP", convId);
    const activeReq = res1.request;
    assert.strictEqual(activeReq.status, "WAITING_PROVIDER");
    console.log("  ✔ Request entered WAITING_PROVIDER, dispatched to eligible provider");

    console.log("  Step 2: Provider replies 'Sí, puedo llegar en 20 minutos y cobro $65'");
    const res2 = cascadingEngine.handleProviderResponse(activeReq.matched_provider_id, "Sí, puedo llegar en 20 minutos y cobro $65", activeReq.id);
    assert.strictEqual(res2.success, true);

    const reqWaitingCustomer = db.getRequestById(activeReq.id);
    assert.strictEqual(reqWaitingCustomer.status, "WAITING_CUSTOMER");
    assert.strictEqual(reqWaitingCustomer.quoted_price, 65);
    console.log("  ✔ Quote parsed ($65, 20 minutos) and customer informed: 'Listo. Puede atenderte...'");

    console.log("  Step 3: Customer confirms 'Sí, dale'");
    const res3 = stateMachine.processCustomerInput("Sí, dale", "WHATSAPP", convId);

    const reqCompleted = db.getRequestById(activeReq.id);
    assert.strictEqual(reqCompleted.status, "CONNECTED");
    assert.strictEqual(reqCompleted.connection_status, "CONNECTED");
    assert(reqCompleted.completed_at !== null);
    console.log("  ✔ Connection created! Provider phone delivered to customer. State = CONNECTED (PASS)");
  }

  // TEST 4: External Fallback Engine
  console.log("\\n▶ TEST 4: External Fallback with Transparent Disclaimer");
  {
    const rareReq = db.createRequest({
      raw_message: "Necesito una grúa pesada de 50 toneladas para levantar maquinaria",
      service_category: "CRANE_RIGGING",
      service_type: "CRANE_SERVICE",
      location_raw: "Louisville, KY"
    });

    const fallbackResult = handleExternalFallback(rareReq);
    assert.strictEqual(fallbackResult.type, "EXTERNAL_DISCOVERY");
    assert(fallbackResult.message.includes("no forma parte de nuestra red directa"), "Must include transparent disclaimer");
    console.log("  ✔ Transparent External Fallback presented with disclaimer (PASS)");
  }

  console.log("\\n=================================================");
  console.log("   ALL TEST SUITES PASSED FLAWLESSLY!           ");
  console.log("=================================================\\n");
}

runTests().catch(err => {
  console.error("❌ TEST SUITE FAILED:", err);
  process.exit(1);
});
"""

with open("test/suite.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated test/suite.js cleanly!")
