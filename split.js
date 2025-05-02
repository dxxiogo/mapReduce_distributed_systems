const fs = require('fs');
const readline = require('readline');
const path = require('path');

const INPUT_FILE = 'data.txt';
const OUTPUT_DIR = 'chunks';
const NUM_CHUNKS = 10;

(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  const totalSize = fs.statSync(INPUT_FILE).size;
  const targetSize = totalSize / NUM_CHUNKS;

  let currentChunk = 0;
  let currentSize = 0;
  let currentStream = fs.createWriteStream(path.join(OUTPUT_DIR, `chunk${currentChunk}.txt`));

  const rl = readline.createInterface({
    input: fs.createReadStream(INPUT_FILE),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const lineSize = Buffer.byteLength(line + '\n');
    if (currentSize + lineSize > targetSize && currentChunk < NUM_CHUNKS - 1) {
      currentStream.end();
      currentChunk++;
      currentSize = 0;
      currentStream = fs.createWriteStream(path.join(OUTPUT_DIR, `chunk${currentChunk}.txt`));
    }
    currentStream.write(line + '\n');
    currentSize += lineSize;
  }

  currentStream.end();
  console.log('Divisão completa!');
})();
