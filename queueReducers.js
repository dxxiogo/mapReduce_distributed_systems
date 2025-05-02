const fs = require('fs');
const redis = require('./redisClient');

(async () => {
  const reducerFiles = fs.readdirSync('reducers_input/').filter(f => f.endsWith('.json'));

  for (const file of reducerFiles) {
    await redis.rPush('reducer-tasks', `reducers_input/${file}`);
  }

  console.log('Tarefas dos reducers empilhadas no Redis.');
  process.exit(0);
})();
