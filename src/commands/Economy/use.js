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

        const team = await getTeam(message.member);

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
                if (bot.cooldowns.items[team].get('reroll')) return message.channel.send(`Your team is on cooldown! You can do this again <t:${bot.cooldowns.items[team].get('reroll')}:R>`);
                
                user.addItem(item, -1);
                await keyvEconomy.set('changeStock', false);
                const val = nastyRng(await keyvEconomy.get('stockPrice'));
                keyvEconomy.set('stockPrice', val);
                bot.channels.cache.get(announcements).send(`**${$+val}** (Stock Reroll)`);
                message.channel.send('Stock price has been rerolled! Also, the next stock change will not happen, just as a little handicap ;)');

                bot.cooldowns.items[team].set('reroll', Math.floor(Date.now() / 1000) + 6 * 60 * 60);
                setTimeout(() => bot.cooldowns.items[team].delete('reroll'), 6 * 60 * 60 * 1000);
                break;
            }
            /* Stock Token, changes up to 10% of the current stock value
            in the direction selected by the user
            Cooldown: 6h | Team */
            case 'Stock Token': {
                if (bot.cooldowns.items[team].get('token')) return message.channel.send(`Your team is on cooldown! You can do this again <t:${bot.cooldowns.items[team].get('token')}:R>`);

                user.addItem(item, -1);
                message.channel.send('Should it go up or down?')
                    .then(async m => {
                        const input = await promptMessage(m, message.author, 30000, '⬆', '⬇');
                        await keyvEconomy.set('changeStock', false);
                        const current = await keyvEconomy.get('stockPrice');
                        const perc = rng(1, 10);
                        let val;
                        let upOrDown = '';
                        if (input == '⬆') {
                            // up to 10% of current                        
                            val = Math.floor(current + (current * perc / 100));
                            upOrDown = 'up';
                        } else if (input == '⬇') {
                            // up to -10% of current
                            val = Math.floor(current - (current * perc / 100));
                            upOrDown = 'down'; 
                        }
                        keyvEconomy.set('stockPrice', val);
                        bot.channels.cache.get(announcements).send(`**${$+val}** (Stock Token)`);
                        message.channel.send(`Stock price has gone **${perc}%** ${upOrDown}! Also, the next stock change will not happen, just as a little handicap ;)`);
                    });

                bot.cooldowns.items[team].set('token', Math.floor(Date.now() / 1000) + 6 * 60 * 60);
                setTimeout(() => bot.cooldowns.items[team].delete('token'), 6 * 60 * 60 * 1000);
                break;
            }
            /* Enable Rob, lets the user use the rob command
            Cooldown: 6 hours | Team */
            case 'Enable Rob': {
                if (!team) return message.channel.send('You have to join a team to use this item!');
                const db = await keyvEconomy.get('teamRob');
                if (db[team]) return message.channel.send('This team already has rob enabled, use it when you see fit!');
                user.addItem(item, -1);
                db[team] = true;
                keyvEconomy.set('teamRob', db);
                message.channel.send('Enabled a one-use `rob` command usage. Remember robbing has a team-wise 6 hour cooldown!');
                break;
            }
            /* Lighten Role, makes the role color of the current team lighter
            Cooldown: None */
            case 'Lighten Role': {
                user.addItem(item, -1);
                const role = message.guild.roles.cache.get(team);
                let { color } = role;
                
                color = new Color(color).lighten(0.1).rgbNumber();
                role.edit({ color });
                message.channel.send('Lightened color!');
                break;
            }
            /* Darken Role, makes the role color of the current team darker
            Cooldown: None */
            case 'Darken Role': {
                user.addItem(item, -1);
                const role = message.guild.roles.cache.get(team);
                let { color } = role;
                
                color = new Color(color).darken(0.1).rgbNumber();
                role.edit({ color });
                message.channel.send('Darkened color!');
                break;
            }
            /* Make Channel, make a channel in the team's category
            Cooldown: None */
            case 'Make Channel': {
                const team = message.guild.roles.cache.get(await getTeam(message.member)).name;
                // The role name and the team HAVE TO BE CALLED THE SAME NAME for it to work
                const parent = message.guild.channels.cache.find(e => e.type == 'category' && e.name == team);
                if (!parent) return message.channel.send('Your category seems to not match your role name, tell an admin to change it!');
                
                user.addItem(item, -1);
                const msg = await message.channel.send('Do you want it to be a Text Channel or a VC?');
                let input = await promptMessage(msg, message.author, 60, '#️⃣', '🔈');
                const type = input === '#️⃣' ? 'text' : 'voice';
                input = await prompt('How should it be called?');
                if (!input) return message.channel.send('Time ran out.');
                const newChannel = await message.guild.channels.create(input, {
                    type,
                    parent,
                    reason: 'Make Channel item used'
                });
                message.channel.send(`Created the channel \`${newChannel.name}\``);
                break;
            }
            default: message.channel.send(`The item \`${item.name}\` isn't usable!`);
        }

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