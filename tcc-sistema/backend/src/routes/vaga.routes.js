const { Router } = require('express');
const controller = require('../controllers/vaga.controller');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { idParam } = require('../validators/common.validator');
const schemas = require('../validators/cadastros.validator');

const router = Router();

// Professor e gestor consultam as vagas (o professor recebe também a compatibilidade)
router.get('/', validate(schemas.filtrosVaga, 'query'), controller.listar);
router.get('/anos-letivos', controller.anosLetivos);
router.get('/:id', validate(idParam, 'params'), controller.buscar);

// Somente o gestor mantém as vagas
router.post('/', authorize('GESTOR'), validate(schemas.vaga), controller.criar);
router.put('/:id', authorize('GESTOR'), validate(idParam, 'params'), validate(schemas.vaga), controller.atualizar);
router.delete('/:id', authorize('GESTOR'), validate(idParam, 'params'), controller.remover);

module.exports = router;
