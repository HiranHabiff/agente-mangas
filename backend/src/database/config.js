require('dotenv').config({ path: '../../.env' });

module.exports = {
  development: {
    username: process.env.DB_USER || 'manga_user',
    password: process.env.DB_PASSWORD || 'manga123',
    database: process.env.DB_NAME || 'manga_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  },
};
