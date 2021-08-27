const { Message } = require('discord.js');
const Bot = require('../../../index');
const { getMember } = require('../../handlers/functions');
const { $ } = require('../../handlers/models/economySettings.json');

module.exports = {
    name: 'give',
    helpName: 'Give Money',
    aliases: ['give-money', 'givemoney', 'give-bal', 'transfer', 'transfer-money'],
    usage: 'give [user] [amount]',
    description: 'Gives money to a user',

    /**
    * @param {Bot} bot
    * @param {Message} message
    * @param {string[]} args
    */
    run: async(bot, message, args) => {
        if (!args[0] || !args[1]) return message.channel.send('Please specify the required arguments.');
        const target = await getMember(message, args[0]);
        const amount = parseInt(args[1]);
        const currentBalance = bot.currency.getBalance(message.author.id);

        if (!target || target.id == message.member.id) return message.channel.send('Please put a valid member.');
        if (!amount || amount <= 0) return message.channel.send('Please input a valid amount to give to the user');
        if (amount > currentBalance) return message.channel.send(`Sorry, your balance is only **${currentBalance}**`);

        bot.currency.add(message.author.id, -amount);
        bot.currency.add(target.id, amount);

        message.channel.send(`You gave **${$+amount}** to **${target.user.tag}**`);
    }
};