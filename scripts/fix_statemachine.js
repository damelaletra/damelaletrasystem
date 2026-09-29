import fs from 'fs';

const smPath = 'src/core/stateMachine.js';
let content = fs.readFileSync(smPath, 'utf8');

content = content.replace(
  'await cascadingEngine.dispatchInitial(activeWaitingClarification);',
  'await cascadingEngine.startCascade(db.getRequestById(activeWaitingClarification.id), ranked);'
);

fs.writeFileSync(smPath, content, 'utf8');
console.log('Fixed cascading call in stateMachine.js');
