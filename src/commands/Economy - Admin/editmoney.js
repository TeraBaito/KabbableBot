const { Message } = require('discord.js');
const Bot = require('../../../index');
const { getMember } = require('../../handlers/functions');

module.exports = {
    name: 'editmoney',
    aliases: ['edit-money', 'add-money', 'remove-money', 'add-balance', 'remove-balance'],
    usage: 'edit-money [user] [(-)amount]',
    description: 'Edits a user\'s money, put `a` to add and `-a` to remove.',
    staffOnly: true,

    /**
    * @param {Bot} bot
    * @param {Message} message
    * @param {string[]} args
    */
    run: async(bot, message, args) => {
        if (!args[0] || !args[1]) return message.channel.send('Please specify the required arguments.');
        const target = await getMember(message, args[0]);
        const amount = parseInt(args[1]);
        if (!target) return message.channel.send('Please put a valid member.');
        if (isNaN(amount)) return message.channel.send('Please give me a valid amount.');

        bot.currency.add(target.id, amount);
        message.channel.send(amount > 0 ? 
            `Added \`${amount}\` to **${target.user.tag}**` :
            `Removed \`${-amount}\` from **${target.user.tag}**\``);
    }
};