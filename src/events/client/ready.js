const Bot = require('../../../index');
const chalk = require('chalk');
const { nastyRng } = require('../../handlers/functions');
const { Users } = require('../../handlers/dbObjects');
const { keyvEconomy } = require('../../handlers/databases');
const { announcements, changeTime, teams, guildID } = require('../../../config.json');
const { $ } = require('../../handlers/models/economySettings.json');


/**
 * `ready` event.
 * Triggers once the bot loads all the other events and goes online.
 * Useful to show ready messages and do/set things at startup.
 * 
 * @param {Bot} bot 
 */
module.exports = async bot => {
    console.info(`${chalk.green('[Info]')} - ${bot.user.username} online!`);
    
    const storedBalances = await Users.findAll();
    storedBalances.forEach(b => bot.currency.set(b.user_id, b));

    keyvEconomy.set('teamRob', {
        [teams[0]]: false,
        [teams[1]]: false
    });
    keyvEconomy.set('nextChange', `<t:${Math.floor((Date.now() + changeTime) / 1000)}:R>`);
    async function getTeams() {
        await bot.guilds.cache.get(guildID).members.fetch();
        bot.teams.set(teams[0], bot.guilds.cache.get(guildID).roles.cache.get(teams[0]).members.map(m => m.id));
        bot.teams.set(teams[1], bot.guilds.cache.get(guildID).roles.cache.get(teams[1]).members.map(m => m.id));
    }
    getTeams();
    setInterval(getTeams, changeTime / 4);

    setInterval(async () => {
        const change = await keyvEconomy.get('changeStock');
        if (change) {
            const val = nastyRng(await keyvEconomy.get('stockPrice'));
            keyvEconomy.set('stockPrice', val);
            bot.channels.cache.get(announcements).send(`**${$+val}**`);
            keyvEconomy.set('nextChange', `<t:${Math.floor((Date.now() + changeTime) / 1000)}:R>`);
        } else {
            keyvEconomy.set('changeStock', true);
        }
    }, changeTime);
};