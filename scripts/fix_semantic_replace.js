import fs from 'fs';

const semanticPath = 'src/core/semantic.js';
let content = fs.readFileSync(semanticPath, 'utf8');

const startMarker = '// 2.5 Legal Services Detection & Strict Specialty Disambiguation';
const endMarker = '  // 3. Match service pattern';

const newUniversalBlock = `  // 2.5 Universal Generic Disambiguation (REGLA: PARA CADA CASO)
  // If the user requests a trade/professional generically without stating the specific symptom/job:
  for (const item of GENERIC_CATEGORY_TRIGGERS) {
    const hasTrigger = item.triggers.some(t => matchesKeyword(normalizedText, t));
    if (hasTrigger) {
      // Check if specific symptom/sub-specialty is already present
      let hasSymptom = item.symptoms.some(s => normalizedText.includes(s));
      let legalSpecialty = null;

      if (item.category === "LEGAL_SERVICES") {
        const detected = detectLegalSpecialty(normalizedText);
        if (detected !== "LEGAL_GENERAL") {
          hasSymptom = true;
          legalSpecialty = detected;
        } else {
          hasSymptom = false;
          legalSpecialty = "UNKNOWN";
        }
      }

      if (!hasSymptom) {
        return {
          raw_message: rawMessage,
          confidence: 0.95,
          intent: \`\${item.category}_INQUIRY\`,
          service_category: item.category,
          service_type: "UNKNOWN",
          legal_specialty: legalSpecialty,
          needs_clarification: true,
          clarification_prompt: CATEGORY_CLARIFICATION_PROMPTS[item.category] || "Claro. ¿Qué trabajo o problema necesitas resolver?",
          urgency: "MEDIUM",
          property_type: property_type,
          location_raw: location.name,
          latitude: location.lat,
          longitude: location.lng,
          location_detected: location.matched
        };
      } else if (item.category === "LEGAL_SERVICES" && legalSpecialty && legalSpecialty !== "UNKNOWN") {
        return {
          raw_message: rawMessage,
          confidence: 0.95,
          intent: \`LEGAL_\${legalSpecialty}\`,
          service_category: "LEGAL_SERVICES",
          service_type: legalSpecialty,
          legal_specialty: legalSpecialty,
          needs_clarification: false,
          clarification_prompt: null,
          urgency: (legalSpecialty === "CRIMINAL" || legalSpecialty === "IMMIGRATION") ? "HIGH" : "MEDIUM",
          property_type: property_type,
          location_raw: location.name,
          latitude: location.lat,
          longitude: location.lng,
          location_detected: location.matched
        };
      }
    }
  }
`;

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.slice(0, startIdx) + newUniversalBlock + '\n' + content.slice(endIdx);
  fs.writeFileSync(semanticPath, content, 'utf8');
  console.log('Successfully replaced 2.5 with Universal Generic Disambiguation in understandRequest');
} else {
  console.error('Could not find markers: startIdx =', startIdx, 'endIdx =', endIdx);
}
