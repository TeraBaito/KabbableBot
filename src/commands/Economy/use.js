const { Message } = require('discord.js');
const Color = require('color');
const Bot = require('../../../index');
const { Op } = require('sequelize');
const { CurrencyShop, Users, UserItems } = require('../../handlers/dbObjects');
const { keyvEconomy } = require('../../handlers/databases');
const { nastyRng, promptMessage, rng, getTeam } = require('../../handlers/functions');
const { $ } = require('../../handlers/models/economySettings.json');
const { announcements } = require('../../../config.json');

module.exports = {
    name: 'use',
    aliases: ['utilize', 'apply', 'equip'],
    usage: 'use [item]',
    description: 'Use an item, it\'ll do different stuff depending on the item!',

    /**
    * @param {Bot} bot
    * @param {Message} message
    * @param {string[]} args
    */
    run: async (bot, message, args) => {
        if (!args[0]) return message.channel.send('Please specify an item!');
        args = args.join(' ');
        const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: args } } });
        if (!item) return message.channel.send(`The item ${args.join(' ')} doesn't exist!`);
    
        const user = await Users.findOne({ where: { user_id: message.author.id }}); 
        if (!user) return message.channel.send('You\'re not in the database!');

        const userItem = await UserItems.findOne({ where: { user_id: user.user_id, item_id: item.id }});
        if (!userItem || userItem?.amount <= 0) return message.channel.send(`You don't have any \`${item.name}\` in your inventory!`);

        switch(item.name) {
            /* Tea, test item #1, just sends a message
            (DON'T) USE IN PROD */
            case 'Tea': {
                user.addItem(item, -1);
                message.channel.send('You drank some tea');
                break;
            }
            /*  Coffee, test item #2 (with stock), also adds 5 times its cost to the user's balance 
            DON'T USE IN PROD (at least not the balance update) */
            case 'Coffee': {
                user.addItem(item, -1);
                message.channel.send('You drink some coffee... much coffee.... A LOT OF COFFEE.... YOU GET IN AN ENERGY TRIP AND PUNCH SOMEONE IN THE FACE WOHOOOOOO MAX POWER PUN INTENDED');
                break;
            }
            /* Stock Reroll, changes the stock value randomly and publishes it
            Cooldown: 6h | Team */
            case 'Stock Reroll': {
                user.addItem(item, -1);
                await keyvEconomy.set('changeStock', false);
                const val = nastyRng(await keyvEconomy.get('stockPrice'));
                keyvEconomy.set('stockPrice', val);
                bot.channels.cache.get(announcements).send(`**${$+val}** (Stock Reroll)`);
                message.channel.send('Stock price has been rerolled! Also, the next stock change will not happen, just as a little handicap ;)');
                break;
            }
            /* Stock Token, changes up to 10% of the current stock value
            in the direction selected by the user
            Cooldown: 6h | Team */
            case 'Stock Token': {
                user.addItem(item, -1);
                message.channel.send('Should it go up or down?')
                    .then(async m => {
                        const input = await promptMessage(m, message.author, 30000, '⬆', '⬇');
                        if (input == '⬆') {
                            // up to 10% of current
                            await keyvEconomy.set('changeStock', false);
                            const current = await keyvEconomy.get('stockPrice');
                            const perc = rng(1, 10);
                            const val = current + (current * perc / 100);
                            keyvEconomy.set('stockPrice', val);
                            bot.channels.cache.get(announcements).send(`**${$+val}** (Stock Token)`);
                            message.channel.send(`Stock price has gone **${perc}%** up! Also, the next stock change will not happen, just as a little handicap ;)`);
                        } else if (input == '⬇') {
                            // up to -10% of current
                            await keyvEconomy.set('changeStock', false);
                            const current = await keyvEconomy.get('stockPrice');
                            const perc = rng(1, 10);
                            const val = current - (current * perc / 100);
                            keyvEconomy.set('stockPrice', val);
                            bot.channels.cache.get(announcements).send(`**${$+val}** (Stock Token)`);
                            message.channel.send(`Stock price has gone **${perc}%** down! Also, the next stock change will not happen, just as a little handicap ;)`);
                        }
                    });
                break;
            }
            /* Enable Rob, lets the user use the rob command
            Cooldown: 6 hours | Team */
            case 'Enable Rob': {
                user.addItem(item, -1);
                const team = await getTeam(message.member);
                if (!team) return message.channel.send('You have to join a team to use this item!');
                const db = await keyvEconomy.get('teamRob');
                if (db[team]) return message.channel.send('This team already has rob enabled, use it when you see fit!');
                db[team] = true;
                keyvEconomy.set('teamRob', db);
                message.channel.send('Enabled a one-use `rob` command usage. Remember robbing has a team-wise 6 hour cooldown!');
                break;
            }
            case 'Lighten Role': {
                user.addItem(item, -1);
                const team = await getTeam(message.member);
                const role = message.guild.roles.cache.get(team);
                let { color } = role;
                
                color = new Color(color).lighten(0.1).rgbNumber();
                role.edit({ color });
                message.channel.send('Lightened color!');
                break;
            }
            case 'Darken Role': {
                user.addItem(item, -1);
                const team = await getTeam(message.member);
                const role = message.guild.roles.cache.get(team);
                let { color } = role;
                
                color = new Color(color).darken(0.1).rgbNumber();
                role.edit({ color });
                message.channel.send('Darkened color!');
                break;
            }
            default: message.channel.send(`The item \`${item.name}\` isn't usable!`);
        }
    }
};