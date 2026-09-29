import fs from 'fs';

const suitePath = 'test/suite.js';
let content = fs.readFileSync(suitePath, 'utf8');

const test13Code = `
  // TEST 13: Universal Disambiguation Across All Categories (ESTO DEBERÍA SER PARA CADA CASO)
  console.log("\\n🧪 TEST 13: Universal Disambiguation Across All Categories (ESTO DEBERÍA SER PARA CADA CASO)");
  {
    const { understandRequest } = await import("../src/core/semantic.js");
    const { checkProviderEligibility } = await import("../src/core/eligibility.js");

    // 1. Generic Plumbing Disambiguation Flow
    const plumbParsed = understandRequest("Hola, necesito un plomero");
    assert.strictEqual(plumbParsed.service_category, "PLUMBING");
    assert.strictEqual(plumbParsed.service_type, "UNKNOWN");
    assert.strictEqual(plumbParsed.needs_clarification, true);
    assert.strictEqual(plumbParsed.clarification_prompt, "Claro. ¿Qué tipo de problema o trabajo de plomería necesitas resolver?");

    const plumbPhone = "+15025553311";
    const pRes1 = await stateMachine.processCustomerInput("Hola, necesito un plomero", "WHATSAPP", plumbPhone);
    assert.strictEqual(pRes1.status, "WAITING_CUSTOMER_CLARIFICATION");
    assert.strictEqual(pRes1.message, "Claro. ¿Qué tipo de problema o trabajo de plomería necesitas resolver?");
    assert.strictEqual(pRes1.request.matched_provider_id, null, "No provider contacted before clarification");

    // Customer clarifies plumbing: toilet overflowing / clogged
    const pRes2 = await stateMachine.processCustomerInput("Se me desbordó el inodoro y el agua no baja", "WHATSAPP", plumbPhone);
    assert.strictEqual(pRes2.status, "WAITING_PROVIDER");
    assert.strictEqual(pRes2.request.service_type, "DRAIN_CLEARING");
    assert(pRes2.request.matched_provider_id, "Must match plumbing provider");
    console.log("  ✓ Generic Plumbing ('necesito un plomero') -> Clarification prompt -> Resolved to DRAIN_CLEARING (PASS)");

    // 2. Generic Automotive Mechanic Disambiguation Flow
    const mechParsed = understandRequest("Hola, necesito un mecánico");
    assert.strictEqual(mechParsed.service_category, "AUTOMOTIVE");
    assert.strictEqual(mechParsed.service_type, "UNKNOWN");
    assert.strictEqual(mechParsed.needs_clarification, true);
    assert.strictEqual(mechParsed.clarification_prompt, "Claro. ¿Qué problema o falla presenta tu vehículo?");

    const mechPhone = "+15025553322";
    const mRes1 = await stateMachine.processCustomerInput("Hola, necesito un mecánico", "WHATSAPP", mechPhone);
    assert.strictEqual(mRes1.status, "WAITING_CUSTOMER_CLARIFICATION");
    assert.strictEqual(mRes1.message, "Claro. ¿Qué problema o falla presenta tu vehículo?");

    // Customer clarifies mechanic: battery jump
    const mRes2 = await stateMachine.processCustomerInput("El carro no prende, parece que se descargó la batería", "WHATSAPP", mechPhone);
    assert.strictEqual(mRes2.status, "WAITING_PROVIDER");
    assert.strictEqual(mRes2.request.service_type, "BATTERY_JUMP");
    assert(mRes2.request.matched_provider_id, "Must match automotive roadside provider");
    console.log("  ✓ Generic Mechanic ('necesito un mecánico') -> Clarification prompt -> Resolved to BATTERY_JUMP (PASS)");

    // 3. Generic Accountant / Tax Disambiguation Flow
    const taxParsed = understandRequest("Hola, busco un contador");
    assert.strictEqual(taxParsed.service_category, "CONSULTING_PROFESSIONAL");
    assert.strictEqual(taxParsed.service_type, "UNKNOWN");
    assert.strictEqual(taxParsed.needs_clarification, true);
    assert.strictEqual(taxParsed.clarification_prompt, "Claro. ¿Necesitas ayuda con taxes personales, de negocio, contabilidad o trámites?");

    const taxPhone = "+15025553333";
    const tRes1 = await stateMachine.processCustomerInput("Hola, busco un contador", "WHATSAPP", taxPhone);
    assert.strictEqual(tRes1.status, "WAITING_CUSTOMER_CLARIFICATION");
    assert.strictEqual(tRes1.message, "Claro. ¿Necesitas ayuda con taxes personales, de negocio, contabilidad o trámites?");

    // Customer clarifies: taxes and payroll
    const tRes2 = await stateMachine.processCustomerInput("Es para hacer los taxes de mi compañía y nómina", "WHATSAPP", taxPhone);
    assert.strictEqual(tRes2.status, "WAITING_PROVIDER");
    assert.strictEqual(tRes2.request.matched_provider_id, "prov-roberto-mendez", "Must route to Roberto Méndez");
    console.log("  ✓ Generic Accountant ('busco un contador') -> Clarification prompt -> Routed to Roberto Méndez (PASS)");

    // 4. Strict Cross-Category Ineligibility Verification
    const robertoMendez = db.getProviderById("prov-roberto-mendez");
    const plumbCandidateCheck = checkProviderEligibility(robertoMendez, {
      service_category: "PLUMBING",
      service_type: "DRAIN_CLEARING",
      property_type: "RESIDENTIAL",
      latitude: 38.2527,
      longitude: -85.7585
    });
    assert.strictEqual(plumbCandidateCheck.eligible, false, "Accountant can never do plumbing");
    assert.strictEqual(plumbCandidateCheck.reason, "CATEGORY_MISMATCH");

    const joseMartinez = db.getProviderById("prov-jose-martinez");
    const taxCandidateCheck = checkProviderEligibility(joseMartinez, {
      service_category: "CONSULTING_PROFESSIONAL",
      service_type: "TAX_PREPARATION",
      property_type: "RESIDENTIAL",
      latitude: 38.2527,
      longitude: -85.7585
    });
    assert.strictEqual(taxCandidateCheck.eligible, false, "Plumber can never do taxes");
    assert.strictEqual(taxCandidateCheck.reason, "CATEGORY_MISMATCH");
    console.log("  ✓ Strict Category Isolation verified (No false cross-matching between any trades) (PASS)");

    // 5. UNKNOWN != INELIGIBLE for Any Category
    const unknownSubtypeElig = checkProviderEligibility(joseMartinez, {
      service_category: "PLUMBING",
      service_type: "CUSTOM_COMMERCIAL_GREASE_TRAP",
      property_type: "RESIDENTIAL",
      latitude: 38.2527,
      longitude: -85.7585
    });
    assert.strictEqual(unknownSubtypeElig.eligible, true, "UNKNOWN sub-service remains eligible (UNKNOWN != INELIGIBLE)");
    assert(unknownSubtypeElig.progressiveInquiry, "Must trigger progressive inquiry to confirm unlisted sub-service");
    console.log("  ✓ Universal UNKNOWN ≠ INELIGIBLE verified with progressive inquiry (PASS)");
  }
`;

const banner = 'ALL TEST SUITES PASSED FLAWLESSLY!';
const lastBannerIdx = content.lastIndexOf(banner);

if (lastBannerIdx !== -1) {
  // Find preceding console.log
  const beforeBanner = content.lastIndexOf('console.log(', lastBannerIdx);
  const insertIdx = content.lastIndexOf('\n', beforeBanner);
  
  content = content.slice(0, insertIdx) + test13Code + '\n' + content.slice(insertIdx);
  fs.writeFileSync(suitePath, content, 'utf8');
  console.log('Successfully inserted TEST 13 before final banner');
} else {
  console.error('Banner not found');
}
