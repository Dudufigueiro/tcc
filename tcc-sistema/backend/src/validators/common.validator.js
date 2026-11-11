const z = require('./zod-pt');

const id = z.coerce.number().int().positive();

const idParam = z.object({ id });

const anoLetivo = z.coerce.number().int().min(2000).max(2100);

const turno = z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO']);

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (use HH:MM).');

module.exports = { z, id, idParam, anoLetivo, turno, hora };
