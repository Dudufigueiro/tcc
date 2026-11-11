const { query } = require('../config/database');
const AppError = require('../utils/AppError');

/**
 * Gera um serviço CRUD simples para tabelas de cadastro.
 * Os nomes de colunas vêm de uma lista fixa (nunca da requisição), então não há risco de SQL injection.
 *
 * @param {object} cfg
 * @param {string} cfg.table     nome da tabela
 * @param {string[]} cfg.columns colunas graváveis
 * @param {string} cfg.orderBy   cláusula ORDER BY padrão
 * @param {string} cfg.label     nome do registro (para mensagens)
 * @param {object} [cfg.filters] { parametroDaQuery: 'coluna' } para filtros de igualdade na listagem
 */
function createCrudService({ table, columns, orderBy, label, filters = {} }) {
  const naoEncontrado = () => AppError.notFound(`${label} não encontrado(a).`);

  return {
    async listar(params = {}) {
      const where = [];
      const values = [];
      for (const [param, column] of Object.entries(filters)) {
        if (params[param] !== undefined) {
          values.push(params[param]);
          where.push(`${column} = $${values.length}`);
        }
      }
      const sql = `SELECT * FROM ${table} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${orderBy}`;
      const { rows } = await query(sql, values);
      return rows;
    },

    async buscar(id) {
      const { rows } = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      if (!rows[0]) throw naoEncontrado();
      return rows[0];
    },

    async criar(data) {
      const cols = columns.filter((c) => data[c] !== undefined);
      const placeholders = cols.map((_, i) => `$${i + 1}`);
      const { rows } = await query(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
        cols.map((c) => data[c]),
      );
      return rows[0];
    },

    async atualizar(id, data) {
      const cols = columns.filter((c) => data[c] !== undefined);
      if (!cols.length) throw AppError.badRequest('Nenhum campo para atualizar.');
      const sets = cols.map((c, i) => `${c} = $${i + 1}`);
      const { rows } = await query(
        `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${cols.length + 1} RETURNING *`,
        [...cols.map((c) => data[c]), id],
      );
      if (!rows[0]) throw naoEncontrado();
      return rows[0];
    },

    async remover(id) {
      const { rowCount } = await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
      if (!rowCount) throw naoEncontrado();
    },
  };
}

module.exports = createCrudService;