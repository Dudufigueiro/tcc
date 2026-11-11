const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const schemas = require('../validators/auth.validator');

const router = Router();

// freia tentativas de força bruta no login / cadastro
const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: { codigo: 'MUITAS_TENTATIVAS', mensagem: 'Muitas tentativas. Tente novamente em alguns minutos.' } },
});

router.post('/login', limitador, validate(schemas.login), controller.login);
router.post('/solicitar-cadastro', limitador, validate(schemas.solicitarCadastro), controller.solicitarCadastro);
router.get('/me', authenticate, controller.me);

module.exports = router;
