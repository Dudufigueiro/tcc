const { Pool, types } = require('pg');
const env = require('./env');

// DATE (oid 1082) volta como string 'YYYY-MM-DD' em vez de objeto Date (evita problemas de fuso)
types.setTypeParser(1082, (value) => value);
// TIME (oid 1083) volta como 'HH:MM' (descarta os segundos)
types.setTypeParser(1083, (value) => value.slice(0, 5));

const pool = new Pool(env.db);

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL:', err.message);
});

/** Executa uma consulta usando o pool (ou um client de transação, se informado). */
function query(text, params = [], client = pool) {
  return client.query(text, params);
}

/** Executa `fn(client)` dentro de uma transação (COMMIT em sucesso, ROLLBACK em erro). */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };