import fs from 'fs';

const suitePath = 'test/suite.js';
let content = fs.readFileSync(suitePath, 'utf8');

const test12Code = `  // TEST 12: Legal Services Disambiguation and Strict Attorney Matching (REGLA - SERVICIOS LEGALES)
  console.log("\\n🧪 TEST 12: Legal Services Disambiguation and Strict Attorney Matching (REGLA - SERVICIOS LEGALES)");
  {
    const { understandRequest } = await import("../src/core/semantic.js");
    const { checkProviderEligibility } = await import("../src/core/eligibility.js");

    // 1. Generic Legal Request ("Hola, necesito un abogado")
    const genericParsed = understandRequest("Hola, necesito un abogado");
    assert.strictEqual(genericParsed.service_category, "LEGAL_SERVICES", "Generic attorney must map to LEGAL_SERVICES");
    assert.strictEqual(genericParsed.legal_specialty, "UNKNOWN", "Generic attorney specialty must be UNKNOWN");
    assert.strictEqual(genericParsed.needs_clarification, true, "Generic attorney request must require clarification");
    assert.strictEqual(genericParsed.clarification_prompt, "Claro. ¿Qué tipo de asunto legal necesitas resolver?", "Must ask exact clarification question");

    // 2. Strict Ineligibility of Tax / Accounting / Consulting / Notary for Legal Requests
    const robertoMendez = db.getProviders(p => p.category === "CONSULTING_PROFESSIONAL")[0];
    const accountingMismatch = checkProviderEligibility(robertoMendez, {
      service_category: "LEGAL_SERVICES",
      service_type: "UNKNOWN",
      property_type: "RESIDENTIAL",
      latitude: 38.2527,
      longitude: -85.7585
    });
    assert.strictEqual(accountingMismatch.eligible, false, "Tax/Consulting provider must NEVER be eligible for legal services");
    assert.strictEqual(accountingMismatch.reason, "CATEGORY_MISMATCH");

    // 3. Conversational State Flow - Asking clarification without contacting providers
    const customerLegalPhone = "+15025557766";
    const resA = await stateMachine.processCustomerInput("Hola, necesito un abogado", "WHATSAPP", customerLegalPhone);
    assert.strictEqual(resA.status, "WAITING_CUSTOMER_CLARIFICATION");
    assert.strictEqual(resA.message, "Claro. ¿Qué tipo de asunto legal necesitas resolver?");
    assert.strictEqual(resA.request.legal_specialty, "UNKNOWN");
    assert.strictEqual(resA.request.matched_provider_id, null, "No provider matched yet");
    console.log("  ✓ 'Hola, necesito un abogado' -> Disambiguation clarification prompt sent; tax/consulting strictly excluded (PASS)");

    // 4. Customer Clarifies Specialty ("Es por un accidente de auto, choqué ayer")
    const resB = await stateMachine.processCustomerInput("Es por un accidente de auto, choqué ayer", "WHATSAPP", customerLegalPhone);
    assert.strictEqual(resB.status, "WAITING_PROVIDER");
    assert.strictEqual(resB.request.legal_specialty, "PERSONAL_INJURY");
    assert.strictEqual(resB.request.matched_provider_id, "prov-legal-01", "Must match Lic. Alejandro Ramos (Bufete Legal Louisville)");
    console.log("  ✓ Customer clarification -> Resolved to PERSONAL_INJURY and dispatched to Lic. Alejandro Ramos (PASS)");

    // 5. Explicit Legal Request with Immediate Specialty ("Hola, necesito un abogado de inmigración urgente")
    const directParsed = understandRequest("Hola, necesito un abogado de inmigración urgente");
    assert.strictEqual(directParsed.service_category, "LEGAL_SERVICES");
    assert.strictEqual(directParsed.legal_specialty, "IMMIGRATION");
    assert.strictEqual(directParsed.needs_clarification, false, "Explicit specialty must NOT require redundant clarification");
    console.log("  ✓ Explicit 'abogado de inmigración' -> Direct dispatch without redundant clarification (PASS)");

    // 6. UNKNOWN != INELIGIBLE for Legal Providers with general practice
    const ramos = db.getProviderById("prov-legal-01");
    const legalElig = checkProviderEligibility(ramos, {
      service_category: "LEGAL_SERVICES",
      service_type: "LEGAL_CONSULTATION",
      legal_specialty: "CORPORATE_LAW",
      property_type: "COMMERCIAL",
      latitude: 38.2527,
      longitude: -85.7585
    });
    assert.strictEqual(legalElig.eligible, true, "UNKNOWN specialty does not mean ineligible (UNKNOWN != INELIGIBLE)");
    console.log("  ✓ UNKNOWN ≠ INELIGIBLE verified for legal provider profile verification (PASS)");
  }
`;

// Replace existing TEST 12 in suite.js if present or append before banner
const test12Regex = /\/\/ TEST 12:[\s\S]*?(?=console\.log\("\\n================================================="\);)/;
if (test12Regex.test(content)) {
  content = content.replace(test12Regex, test12Code + '\n  ');
  fs.writeFileSync(suitePath, content, 'utf8');
  console.log('Successfully updated TEST 12 in test/suite.js');
} else {
  const parts = content.split('console.log("\\n=================================================");');
  const newContent = parts[0] + test12Code + '\n  console.log("\\n=================================================");' + parts.slice(1).join('console.log("\\n=================================================");');
  fs.writeFileSync(suitePath, newContent, 'utf8');
  console.log('Successfully added TEST 12 to test/suite.js');
}
