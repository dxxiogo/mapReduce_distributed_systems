const fs = require('fs');
const path = require('path');

const outputDir = 'reducers_output/';
const finalResultPath = 'final_result.txt';

const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.txt'));

const finalResult = {};

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(outputDir, file)));

  for (const [word, count] of Object.entries(data)) {
    finalResult[word] = (finalResult[word] || 0) + count;
  }
}

fs.writeFileSync(finalResultPath, JSON.stringify(finalResult, null, 2));
console.log(`Arquivo final "${finalResultPath}" gerado com sucesso.`);
