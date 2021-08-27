const { Message } = require('discord.js');
const Bot = require('../../../index');
const { getMember } = require('../../handlers/functions');
const { $ } = require('../../handlers/models/economySettings.json');

module.exports = {
    name: 'balance',
    aliases: ['bal', 'money'],
    usage: 'balance [user]',
    description: 'Shows a user\'s balance',

    /**
    * @param {Bot} bot
    * @param {Message} message
    * @param {string[]} args
    */
    run: async(bot, message, args) => {
        const target = args[0] ? await getMember(message, args[0]) : message.member;
        if (!target) return message.channel.send('Please enter a valid user');
        return message.channel.send(`**${target.user.tag}** has ${$+bot.currency.getBalance(target.id)}`);
    }
};