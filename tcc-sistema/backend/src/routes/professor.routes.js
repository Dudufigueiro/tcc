const { Router } = require('express');
const controller = require('../controllers/professor.controller');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { idParam } = require('../validators/common.validator');
const schemas = require('../validators/professor.validator');

const router = Router();

// Professor logado
router.get('/me/resumo', authorize('PROFESSOR'), controller.meuResumo);

// Gestão de professores (gestor)
router.get('/', authorize('GESTOR'), validate(schemas.filtros, 'query'), controller.listar);
router.post('/', authorize('GESTOR'), validate(schemas.criar), controller.criar);
router.get('/:id', authorize('GESTOR'), validate(idParam, 'params'), controller.buscar);
router.put('/:id', authorize('GESTOR'), validate(idParam, 'params'), validate(schemas.atualizar), controller.atualizar);
router.delete('/:id', authorize('GESTOR'), validate(idParam, 'params'), controller.remover);
router.patch(
  '/:id/validacao',
  authorize('GESTOR'),
  validate(idParam, 'params'),
  validate(schemas.validacao),
  controller.validarCadastro,
);

module.exports = router;
