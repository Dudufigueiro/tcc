import { defineBoot } from '#q-app'
import { QSelect } from 'quasar'

/**
 * Faz todos os selects (inclusive o de "registros por página" das tabelas) abrirem como
 * menu suspenso. Por padrão, o Quasar troca o menu por uma janela grande (modal) quando
 * o navegador se identifica como dispositivo móvel.
 */
export default defineBoot(() => {
  QSelect.props.behavior.default = 'menu'
})
