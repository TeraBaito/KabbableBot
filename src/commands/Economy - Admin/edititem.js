const { Message, MessageEmbed } = require('discord.js');
const { readJSONSync, writeJSONSync } = require('fs-extra');
const { Op: { like } } = require('sequelize');
const Bot = require('../../../index');
const { CurrencyShop } = require('../../handlers/dbObjects');
const { GoldenRod } = require('../../../colors.json');

module.exports = {
    name: 'edititem',
    aliases: ['itemedit', 'item-edit', 'edit-item', 'updateitem', 'update-item', 'edit'],
    usage: 'edititem [item] $ [{name, cost, description, stock}] $ [new value]',
    description: 'Edits an item\'s specific data value.',
    staffOnly: true,

    /**
    * @param {Bot} bot
    * @param {Message} message
    * @param {string[]} args
    */
    run: async(bot, message, args) => {
        args = args.join(' ').split('$').map(e => e.trim());
        const path = './src/handlers/models/items.json';

        if (args.length < 3) return message.channel.send('Missing args, check the usage with the help command.');
        args[1] = args[1].toLowerCase(); 
        if (!['name', 'cost', 'description', 'stock'].includes(args[1])) return message.channel.send('Invalid value type, check the help command.');
        const newVal = ['cost', 'stock'].includes(args[1]) ? parseInt(args[2]) : args[2];

        const affected = await CurrencyShop.update({ [args[1]]: newVal }, { where: { name: { [like]: args[0] } } });
        if (!affected) return message.channel.send(`Couldn't find the item \`${args[0]}\``);
        const itemsJSON = readJSONSync(path);
        itemsJSON.find(i => i.name.toLowerCase() === args[0])[args[1]] = newVal;
        writeJSONSync(path, itemsJSON, { spaces: 4 });

        message.channel.send(new MessageEmbed({
            color: GoldenRod,
            description: 'New data applied!',
            fields: [
                { name: 'Name', value: item.name },
                { name: 'Cost', value: item.cost },
                { name: 'Description', value: item.description },
                { name: 'Stock', value: item.stock ?? 'Infinity' }
            ]
        }));
    }
};