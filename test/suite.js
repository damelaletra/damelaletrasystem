process.env.NODE_ENV = "test";
import assert from "assert";
import { understandRequest } from "../src/core/semantic.js";
import { checkProviderEligibility, filterEligibleProviders } from "../src/core/eligibility.js";
import { rankEligibleCandidates } from "../src/core/matching.js";
import { db } from "../src/core/db.js";
import { stateMachine } from "../src/core/stateMachine.js";
import { cascadingEngine } from "../src/core/cascading.js";
import { channels } from "../src/core/channels.js";
import { handleExternalFallback } from "../src/core/fallback.js";

channels.disableTwilioForTesting = true;

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

    const designReq1 = understandRequest("un dibujito para mi negocio");
    assert.strictEqual(designReq1.service_category, "TECH_SOFTWARE", "'un dibujito para mi negocio' must map to TECH_SOFTWARE");
    assert.strictEqual(designReq1.service_type, "GRAPHIC_DESIGN");
    console.log("  ✔ 'un dibujito para mi negocio' -> TECH_SOFTWARE / GRAPHIC_DESIGN (PASS)");

    const designReq2 = understandRequest("hacer un dibujito y cotizacion de logo");
    assert.strictEqual(designReq2.service_category, "TECH_SOFTWARE", "'hacer un dibujito' must NOT match 'ac' in HVAC");
    assert.strictEqual(designReq2.service_type, "GRAPHIC_DESIGN");
    console.log("  ✔ 'hacer un dibujito y cotizacion de logo' -> TECH_SOFTWARE / GRAPHIC_DESIGN (NOT HVAC) (PASS)");
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

    // 1. Customer asks for car lockout
    const res = await stateMachine.processCustomerInput("Dejé la llave adentro del carro en St. Matthews", "SMS", customerPhone);
    const req = res.request;
    assert.strictEqual(req.service_category, "LOCKSMITH", "Should classify as LOCKSMITH");
    
    const matchedProvider = db.getProviderById(req.matched_provider_id);
    assert(matchedProvider, "Matched provider must exist");
    assert.strictEqual(matchedProvider.category, "LOCKSMITH", "Matched provider must be a LOCKSMITH");

    // 2. Active waiting request lookup by phone
    const waitingReq = db.getActiveWaitingRequestForPhone(matchedProvider.phone);
    assert(waitingReq !== undefined && waitingReq.id === req.id, "Should find the active waiting request for provider phone");
    assert.strictEqual(waitingReq.matched_provider_id, matchedProvider.id);

    // 3. Provider responds with "son 100 de 15 a 20 minutos"
    const providerResp = await cascadingEngine.handleProviderResponse(matchedProvider.id, "son 100 de 15 a 20 minutos", waitingReq.id);
    assert.strictEqual(providerResp.success, true);
    assert.strictEqual(providerResp.quote.quoted_price, 100, "Price should be 100, NOT 15 or 20");
    assert.strictEqual(providerResp.quote.quoted_price_display, "$100", "Price display should be $100");
    assert.strictEqual(providerResp.quote.estimated_arrival, "15 a 20 minutos", "ETA should be 15 a 20 minutos");
    assert.strictEqual(providerResp.quote.provider_id, matchedProvider.id);
    console.log(`  ✔ 'son 100 de 15 a 20 minutos' correctly parsed: Provider=${matchedProvider.name}, Price=$100, ETA=15 a 20 minutos (PASS)`);

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

  // TEST 8: Conversational Business Profile Onboarding (Miguel Sosa - Software & Design)
  console.log("\n▶ TEST 8: Conversational Business Profile Onboarding (Miguel Sosa)");
  {
    const { providerOnboarding } = await import("../src/core/providerOnboarding.js");
    const miguel = db.getProviderByPhone("+15025550100");
    assert(miguel, "Miguel Sosa must exist in DB with phone +15025550100");
    assert.strictEqual(miguel.category, "TECH_SOFTWARE");

    const onbResult = await providerOnboarding.handleProviderDirectMessage(
      miguel,
      "Hola, soy Miguel. Hago páginas web modernas en Next.js y React, diseño UI/UX en Figma y desarrollo tiendas online. Cobro $75 la hora o por proyecto y mi portfolio es miguelsosa.dev"
    );

    assert.strictEqual(onbResult.success, true);
    assert(onbResult.reply && onbResult.reply.length > 10, "Must generate conversational reply");
    
    const updatedMiguel = db.getProviderByPhone("+15025550100");
    assert(updatedMiguel.services.length >= 3, "Services must be populated");
    assert(updatedMiguel.bio && updatedMiguel.bio.length > 10, "Bio must be populated");
    console.log(`  ✔ Conversational Onboarding passed: ${miguel.name} profile updated via natural chat (PASS)`);
  }

  // TEST 9: Design & Drawing Request Full Dispatch (Connecting to Miguel Sosa, NOT AC)
  console.log("\n▶ TEST 9: Design / Drawing Dispatch (Miguel Sosa vs False HVAC)");
  {
    const customerPhone = "+15029998877";
    const res = await stateMachine.processCustomerInput("Hola, quiero hacer un dibujito para mi negocio", "SMS", customerPhone);
    const req = res.request;

    assert.strictEqual(req.service_category, "TECH_SOFTWARE", "Request must be categorized as TECH_SOFTWARE");
    assert.strictEqual(req.matched_provider_id, "prov-miguel-sosa", "Request must be dispatched to Miguel Sosa, NOT HVAC / AC");
    
    const matchedProvider = db.getProviderById(req.matched_provider_id);
    assert.strictEqual(matchedProvider.name, "Miguel Sosa");
    console.log("  ✔ 'quiero hacer un dibujito para mi negocio' correctly routed to Miguel Sosa (Software & Design Studio) (PASS)");
  }

  // TEST 10: Service Modality Messaging Verification (Consulting/Taxes vs Appointment vs Emergency)
  console.log("\n▶ TEST 10: Service Modalities & Context-Aware Concierge Messaging");
  {
    const { getServiceModality, concierge } = await import("../src/core/concierge.js");

    // 1. Consulting Modality
    const consultModality = getServiceModality("CONSULTING_PROFESSIONAL", "TAX_PREPARATION");
    assert.strictEqual(consultModality, "CONSULTING_PROJECT");
    
    const taxProv = db.getProviders(p => p.category === "CONSULTING_PROFESSIONAL")[0];
    const consultQuoteMsg = concierge.formatQuoteForCustomer(taxProv, { priceDisplay: "$80", eta: "hoy en la tarde" }, { service_category: "CONSULTING_PROFESSIONAL" });
    assert(consultQuoteMsg.includes("disponibilidad para tu proyecto"), "Consulting quote must mention availability/project, NOT road arrival");
    console.log("  ✔ Consulting/Tax quote message formatted appropriately without ETA/road arrival (PASS)");

    // 2. Scheduled Appointment Modality
    const apptModality = getServiceModality("CLEANING", "HOUSE_CLEANING");
    assert.strictEqual(apptModality, "APPOINTMENT_SCHEDULED");
    const cleanProv = db.getProviders(p => p.category === "CLEANING")[0];
    const cleanQuoteMsg = concierge.formatQuoteForCustomer(cleanProv, { priceDisplay: "$90", eta: "mañana por la mañana" }, { service_category: "CLEANING" });
    assert(cleanQuoteMsg.includes("agendar tu cita/visita"), "Cleaning quote must mention scheduling appointment/visit");
    console.log("  ✔ Cleaning quote message formatted with appointment/visit scheduling (PASS)");

    // 3. Emergency Dispatch Modality
    const emergModality = getServiceModality("AUTOMOTIVE", "TIRE_CHANGE");
    assert.strictEqual(emergModality, "EMERGENCY_DISPATCH");
    const tireProv = db.getProviders(p => p.category === "AUTOMOTIVE")[0];
    const tireQuoteMsg = concierge.formatQuoteForCustomer(tireProv, { priceDisplay: "$65", eta: "20 minutos" }, { service_category: "AUTOMOTIVE" });
    assert(tireQuoteMsg.includes("puede atenderte 20 minutos"), "Roadside quote must mention arrival time");
    console.log("  ✔ Emergency dispatch quote formatted with fast arrival time (PASS)");
  }

  // TEST 11: Custom / In-Office Consulting Quotes (Roberto Méndez - Taxes & Consulting)
  console.log("\n▶ TEST 11: In-Office Custom Estimates & Relative Pricing (Roberto Méndez)");
  {
    const { concierge } = await import("../src/core/concierge.js");
    const customerPhone = "+15024449988";

    // 1. Customer asks for tax consultation
    const res = await stateMachine.processCustomerInput("Hola necesito ayuda con mis taxes y una asesoría para mi negocio en Louisville", "WHATSAPP", customerPhone);
    const req = res.request;
    assert.strictEqual(req.service_category, "CONSULTING_PROFESSIONAL");

    const roberto = db.getProviderById(req.matched_provider_id);
    assert(roberto.name.includes("Roberto"), "Should match Roberto Méndez");

    // Case A: "el precio es personalizable, en una consulta en la oficina"
    const analysisA = concierge.analyzeProviderMessage("el precio es personalizable, en una consulta en la oficina", req, roberto);
    assert.strictEqual(analysisA.price, null, "Price must be NULL, never default $75 or $80");
    assert.strictEqual(analysisA.priceDisplay, "Estimado personalizado en la oficina");
    const quoteMsgA = concierge.formatQuoteForCustomer(roberto, analysisA, req);
    assert(!quoteMsgA.includes("$75") && !quoteMsgA.includes("$80"), "Message must NOT contain any fake dollar amounts");
    assert(quoteMsgA.includes("estimado personalizado en la oficina"), "Message must mention in-office personalized estimate");
    console.log("  ✔ 'el precio es personalizable, en una consulta en la oficina' -> Custom in-office estimate (no fake $75) (PASS)");

    // Case B: "el precio es relativo, le hacemos un estimado aqui en la oficina, el martes a las dos puede ser?"
    const respB = await cascadingEngine.handleProviderResponse(roberto.id, "el precio es relativo, le hacemos un estimado aqui en la oficina, el martes a las dos puede ser?", req.id);
    assert.strictEqual(respB.success, true);
    assert.strictEqual(respB.quote.quoted_price, null, "Quoted price must be null");
    assert.strictEqual(respB.quote.quoted_price_display, "Estimado personalizado en la oficina");
    assert(respB.quote.estimated_arrival.includes("martes") && respB.quote.estimated_arrival.includes("2:00 PM"), "ETA must capture Tuesday at 2:00 PM");
    
    const quoteMsgB = concierge.formatQuoteForCustomer(roberto, respB.quote, req);
    assert(!quoteMsgB.includes("$75") && !quoteMsgB.includes("$80"), "Quote message must NOT contain $75 or $80");
    assert(quoteMsgB.includes("martes a las 2:00 PM"), "Quote message must include Tuesday 2:00 PM");
    assert(quoteMsgB.includes("estimado personalizado en la oficina"), "Quote message must mention personalized in-office estimate");
    console.log("  ✔ 'el precio es relativo, le hacemos un estimado aqui en la oficina, el martes a las dos puede ser?' -> Proper quote & appointment (PASS)");

    // Case C: Customer confirms "Sí, dale"
    const confRes = await stateMachine.processCustomerInput("Sí, dale", "WHATSAPP", customerPhone);
    assert.strictEqual(confRes.status, "CONNECTED");
    const completedReq = db.getRequestById(req.id);
    assert.strictEqual(completedReq.status, "CONNECTED");
    console.log("  ✔ Customer confirmed in-office consultation -> CONNECTED state established (PASS)");
  }

  
    // TEST 12: Legal Services Disambiguation and Strict Attorney Matching (REGLA - SERVICIOS LEGALES)
  console.log("\n🧪 TEST 12: Legal Services Disambiguation and Strict Attorney Matching (REGLA - SERVICIOS LEGALES)");
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

  console.log("\n=================================================");
  // TEST 13: Universal Disambiguation Across All Categories (ESTO DEBERÍA SER PARA CADA CASO)
  console.log("\n🧪 TEST 13: Universal Disambiguation Across All Categories (ESTO DEBERÍA SER PARA CADA CASO)");
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
    assert.strictEqual(tRes2.request.matched_provider_id, "prov-consulting-01", "Must route to Roberto Méndez");
    console.log("  ✓ Generic Accountant ('busco un contador') -> Clarification prompt -> Routed to Roberto Méndez (PASS)");

    // 4. Strict Cross-Category Ineligibility Verification
    const robertoMendez = db.getProviderById("prov-consulting-01");
    const plumbCandidateCheck = checkProviderEligibility(robertoMendez, {
      service_category: "PLUMBING",
      service_type: "DRAIN_CLEARING",
      property_type: "RESIDENTIAL",
      latitude: 38.2527,
      longitude: -85.7585
    });
    assert.strictEqual(plumbCandidateCheck.eligible, false, "Accountant can never do plumbing");
    assert.strictEqual(plumbCandidateCheck.reason, "CATEGORY_MISMATCH");

    const joseMartinez = db.getProviderById("prov-plumbing-01");
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


  console.log("   ALL TEST SUITES PASSED FLAWLESSLY!           ");
  console.log("=================================================\n");
}

runTests().catch(err => {
  console.error("❌ TEST SUITE FAILED:", err);
  process.exit(1);
});
