const createCrudService = require('./crud.factory');

module.exports = createCrudService({
  table: 'disciplina',
  columns: ['codigo', 'nome', 'area'],
  orderBy: 'nome',
  label: 'Disciplina',
});
