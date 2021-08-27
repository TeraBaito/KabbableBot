const { Message } = require('discord.js');
const ms = require('ms');
const Bot = require('../../../index');
const { keyvEconomy } = require('../../handlers/databases');
const { rng, getMember, getTeam } = require('../../handlers/functions');
const { $, robFailRate } = require('../../handlers/models/economySettings.json');

module.exports = {
    name: 'rob',
    aliases: 'steal',
    usage: 'rob [user]',
    description: 'Try to rob a user\'s balance, with a chance of taking a part of their money!',
    cooldown: 10,

    /**
     * @param {Bot} bot 
     * @param {Message} message 
     * @param {string[]} args 
     */
    run: async(bot, message, args) => {
        if (!args[0]) return message.channel.send('Please specify a user to rob');
        const user = await getMember(message, args[0]);
        if (!user) return message.channel.send('This user doesn\'t exist!');

        const targetCurrency = bot.currency.get(user.id);
        if (!targetCurrency) return message.channel.send('This user doesn\'t exist in the database!');

        const team = await getTeam(message.member);
        if (!team) return message.channel.send('Please join a team to use this command!');
        if (!(await keyvEconomy.get('teamRob'))[team]) return message.channel.send('You need to use an Enable Rob in order to rob!');
        if (bot.cooldowns.items[team].get('rob')) return message.channel.send(`Your team is on cooldown! You can do this again <t:${bot.cooldowns.items[team].get('rob')}:R>`);

        const change = rng(0, 100);
        
        if (change > 0 && change <= robFailRate) {
            const fine = -rng(10, 1000);
            bot.currency.add(message.author.id, fine);
            message.channel.send(`You couldn't rob anything from ${user.user.username}, and instead got fined **${$+-fine}**`);
        } else {
            // 1-20, 20-40, 40-50, 50-60
            const biasNum = [1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4][rng(0, 11 - 1)];

            let val;
            const perc = (min, max) => [
                targetCurrency.balance * min / 100, targetCurrency.balance * max / 100
            ]; 

            switch (biasNum) {
                case 1: // 1% - 20%     |   5/11 chance
                    val = rng(...perc(1, 10));
                    break;
                case 2: // 20% - 40%    |   3/11 chance
                    val = rng(...perc(20, 40));
                    break;
                case 3: // 40% - 50%    |   2/11 chance
                    val = rng(...perc(40, 50));
                    break;
                case 4: // 50% - 60%    |   1/11 chance
                    val = rng(...perc(50, 60));
                    break;
            }

            bot.currency.add(message.member.id, val);
            bot.currency.add(user.id, -val);
            message.channel.send(`You managed to steal **${$+val}** from ${user.user.username}, careful they don't steal you back!`);
        }

        let cur = await keyvEconomy.get('teamRob');
        cur[team] = false;
        keyvEconomy.set('teamRob', cur);
        bot.cooldowns.items[team].set('rob', Math.floor(Date.now() / 1000) + 6 * 60 * 60);
        setTimeout(() => bot.cooldowns.items[team].delete('rob'), 6 * 60 * 60 * 1000);
    }
};