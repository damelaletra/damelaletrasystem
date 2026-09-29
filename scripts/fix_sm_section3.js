import fs from 'fs';

const smPath = 'src/core/stateMachine.js';
let content = fs.readFileSync(smPath, 'utf8');

// Find start and end of section 3
const startIdx = content.indexOf('// 3. Check Legal Services Rule');
const endIdx = content.indexOf('// Standard Zero-friction First Customer Experience Response');

const newUniversalSection = `// 3. Universal Rule: Disambiguate when service_type is UNKNOWN or needs_clarification (ESTO DEBERÍA SER PARA CADA CASO)
    if (
      understanding.service_category &&
      (understanding.service_type === "UNKNOWN" || understanding.needs_clarification)
    ) {
      const prompt = CATEGORY_CLARIFICATION_PROMPTS[understanding.service_category] ||
        understanding.clarification_prompt ||
        "Claro. ¿Me podrías detallar un poco más qué tipo de trabajo o problema necesitas resolver?";

      db.updateRequest(request.id, {
        normalized_intent: \`\${understanding.service_category}_INQUIRY\`,
        service_category: understanding.service_category,
        service_type: "UNKNOWN",
        legal_specialty: understanding.service_category === "LEGAL_SERVICES" ? "UNKNOWN" : null,
        status: "WAITING_CUSTOMER_CLARIFICATION",
        clarification_type: "SERVICE_DISAMBIGUATION",
        location_raw: understanding.location_raw,
        latitude: understanding.latitude,
        longitude: understanding.longitude,
        property_type: understanding.property_type,
        urgency: understanding.urgency
      });

      db.logEvent(request.id, "SERVICE_DISAMBIGUATION_REQUESTED", "SYSTEM", {
        category: understanding.service_category,
        rule: "UNIVERSAL_DISAMBIGUATION"
      });

      await channels.sendCustomerMessage(request, prompt, { requiresClarification: true, category: understanding.service_category });
      return { request: db.getRequestById(request.id), status: "WAITING_CUSTOMER_CLARIFICATION", message: prompt };
    }

    `;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.slice(0, startIdx) + newUniversalSection + content.slice(endIdx);
  fs.writeFileSync(smPath, content, 'utf8');
  console.log('Successfully updated section 3 in stateMachine.js');
} else {
  console.error('Indices not found: startIdx =', startIdx, 'endIdx =', endIdx);
}
