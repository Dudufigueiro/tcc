const { Router } = require('express');
const controller = require('../controllers/painel.controller');
const validate = require('../middlewares/validate');
const schemas = require('../validators/escolha.validator');

const router = Router();
router.get('/resumo', validate(schemas.filtrosAno, 'query'), controller.resumo);

module.exports = router;
