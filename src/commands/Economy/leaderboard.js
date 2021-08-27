const { Message, MessageEmbed } = require('discord.js');
const Bot = require('../../../index');
const { Lavender } = require('../../../colors.json');
const { teams } = require('../../../config.json');

module.exports = {
    name: 'leaderboard',
    aliases: ['lb', 'top'],
    usage: '',
    description: '',

    /**
    * @param {Bot} bot
    * @param {Message} message
    * @param {string[]} args
    */
    run: async(bot, message, args) => {
        // Sort bot.currency by balance
        let lb = bot.currency
            .sort((a, b) => b.balance - a.balance)
            .first(10);
        // Fetches all the users from lb, saves their resolved data to an array
        const userTags = (await Promise.all(lb.map(u => bot.users.fetch(u.user_id)))).map(u => u.tag);
        // Maps to strings with the rank, the username and the balance
        lb = lb.map((u, pos) => `**${pos + 1}.** ${userTags[pos]} • ${u.balance}`);
        
        const balances = [
            bot.teams.get(teams[0]).map(m => bot.currency.getBalance(m)).reduce((a, b) => a + b, 0),
            bot.teams.get(teams[1]).map(m => bot.currency.getBalance(m)).reduce((a, b) => a + b, 0)
        ];
        const max = balances.indexOf(Math.max(balances[0], balances[1]));
        let balanceStrings = [`Red: ${balances[0]}`, `${balances[1]}: Blue`];
        balanceStrings[max] = '**'+balanceStrings[max]+'**';

        // Makes an embed and sends it
        const embed = new MessageEmbed()
            .setColor(Lavender)
            .setTitle('Leaderboard')
            .setDescription()
            .setDescription(`
                ${balanceStrings[0] + '|' + balanceStrings[1]}

${lb.join('\n')}`);

        message.channel.send(embed);
    }
};