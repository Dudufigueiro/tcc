const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/database');

const server = app.listen(env.port, () => {
  console.log(`API da Carga Horária Docente rodando em http://localhost:${env.port}/api`);
});

function encerrar(sinal) {
  console.log(`\n${sinal} recebido. Encerrando...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => encerrar('SIGINT'));
process.on('SIGTERM', () => encerrar('SIGTERM'));
