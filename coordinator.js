const fs = require('fs');
const redis = require('./redisClient');

(async () => {
  console.log("ENtrei aqui")
  const chunks = fs.readdirSync('chunks/').filter(f => f.endsWith('.txt'));

  try {
    for (const chunk of chunks) {
      console.log(chunk)
      await redis.rPush('mapper-tasks', `chunks/${chunk}`);
    }
  } catch (error) {
    console.error('Erro ao adicionar tarefas de mapper na fila:', error);
  }

  console.log('Tarefas dos mappers empilhadas. Aguarde os workers finalizarem.');
  process.exit(0);
})();