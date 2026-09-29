import fs from 'fs';

const suitePath = 'test/suite.js';
let content = fs.readFileSync(suitePath, 'utf8');

content = content.replace(/"prov-roberto-mendez"/g, '"prov-consulting-01"');
content = content.replace(/"prov-jose-martinez"/g, '"prov-plumbing-01"');

fs.writeFileSync(suitePath, content, 'utf8');
console.log('Fixed provider IDs in test/suite.js');
