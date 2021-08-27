const { Message, MessageEmbed } = require('discord.js');
const Bot = require('../../../index');
const { rng } = require('../../handlers/functions');
const { failRate, winThreshold: win, loseThreshold: lose, $ } = require('../../handlers/models/economySettings.json');
const { CornflowerBlue, Red } = require('../../../colors.json');

module.exports = {
    name: 'earn',
    aliases: ['work', 'win-or-lose-epic-cash-money'],
    usage: 'earn',
    description: 'Earn money for the Kababble team',
    cooldown: 300,

    /**
    * @param {Bot} bot
    * @param {Message} message
    * @param {string[]} args
    */
    run: async(bot, message, args) => {
        const isWon = Math.random() * 100 >= failRate ? true : false;

        if (isWon) {
            const val = rng(win[0], win[1]);
            const embed = new MessageEmbed()
                .setColor(CornflowerBlue)
                .setDescription(`You earned ${$+val} :)`);
            message.channel.send(embed);
            bot.currency.add(message.author.id, val);
        } else {
            const val = rng(lose[0], lose[1]);
            const embed = new MessageEmbed()
                .setColor(Red)
                .setDescription(`You lost ${$+val} :(`);
            message.channel.send(embed);
            bot.currency.add(message.author.id, -val);
        }
    }
};