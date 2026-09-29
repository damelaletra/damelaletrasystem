import { understandRequest } from '../src/core/semantic.js';

console.log('1. Plomero genérico:', understandRequest('Hola, necesito un plomero'));
console.log('2. Mecánico genérico:', understandRequest('Hola, necesito un mecánico'));
console.log('3. Limpieza genérica:', understandRequest('Hola, necesito limpieza'));
console.log('4. Contador genérico:', understandRequest('Hola, busco un contador'));
console.log('5. Abogado genérico:', understandRequest('Hola, necesito un abogado'));
console.log('6. Plomero específico (tubo roto):', understandRequest('Se me reventó una tubería botando agua'));
console.log('7. Goma ponchada (específico):', understandRequest('Se me ponchó la goma en Dixie'));
