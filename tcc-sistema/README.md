# Sistema de Gerenciamento da Carga Horária Docente

TCC II – Sistemas de Informação (Horus Faculdades) · EEB José Marcolino Eckert

Sistema web para os professores escolherem as aulas do ano letivo, validando automaticamente a carga horária
semanal e a disponibilidade das vagas. Com as escolhas feitas, o gestor faz o lançamento no SISGESC.

## Tecnologias

- Frontend: Vue 3, Quasar, Pinia, Vue Router e Axios
- Backend: Node.js, Express, JWT e Zod
- Banco de dados: PostgreSQL

## Funcionalidades

- **Professor:** vê as vagas, escolhe aulas e manifesta interesse em vagas já ocupadas.
- **Gestor:** aprova cadastros de professores, define o regime de carga horária, mantém disciplinas, turmas, vagas e critérios de prioridade, decide as disputas e gera o relatório consolidado (tela, impressão e CSV).
- **Regras validadas antes de confirmar a escolha:** limite de aulas semanais do professor, vaga disponível, cadastro aprovado e escolha duplicada.
- **Histórico:** toda alteração fica registrada com usuário, data e hora.

## Como executar

Requisitos: Node.js 22.12+ e PostgreSQL 13+.

**1. Banco de dados**

Crie o banco `carga_horaria` e execute nele o script SQL de criação das tabelas (`banco_carga_horaria.sql`),
que também cadastra o usuário gestor inicial e os critérios de prioridade.

**2. Backend**

Crie o arquivo `backend/.env`:

```
PORT=3000
CORS_ORIGIN=http://localhost:9000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=carga_horaria
DB_USER=postgres
DB_PASSWORD=sua_senha
JWT_SECRET=um-segredo-longo-e-aleatorio
JWT_EXPIRES_IN=8h
```

Depois:

```bash
cd backend
npm install
npm run dev
```

A API sobe em `http://localhost:3000/api`.

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

A aplicação abre em `http://localhost:9000`.

## Acesso inicial

| Perfil | E-mail              | Senha    |
| ------ | ------------------- | -------- |
| Gestor | gestor@escola.local | admin123 |

Os professores se cadastram pela tela de login e aguardam a aprovação do gestor. Troque a senha do gestor antes de usar em produção.

## Estrutura

```
backend/src
  config/        variáveis de ambiente e conexão com o banco
  routes/        rotas da API
  controllers/   camada HTTP
  services/      regras de negócio
  middlewares/   autenticação, permissões, validação e erros
  validators/    schemas de entrada (Zod)
  utils/         erros, constantes e funções auxiliares

frontend/src
  boot/          configuração do Axios
  router/        rotas e controle de acesso por perfil
  layouts/       layouts de login e da área logada
  pages/         telas (auth, professor, gestor)
  components/    componentes reutilizáveis
  services/      chamadas à API
  stores/        estado global (Pinia)
  utils/         formatação e notificações
```

## Observações

- O sistema não controla horários das aulas: só a quantidade de aulas semanais.
- Um professor só pode ser excluído se nunca registrou escolhas, para preservar o histórico. Nos demais casos, desative o usuário.
- Em vaga ocupada, o professor manifesta interesse (status `EM_DISPUTA`). Os candidatos aparecem ordenados pelos critérios de prioridade ativos e o gestor decide.