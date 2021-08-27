const { Message, MessageEmbed } = require('discord.js');
const { readJSONSync, writeJSONSync } = require('fs-extra');
const { Op: { like } } = require('sequelize');
const Bot = require('../../../index');
const { CurrencyShop, UserItems } = require('../../handlers/dbObjects');
const { promptMessage } = require('../../handlers/functions');
const { GoldenRod } = require('../../../colors.json');

module.exports = {
    name: 'additem',
    aliases: ['itemadd', 'item-add', 'add-item', 'add'],
    usage: 'additem [item]',
    description: 'An interactive tool that adds an item with the data given.',
    staffOnly: true,

    /**
    * @param {Bot} bot
    * @param {Message} message
    * @param {string[]} args
    */
    run: async(bot, message, args) => {
        const path = './src/handlers/models/items.json';
        args = args.join(' ');
        if (!args[0]) return message.channel.send('Please specify the item name as the first argument!');
        if (await CurrencyShop.findOne({ where: { name: { [like]: args } } })) 
            return message.channel.send(`The item ${args[0]} already exists! You might want to use \`updateitem\` to update its data.`);

        // The data constructor
        let data = {
            name: args,
            cost: '',
            description: '',
            stock: null
        };

        // Cost
        let input = await prompt('What\'s its cost?');
        if (!input) return message.channel.send('Time ran out.');
        input = parseInt(input);
        if (isNaN(input) || input < 0) return message.channel.send('Please rerun this command with a valid cost (e.g. `235`).');
        data.cost = input;
        // Description
        input = await prompt('What description should it have?');
        if (!input) return message.channel.send('Time ran out.');
        data.description = input;
        // Stock (skip or time runs out defaults to null)
        input = await prompt('How much stock (available amount) should it have? (type `skip` for infinite stock)');
        if (!input) return message.channel.send('Time ran out.');
        if (input != 'skip') {
            input = parseInt(input);
            if (isNaN(input) || input <= 0) return message.channel.send('Please rerun this command with a valid stock amount (e.g. `10`)');
            data.stock = input;
        }

        message.channel.send(new MessageEmbed({
            color: GoldenRod,
            description: 'Is this right?',
            fields: [
                { name: 'Name', value: data.name },
                { name: 'Cost', value: data.cost },
                { name: 'Description', value: data.description },
                { name: 'Stock', value: data.stock ?? 'Infinity' }
            ],
            footer: 'You have 30 seconds to react'
        })).then(async m => {
            const emoji = await promptMessage(m, message.member, 30, '👍', '👎');
            if (emoji == '👍') {
                await CurrencyShop.create(data);
                const curData = readJSONSync(path);
                curData.push(data);
                writeJSONSync(path, curData, { spaces: 4 });
                message.channel.send(`Created the item \`${args}\`!`);
            } else {
                message.channel.send('Cancelled.');
            }
        });

        async function prompt(msg) {
            await message.channel.send(msg);
            const collected = await message.channel.awaitMessages(
                ({ author: { id } }) => id === message.author.id,
                { max: 1, time: 60000 }
            );
            return collected.first()?.content;
        }
    }
};