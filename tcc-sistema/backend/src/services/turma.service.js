const createCrudService = require('./crud.factory');

module.exports = createCrudService({
  table: 'turma',
  columns: ['serie', 'identificacao', 'turno', 'matriz', 'numero_alunos', 'ano_letivo'],
  orderBy: 'ano_letivo DESC, serie, identificacao',
  label: 'Turma',
  filters: { ano_letivo: 'ano_letivo', turno: 'turno' },
});