// Modules
const { Client, Collection } = require('discord.js');
require('dotenv').config({ path: './.env'});
const fs = require('fs');
const chalk = require('chalk');
const { stripIndents } = require('common-tags');
const { Users } = require('./src/handlers/dbObjects');

/** Currency collection with extra functions to add money/stock and retrieve those numbers
 * @extends {Collection<string, Users>}
 */
class Currency extends Collection {
    constructor() { super(); }

    /** Adds money to the balance in the collection and saves the data to Users
     * If the user doesn't exist, it creates one with the balance provided
     * @param {string} id 
     * @param {number} balance 
     * @returns {Users}
     */
    async add(id, balance) {
        const user = this.get(id);
        if (user) {
            user.balance += Number(balance);
            return user.save();
        }
    
        const newUser = await Users.create({ user_id: id, balance });
        this.set(id, newUser);
        return newUser;
    }

    /** Same as above but with stock
     * @param {string} id 
     * @param {number} balance 
     * @returns {Users}
     */
    async addStock(id, stock) {
        const user = this.get(id);

        if (user) {
            user.stock += stock;
            return user.save();
        }
    
        const newUser = await Users.create({ user_id: id, stock });
        this.set(id, newUser);
        return newUser;
    }

    /** Retrieve the balance of the user
     * @param {string} id 
     * @returns {number}
     */
    getBalance(id) {
        const user = currency.get(id);
        return user ? user.balance : 0;
    }

    /** Retrieve the stock of the user
     * @param {string} id 
     * @returns {number}
     */
    getStock(id) {
        const user = currency.get(id);
        return user ? user.stock : 0;
    }
}
const currency = new Currency();

const Bot = class extends Client {
    constructor() {
        super({
            partials: ['USER', 'MESSAGE']
        });

        this.commands = new Collection();
        this.aliases = new Collection();
        this.categories = fs.readdirSync('./src/commands');
        this.currency = currency;
        this.teams = new Collection();
        this.cooldowns = {
            rob:        new Collection(),
            normal:     new Collection()
        };
    }
};
module.exports = Bot;

// Client
const bot = new Bot();

// Debugging
//bot.on('raw', console.log);
//bot.on('debug', m => console.log(`${chalk.cyan('[Debug]')} - ${m}`));
bot.on('rateLimit', rl => console.warn(
    stripIndents`${chalk.yellow('[Ratelimit]')}
    Timeout: ${rl.timeout}
    Limit: ${rl.limit}
    Route: ${rl.route}`));
bot.on('warn', w => console.warn(`${chalk.yellow('[Warn]')} - ${w}`));
bot.on('error', e => console.error(`${chalk.redBright('[Error]')} - ${e.stack}`));
process.on('uncaughtException', e => console.error(`${chalk.redBright('[Error]')} - ${e.stack}`));
process.on('unhandledRejection', e => console.error(`${chalk.redBright('[Error]')} - ${e.stack}`));
process.on('warning', e => console.warn(`${chalk.yellow('[Error]')} - ${e.stack}`));


// Handlers' modules
['command', 'event'].forEach(handler => {
    require(`./src/handlers/${handler}`)(bot);
});

// Login and turn on (default is DISCORD_TOKEN)
bot.login();