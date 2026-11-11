const { z } = require('zod');

/** Mensagens de validação do Zod em português do Brasil. */
z.config({
  customError: (iss) => {
    switch (iss.code) {
      case 'invalid_type':
        if (iss.input === undefined || iss.input === null) return 'Campo obrigatório.';
        if (iss.expected === 'number' || iss.expected === 'int') return 'Deve ser um número.';
        if (iss.expected === 'boolean') return 'Deve ser verdadeiro ou falso.';
        if (iss.expected === 'string') return 'Deve ser um texto.';
        if (iss.expected === 'array') return 'Deve ser uma lista.';
        return 'Valor inválido.';
      case 'too_small':
        if (iss.origin === 'string') {
          return Number(iss.minimum) <= 1 ? 'Campo obrigatório.' : `Deve ter no mínimo ${iss.minimum} caracteres.`;
        }
        if (iss.origin === 'array') return `Selecione ao menos ${iss.minimum} item(ns).`;
        return iss.inclusive ? `Deve ser maior ou igual a ${iss.minimum}.` : `Deve ser maior que ${iss.minimum}.`;
      case 'too_big':
        if (iss.origin === 'string') return `Deve ter no máximo ${iss.maximum} caracteres.`;
        return iss.inclusive ? `Deve ser menor ou igual a ${iss.maximum}.` : `Deve ser menor que ${iss.maximum}.`;
      case 'invalid_format':
        if (iss.format === 'email') return 'E-mail inválido.';
        if (iss.format === 'date') return 'Data inválida (use AAAA-MM-DD).';
        return 'Formato inválido.';
      case 'invalid_value':
        return `Valor inválido. Opções: ${iss.values.join(', ')}.`;
      default:
        return undefined; // mensagem padrão
    }
  },
});

module.exports = z;
