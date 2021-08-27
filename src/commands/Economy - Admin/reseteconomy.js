const { Message, MessageEmbed } = require('discord.js');
const Bot = require('../../../index');
const { promptMessage } = require('../../handlers/functions');
const { economy } = require('../../handlers/databases');

module.exports = {
    name: 'reseteconomy',
    aliases: ['reset', 'reset-economy', 'resetserver', 'reset-server'],
    usage: 'reseteconomy',
    description: 'Resets ALL of the users\' balance. Use with caution.',
    staffOnly: true,

    /**
    * @param {Bot} bot
    * @param {Message} message
    * @param {string[]} args
    */
    run: async(bot, message, args) => {
        const embed = new MessageEmbed()
            .setColor('RED')
            .setTitle('HOLD UP!')
            .setDescription('This will reset ALL the database, including the balance of **ALL** users, and there\'s no automatic revert. Are you sure you want to do this?')
            .setFooter('You have 30 seconds to react');
        message.channel.send(embed).then(async m => {
            const emoji = await promptMessage(m, message.author, 30, '✅', '❌');
            if (emoji == '✅') {
                economy.sync({ force: true }).then(() => {
                    message.channel.send('Reset all the database.');
                    economy.close();
                }).catch(console.error);
            } else {
                return message.channel.send('Cancelled, thank god dude.');
            }
        });
    }
};