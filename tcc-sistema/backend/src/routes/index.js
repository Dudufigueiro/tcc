const { Router } = require('express');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');

const router = Router();

// Públicas
router.use('/auth', require('./auth.routes'));

// A partir daqui todas exigem autenticação
router.use(authenticate);

router.use('/professores', require('./professor.routes'));
router.use('/vagas', require('./vaga.routes'));
router.use('/escolhas', require('./escolha.routes'));
router.use('/', require('./cadastros.routes')); // /disciplinas, /turmas, /criterios-prioridade (gestor)

// Somente gestor
router.use('/historico', authorize('GESTOR'), require('./historico.routes'));
router.use('/painel', authorize('GESTOR'), require('./painel.routes'));
router.use('/relatorios', authorize('GESTOR'), require('./relatorio.routes'));

module.exports = router;
