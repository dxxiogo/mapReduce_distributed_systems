const fs = require('fs');
const path = require('path');
const readline = require('readline');
const redis = require('./redisClient');

(async () => {
  console.log('Iniciando o worker do mapper...');
  const chunkFile = await redis.lPop('mapper-tasks');
  console.log("C" + chunkFile)
  if (!chunkFile) return console.log('Nenhuma tarefa de mapper disponível.');

  const wordCount = {};
  const rl = readline.createInterface({
    input: fs.createReadStream(chunkFile),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const words = line.toLowerCase().match(/\b\w+\b/g);
    if (words) {
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    }
  }

  const mapperId = path.basename(chunkFile, '.txt');
  const outputPath = `intermediate/${mapperId}.json`;
  fs.writeFileSync(outputPath, JSON.stringify(wordCount, null, 2));
  await redis.publish('mapper-finished', mapperId);
  await redis.quit()
  console.log(`Mapper ${mapperId} finalizou.`);
})();