require('dotenv').config({ quiet: true });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:9000',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'carga_horaria',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'troque-este-segredo-em-producao',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
};

if (env.nodeEnv === 'production' && env.jwt.secret === 'troque-este-segredo-em-producao') {
  throw new Error('Defina JWT_SECRET no ambiente de produção.');
}

module.exports = env;