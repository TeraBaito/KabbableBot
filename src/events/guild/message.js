const { Message, Collection } = require('discord.js');
const Bot = require('../../../index');
const { readJSONSync } = require('fs-extra');

let toggleCD;

/**
 * `message` event.
 * 
 * Triggers each time any user sends any message in any channel the bot can look into.
 * 
 * This event will include things to do whenever a command is triggered, a blacklisted word is said, etc.
 * 
 * Honestly mostly everything that has to do with user input goes here.
 * 
 * @param {Bot} bot The bot as a Client object
 * @param {Message} message The Message object passed with the `message` event.
 */
module.exports = async (bot, message) => {
    const { prefix, staffRole } = readJSONSync('./config.json');
    const { cooldowns: { normal: cooldowns }} = bot;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();

    /* "\config prefix ?" in which:
    \ = prefix
    config = cmd
    prefix,? = args (args[0],args[1]) */

    // Command reading
    if (message.author.bot) return; // Prevent from command loops or maymays from bot answers    
    if (!message.guild) return; // No DMs n stuff
    if (!message.member) message.member = await message.guild.members.fetch(message);
    if (cmd.length === 0) return; // Come on


    // Command handler
    let command = bot.commands.get(cmd);
    if(!command) command = bot.commands.get(bot.aliases.get(cmd));

    if(command && message.content.startsWith(prefix)) {
        if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Collection());
        const now = Date.now(),
            timestamps = cooldowns.get(command.name),
            cooldownAmount = (command.cooldown || 3) * 1000;

        if (timestamps.has(message.author.id)) {
            const expire = timestamps.get(message.author.id) + cooldownAmount;

            if (now < expire) {
                const left = (expire - now) / 1000;
                if (!toggleCD) {
                    message.channel.send(`Please run this command in \`${left.toFixed(1)}s\`!`);
                    toggleCD = false;
                    setTimeout(() => toggleCD = true, left);
                    return;
                } else return;
            }
        }

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        if (command.staffOnly && !message.member.roles.cache.has(staffRole)) return message.channel.send('You\'re not allowed to run this command, you\'re not staff!');
        command.run(bot, message, args);
    }
};