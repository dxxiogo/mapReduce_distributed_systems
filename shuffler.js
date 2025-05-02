const fs = require('fs');
const path = require('path');

const NUM_REDUCERS = 4;

function hashKey(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const grouped = Array(NUM_REDUCERS).fill(null).map(() => ({}));

const files = fs.readdirSync('intermediate/').filter(f => f.endsWith('.json'));

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(`intermediate/${file}`));
  for (const [word, count] of Object.entries(data)) {
    const reducerIndex = hashKey(word) % NUM_REDUCERS;
    grouped[reducerIndex][word] = (grouped[reducerIndex][word] || []).concat(count);
  }
}

for (let i = 0; i < NUM_REDUCERS; i++) {
  fs.writeFileSync(`reducers_input/reducer${i}.json`, JSON.stringify(grouped[i], null, 2));
  console.log(`Arquivo reducers_input/reducer${i}.json criado.`);
}