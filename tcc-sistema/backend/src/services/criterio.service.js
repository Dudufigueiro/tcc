const createCrudService = require('./crud.factory');

module.exports = createCrudService({
  table: 'criterio_prioridade',
  columns: ['descricao', 'tipo', 'ordem', 'ativo'],
  orderBy: 'ordem, id',
  label: 'Critério de prioridade',
});