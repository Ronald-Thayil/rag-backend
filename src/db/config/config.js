require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || null,
    database: process.env.DB_NAME || 'rag_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    dialect: 'postgres'
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || null,
    database: process.env.DB_NAME || 'rag_db_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    dialect: 'postgres'
  },
  production: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || null,
    database: process.env.DB_NAME || 'rag_db_prod',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    dialect: 'postgres'
  }
};
