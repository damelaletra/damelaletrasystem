import fs from 'fs';

const smPath = 'src/core/stateMachine.js';
let content = fs.readFileSync(smPath, 'utf8').replace(/\r\n/g, '\n');

const startMarker = '// Case A: Customer is resolving a Legal Specialty Disambiguation prompt';
const endMarker = 'await channels.sendCustomerMessage(activeWaitingClarification, concierge.formatCustomerFirstResponse());';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

const replacementNew = `// Case A: Customer is resolving a Service Disambiguation prompt for ANY category (ESTO DEBERÍA SER PARA CADA CASO)
      if (
        activeWaitingClarification.clarification_type === "SERVICE_DISAMBIGUATION" ||
        activeWaitingClarification.clarification_type === "LEGAL_SPECIALTY" ||
        activeWaitingClarification.service_type === "UNKNOWN"
      ) {
        const clarified = understandClarification(text, activeWaitingClarification.service_category);
        const resolvedServiceType = clarified.service_type || "GENERAL_SERVICE";
        const resolvedLegalSpecialty = activeWaitingClarification.service_category === "LEGAL_SERVICES" ?
          (clarified.legal_specialty || resolvedServiceType) : null;

        db.updateRequest(activeWaitingClarification.id, {
          status: "SEARCHING",
          service_category: activeWaitingClarification.service_category,
          service_type: resolvedServiceType,
          legal_specialty: resolvedLegalSpecialty,
          clarification_type: null
        });

        db.logEvent(activeWaitingClarification.id, "SERVICE_DISAMBIGUATION_RESOLVED", "CUSTOMER", {
          rawAnswer: text,
          resolvedServiceType,
          resolvedLegalSpecialty
        });

        `;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.slice(0, startIdx) + replacementNew + content.slice(endIdx);
  fs.writeFileSync(smPath, content, 'utf8');
  console.log('Successfully updated Case A with universal resolution');
} else {
  console.error('Markers not found: startIdx =', startIdx, 'endIdx =', endIdx);
}
