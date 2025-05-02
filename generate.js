const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'data.txt');
const TARGET_SIZE = 1 * 1024 * 1024 * 1024; // 1GB em bytes
const WORDS = ['map', 'reduce', 'node', 'javascript', 'redis', 'chunk', 'data', 'stream', 'performance', 'parallel'];

const writeStream = fs.createWriteStream(FILE_PATH, { encoding: 'utf8' });


function generateRandomLine() {
  let line = '';
  for (let i = 0; i < 100; i++) {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    line += word + ' ';
  }
  return line.trim() + '\n';
}

let totalBytes = 0;

function writeChunk() {
  let ok = true;
  while (ok && totalBytes < TARGET_SIZE) {
    const line = generateRandomLine();
    totalBytes += Buffer.byteLength(line, 'utf8');
    ok = writeStream.write(line);
  }

  if (totalBytes < TARGET_SIZE) {
    writeStream.once('drain', writeChunk);
  } else {
    writeStream.end(() => {
      console.log('Arquivo gerado com sucesso!');
    });
  }
}

writeChunk();
