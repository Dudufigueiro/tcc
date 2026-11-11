import { Notify } from 'quasar'

export const notificarSucesso = (mensagem) =>
  Notify.create({ type: 'positive', message: mensagem, icon: 'check_circle' })

export const notificarErro = (erroOuMensagem) => {
  const mensagem = typeof erroOuMensagem === 'string' ? erroOuMensagem : erroOuMensagem?.mensagem
  Notify.create({
    type: 'negative',
    message: mensagem || 'Ocorreu um erro inesperado.',
    icon: 'error',
  })
}

export const notificarAviso = (mensagem) =>
  Notify.create({ type: 'warning', message: mensagem, icon: 'warning', textColor: 'dark' })
