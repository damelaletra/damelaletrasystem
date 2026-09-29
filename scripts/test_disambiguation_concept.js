import { matchesKeyword } from '../src/core/semantic.js';

console.log('plomero:', matchesKeyword('Hola necesito un plomero', 'plomero'));
console.log('mecanico:', matchesKeyword('necesito un mecánico', 'mecánico'));
console.log('contador:', matchesKeyword('hola busco un contador', 'contador'));
