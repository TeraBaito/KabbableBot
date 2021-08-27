const { Sequelize } = require('sequelize');
const Keyv = require('keyv');

const economy = new Sequelize({
    dialect: 'sqlite',
    logging: false,
    storage: 'db/economy.sqlite'
});

const keyvEconomy = new Keyv('sqlite://db/economy.sqlite');

module.exports = { economy, keyvEconomy };