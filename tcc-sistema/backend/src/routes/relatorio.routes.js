const { Router } = require('express');
const controller = require('../controllers/relatorio.controller');
const validate = require('../middlewares/validate');
const schemas = require('../validators/escolha.validator');

const router = Router();
router.get('/consolidado', validate(schemas.filtrosAno, 'query'), controller.consolidado);
router.get('/consolidado.csv', validate(schemas.filtrosAno, 'query'), controller.consolidadoCsv);

module.exports = router;
