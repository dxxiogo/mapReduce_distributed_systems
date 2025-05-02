const fs = require('fs');
const redis = require('./redisClient');

(async () => {
  const task = await redis.lPop('reducer-tasks');
  if (!task) return console.log('Nenhuma tarefa de reducer disponível.');

  const data = JSON.parse(fs.readFileSync(task));
  const result = {};

  for (const [word, counts] of Object.entries(data)) {
    result[word] = counts.reduce((acc, val) => acc + val, 0);
  }

  const index = task.match(/(\d+)\.json$/)[1];
  fs.writeFileSync(`reducers_output/reducer${index}.txt`, JSON.stringify(result, null, 2));
  await redis.publish('reducer-finished', `reducer${index}`);
  console.log(`Reducer ${index} finalizou.`);
})();
