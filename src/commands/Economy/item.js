const { Message, MessageEmbed } = require('discord.js');
const { Op } = require('sequelize');
const Bot = require('../../../index');
const { CurrencyShop } = require('../../handlers/dbObjects');
const { $ } = require('../../handlers/models/economySettings.json');
const { OrangeRed } = require('../../../colors.json');

module.exports = {
    name: 'item',
    aliases: ['item-info', 'iteminfo', 'item-data', 'itemdata'],
    usage: 'item [item]',
    description: 'Displays the information of an item',

    /**
    * @param {Bot} bot
    * @param {Message} message
    * @param {string[]} args
    */
    run: async(bot, message, args) => {
        if (!args[0]) return message.channel.send('Please specify an item.');
        args = args.join(' ');
        const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: args } } });
        if (!item) return message.channel.send(`The item \`${args}\` doesn't exist!`);
        
        const embed = new MessageEmbed()
            .setColor(OrangeRed)
            .setTitle('Item Info')
            .addField('Name', item.name, true)
            .addField('Cost', $+item.cost)
            .addField('Description', item.description)
            .addField('Stock remaining', item.stock ?? 'Infinity');
        message.channel.send(embed);
    }
};