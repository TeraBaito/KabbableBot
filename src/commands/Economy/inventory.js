const { Message, MessageEmbed } = require('discord.js');
const Bot = require('../../../index');
const { getMember } = require('../../handlers/functions');
const { Peru } = require('../../../colors.json');
const { Users } = require('../../handlers/dbObjects');

module.exports = {
    name: 'inventory',
    aliases: ['inv', 'items', 'items-list', 'itemslist'],
    usage: 'inventory (user)',
    description: 'Shows your or other user\'s inventory',

    /**
    * @param {Bot} bot
    * @param {Message} message
    * @param {string[]} args
    */
    run: async(bot, message, args) => {
        const target = args[0] ? await getMember(message, args[0]) : message.member;
        if (!target) message.channel.send('Please enter a valid user');
        const user = await Users.findOne({ where: { user_id: target.id }});
        const items = user ? await user.getItems() : [];
        const embed = new MessageEmbed()
            .setColor(Peru)
            .setTitle(`${target.user.username}'s Inventory`);

        if (items.length) embed.setDescription(items.map(i => `${i.amount} - ${i.item.name}`));
        else embed.setDescription('No items yet, soon™.');
        message.channel.send(embed);
    }
};