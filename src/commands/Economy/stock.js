const { Message } = require('discord.js');
const { stripIndents } = require('common-tags');
const Bot = require('../../../index');
const { getMember } = require('../../handlers/functions');
const { keyvEconomy } = require('../../handlers/databases');
const { $ } = require('../../handlers/models/economySettings.json');
const { staffRole, announcements } = require('../../../config.json');

module.exports = {
    name: 'stock',
    // aliases: [],
    usage: 'stock {buy, sell, change} (amount)',
    description: 'Buy or sell stock at stock price, or change the stock price if you\'re admin!',

    /**
    * @param {Bot} bot
    * @param {Message} message
    * @param {string[]} args
    */
    run: async(bot, message, args) => {
        const stockPrice = await keyvEconomy.get('stockPrice');

        switch(args[0]) {
            case 'buy': {
                let amount = parseInt(args[1]);
                if (isNaN(amount)) amount = 1;
                if (amount <= 0) return message.channel.send('Why are you trying to buy less than 1 stock?');

                const total = stockPrice * amount;
                if (total > bot.currency.getBalance(message.author.id))
                    return message.channel.send(`You have **${$+bot.currency.getBalance(message.author.id)}**, but you have to pay **${$+total}**!`);

                bot.currency.add(message.author.id, -total);
                await bot.currency.addStock(message.author.id, amount);
                message.channel.send(`Bought **${amount}** stock for ${$+total}!`);
                break;
            }
            case 'sell': {
                let amount = parseInt(args[1]);
                if (isNaN(amount)) amount = 1;
                if (amount <= 0) return message.channel.send('Why are you trying to buy less than 1 stock?');

                const curStock = bot.currency.getStock(message.author.id);
                if (amount > curStock) return message.channel.send(`You're trying to sell **${amount}** stock, but you only have **${curStock}**!`);
                const total = amount * stockPrice;
                bot.currency.addStock(message.author.id, -amount);
                bot.currency.add(message.author.id, total);
                message.channel.send(`Successfully sold ${amount} stock for **${$+total}**!`);
                break;
            }
            case 'user': {
                let user = message.member;
                if (args[1]) user = await getMember(message, args[1]);

                if (!user || !bot.currency.get(user?.id)) return message.channel.send('Couldn\'t find that user!');
                const stock = bot.currency.getStock(user.id);
                message.channel.send(`**${user.user.tag}** has ${stock} stock, which evaluates to ${$+stock * stockPrice} as of now.`);
                break;
            }
            case 'set':
            case 'change': {
                if (!message.member.roles.cache.has(staffRole)) return message.channel.send('You aren\'t allowed to change the stock price.');
                if (!args[1]) return message.channel.send('Please specify the new price.');

                let amount;

                if (/^\+{1}\d+$/.test(args[1])) amount = stockPrice + parseInt(args[1].slice(1));
                else if (/^-{1}\d+$/.test(args[1])) amount = stockPrice - parseInt(args[1].slice(1));
                else amount = parseInt(args[1]);
                if (isNaN(amount)) return message.channel.send('Invalid amount given (make sure it\'s in an `n`, `+n` or `-n` format)');

                keyvEconomy.set('stockPrice', amount);
                message.channel.send(`Successfully changed the stock price to ${$+amount}!`);
                bot.channels.cache.get(announcements).send(`**${$+amount}** (Manual)`);
                break;
            }
            default: message.channel.send(stripIndents`Current stock price: **${$+await keyvEconomy.get('stockPrice')}**
            Next (automatic) change: ${await keyvEconomy.get('nextChange')}`);
        }
    }
};