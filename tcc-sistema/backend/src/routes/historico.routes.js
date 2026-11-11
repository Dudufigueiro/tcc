const { Router } = require('express');
const controller = require('../controllers/historico.controller');
const validate = require('../middlewares/validate');
const schemas = require('../validators/escolha.validator');

const router = Router();
router.get('/', validate(schemas.filtrosHistorico, 'query'), controller.listar);

module.exports = router;
