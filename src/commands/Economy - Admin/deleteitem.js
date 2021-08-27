const { Message, MessageEmbed } = require('discord.js');
const { readJSONSync, writeJSONSync } = require('fs-extra');
const { Op: { like } } = require('sequelize');
const Bot = require('../../../index');
const { CurrencyShop } = require('../../handlers/dbObjects');
const { promptMessage } = require('../../handlers/functions');

module.exports = {
    name: 'deleteitem',
    aliases: ['remove-item', 'removeitem', 'delete', 'itemdelete', 'item-delete', 'delete-item'],
    usage: 'deleteitem [item]',
    description: 'Deletes an item from the shop (it still keeps it from the inventory of users).',
    staffOnly: true,

    /**
    * @param {Bot} bot
    * @param {Message} message
    * @param {string[]} args
    */
    run: async(bot, message, args) => {
        const path = './src/handlers/models/items.json';

        if (!args[0]) return message.channel.send('Please specify an item to delete.');
        const item = await CurrencyShop.findOne({ where: { name: { [like]: args.join(' ') } } });
        if (!item) return message.channel.send(`The item \`${args.join(' ')}\` doesn't exist!`);
        const embed = new MessageEmbed()
            .setColor('RED')
            .setDescription(`Are you sure you want to delete \`${item.name}\`? This action is irreversible.`)
            .setFooter('You have 30 seconds to react');
        message.channel.send(embed).then(async m => {
            const emoji = await promptMessage(m, message.author, 30, '✅', '❌');
            if (emoji === '✅') {
                await message.channel.send(`Deleted the item \`${item.name}\``);
                let itemsJSON = readJSONSync(path);
                itemsJSON.splice(itemsJSON.findIndex(i => i.name.toLowerCase() === args[0].toLowerCase()), 1);
                writeJSONSync(path,
                    itemsJSON, 
                    { spaces: 4 });
                CurrencyShop.destroy({ where: { name: item.name } });
            } else {
                return message.channel.send('Cancelled.');
            }
        });
    }
};