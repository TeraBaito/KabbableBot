const { Message, MessageEmbed } = require('discord.js');
const Bot = require('../../../index');
const { CurrencyShop } = require('../../handlers/dbObjects');
const { $ } = require('../../handlers/models/economySettings.json');
const { SeaGreen } = require('../../../colors.json');

module.exports = {
    name: 'shop',
    aliases: ['display-shop', 'displayshop', 'items', 'items-list', 'itemslist'],
    usage: 'shop',
    description: 'Displays the items of the shop',

    /**
    * @param {Bot} bot
    * @param {Message} message
    * @param {string[]} args
    */
    run: async(bot, message, args) => {
        const items = await CurrencyShop.findAll();
        const embed = new MessageEmbed()
            .setColor(SeaGreen)
            .setTitle('Shop')
            .addFields(items.map(e => { return { name: `${e.name} - ${$+e.cost}`, value: e.description }; }));
        message.channel.send(embed);
    }
};