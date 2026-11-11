const { Router } = require('express');
const controller = require('../controllers/escolha.controller');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { idParam } = require('../validators/common.validator');
const schemas = require('../validators/escolha.validator');

const router = Router();

// Professor vê as próprias escolhas; gestor vê todas (filtros opcionais)
router.get('/', validate(schemas.filtros, 'query'), controller.listar);

// Vagas com interessados em disputa, ordenados pelos critérios de prioridade (gestor)
router.get('/disputas', authorize('GESTOR'), validate(schemas.filtrosAno, 'query'), controller.disputas);

// Validação em tempo real (não grava) e registro
router.post('/validar', validate(schemas.validarEscolha), controller.validar);
router.post('/', validate(schemas.registrar), controller.registrar);

// Ajustes
router.post('/:id/confirmar', authorize('GESTOR'), validate(idParam, 'params'), controller.confirmar);
router.post('/:id/cancelar', validate(idParam, 'params'), validate(schemas.cancelar), controller.cancelar);

module.exports = router;
