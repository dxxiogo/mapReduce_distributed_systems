const fs = require('fs');
const redis = require('./redisClient');
const { spawn } = require('child_process');

const waitForChannel = (channel, expectedCount) => {
  return new Promise((resolve) => {
    let count = 0;
    const subscriber = redis.duplicate();

    subscriber.connect().then(() => {
      subscriber.subscribe(channel, () => {
        count++;
        if (count === expectedCount) {
          resolve();
          subscriber.unsubscribe(channel);
          subscriber.quit();
        }
      });
    });
  });
};

const waitForMessages = (channel, expectedCount) => {
  return new Promise(async (resolve) => {
    const seen = new Set();
    const messages = [];
    const sub = redis.duplicate();
    await sub.connect();

    await sub.subscribe(channel, (message) => {
      if (!seen.has(message)) {
        seen.add(message);
        messages.push(message);
        console.log(`Recebida mensagem no canal '${channel}': ${message}`);
      }

      if (seen.size === expectedCount) {
        resolve(messages);
        sub.unsubscribe(channel);
        sub.quit();
      }
    });
  });
};


function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [script]);
    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    child.on('close', () => {
      resolve(output || '');
    });
  });
}

const runMappers = async (numWorkers) => {
  const promises = [];

  try {
    for (let i = 0; i < numWorkers; i++) {
      const loop = async () => {
          const output = await run('mapperWorker.js');
          console.log(`Saída do mapper:\n${output}`);

          if (!output || output.includes('Nenhuma tarefa de mapper disponível.')) {
            console.log('Nenhuma tarefa encontrada, finalizando worker...');
          } else {
            console.log('Mapper vai continuar rodando...');
          }
      };
      promises.push(loop());
    }

    console.log("Aguardando todos os mappers...");
    await Promise.all(promises);
    console.log("Todos os mappers finalizaram");
  } catch (error) {
    console.log('Erro no runMappers:', error);
  }
};


(async () => {
  console.log('Iniciando MapReduce automático...\n');

  console.log('Dividindo arquivo...');
  await run('split.js');

  console.log('Enfileirando mappers...');
  await run('coordinator.js');

  const chunks = fs.readdirSync('chunks/').filter(f => f.endsWith('.txt'));
  const numChunks = chunks.length;

  const mapperPromise = waitForMessages('mapper-finished', numChunks);

  console.log('Iniciando mappers...');
  await runMappers(10);
  console.log('Mappers concluídos');

  console.log('Aguardando finalização dos mappers...');
  await mapperPromise;


  console.log('Realizando shuffle...');
  await run('shuffler.js');

  console.log('Enfileirando reducers...');
  await run('queueReducers.js');

  console.log('Iniciando reducers...');
  Array.from({ length: 4 }, () => run('reducerWorker.js'));
  await waitForChannel('reducer-finished', 4);

  console.log('Unindo resultados...');
  await run('merge.js');

  console.log('\nProcessamento MapReduce completo!');
  process.exit(0);
})();
