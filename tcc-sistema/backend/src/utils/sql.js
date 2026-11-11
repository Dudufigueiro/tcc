const { query } = require('../config/database');

async function anoLetivoPadrao(client) {
  const { rows } = await query('SELECT MAX(ano_letivo) AS ano FROM turma', [], client);
  return rows[0].ano;
}

module.exports = { anoLetivoPadrao };