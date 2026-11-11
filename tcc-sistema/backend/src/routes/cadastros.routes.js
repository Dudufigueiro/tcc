/**
 * Dados-base gerenciados pelo gestor: disciplinas, turmas e critérios de prioridade.
 * Cada recurso expõe o CRUD completo; as rotas são geradas a partir do serviço + schema.
 */
const { Router } = require('express');
const createCrudController = require('../controllers/crud.controller');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { idParam } = require('../validators/common.validator');
const schemas = require('../validators/cadastros.validator');

function crudRouter({ service, schema, filtros }) {
  const controller = createCrudController(service);
  const router = Router();
  router.get('/', ...(filtros ? [validate(filtros, 'query')] : []), controller.listar);
  router.post('/', validate(schema), controller.criar);
  router.get('/:id', validate(idParam, 'params'), controller.buscar);
  router.put('/:id', validate(idParam, 'params'), validate(schema), controller.atualizar);
  router.delete('/:id', validate(idParam, 'params'), controller.remover);
  return router;
}

const router = Router();
router.use(authorize('GESTOR'));

router.use(
  '/disciplinas',
  crudRouter({ service: require('../services/disciplina.service'), schema: schemas.disciplina }),
);
router.use(
  '/turmas',
  crudRouter({ service: require('../services/turma.service'), schema: schemas.turma, filtros: schemas.filtrosTurma }),
);
router.use(
  '/criterios-prioridade',
  crudRouter({ service: require('../services/criterio.service'), schema: schemas.criterio }),
);

module.exports = router;
