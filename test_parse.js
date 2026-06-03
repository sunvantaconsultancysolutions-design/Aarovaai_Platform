const fs = require('fs');
const text = fs.readFileSync('e:/test/c-generation/outputs/Arrays__in_c_language.json', 'utf8');
function parseJSONResilient(text) {
  let cleaned = text.replace(/```json/gi, '').replace(/```/g, '');
  cleaned = cleaned.replace(/"?===\s*CHECKPOINT.*?==="(,)?/g, '');
  cleaned = cleaned.replace(/===\s*CHECKPOINT.*?===(,)?/g, '');
  cleaned = cleaned.replace(/"([A-D])":\s*"([^"]+)"/g, '"$1) $2"');
  cleaned = cleaned.replace(/,\s*\]/g, ']');
  try {
    return JSON.parse(cleaned);
  } catch(e) {
    let lastBrace = cleaned.lastIndexOf('}');
    while (lastBrace !== -1) {
      let firstBracket = cleaned.indexOf('[');
      if (firstBracket === -1) firstBracket = 0;
      let validPart = cleaned.substring(firstBracket, lastBrace + 1);
      validPart = validPart.replace(/,\s*$/, '') + ']';
      try {
        return JSON.parse(validPart);
      } catch(e2) {
        lastBrace = cleaned.lastIndexOf('}', lastBrace - 1);
      }
    }
    return [];
  }
}
const res = parseJSONResilient(text);
console.log('Parsed items:', res.length);
if (res.length === 0) console.log('Failed completely!');
