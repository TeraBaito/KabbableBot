const { Message } = require('discord.js');
const { readJSONSync, writeJSONSync } = require('fs-extra');
const beautify = require('beautify');
const { Op } = require('sequelize');
const Bot = require('../../../index');
const { CurrencyShop, Users } = require('../../handlers/dbObjects');
const { $ } = require('../../handlers/models/economySettings.json');

module.exports = {
    name: 'buy',
    aliases: ['buy-item', 'buyitem', 'acquire'],
    usage: 'buy [item]',
    description: 'Buy an item from the store',

    /**
    * @param {Bot} bot
    * @param {Message} message
    * @param {string[]} args
    */
    run: async(bot, message, args) => {
        const path = './src/handlers/models/items.json';
        const itemsJSON = readJSONSync(path);

        // Gets the amount and returns if no amount
        if (!args[0]) return message.channel.send('Please specify an item.');
        let amount = parseInt(args[args.length - 1]);
        if (isNaN(amount)) amount = 1;
        if (amount <= 0) return message.channel.send('Why are you trying to buy less than 1 item?');

        let actualItem = () => {
            if (/\d/.test(args[args.length-1])) return args.slice(0, args.length - 1).join(' ');
            else return args.join(' ');
        };

        // The item model, returns if it doesn't exist
        const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: actualItem() } } });
        if (!item) return message.channel.send(`The item \`${args[0]}\` doesn't exist!`);

        // The total money to pay
        const total = item.cost * amount;
        // If the person doesn't have enough money
        if (total > bot.currency.getBalance(message.author.id)) 
            return message.channel.send(`You have **${$+bot.currency.getBalance(message.author.id)}**, but you have to pay **${$+total}**!`);
        // If the stock remaining is less than the amount requested
        if (item.stock < amount && item.stock != null) return message.channel.send('Sorry, but there\'s not enough stock remaining!');

        // Removes money, adds the amount and updates stock if needed
        const user = await Users.findOne({ where: { user_id: message.author.id }}); 
        bot.currency.add(message.author.id, -total);
        await user.addItem(item, amount);
        if (item.stock) {
            item.decrement('stock', { by: amount });
            itemsJSON.find((e => e.name === item.name)).stock -= amount;
            writeJSONSync(path, itemsJSON, { spaces: 4 });
        }
        message.channel.send(`You bought **${amount} ${item.name}** for **${$+total}**`);
    }
};