const { Message, MessageEmbed } = require('discord.js');
const { writeJSONSync, readJSONSync } = require('fs-extra');
const ms = require('ms');
const Bot = require('../../../index');
const { promptMessage } = require('../../handlers/functions');
const { GoldenRod } = require('../../../colors.json');
const { stripIndents } = require('common-tags');
const beautify = require('beautify');

module.exports = {
    name: 'setup',
    description: 'An interactive tool to set up the settings (normal and economy ones)',
    usage: 'setup',
    staffOnly: true,

    /**
     * @param {Bot} bot 
     * @param {Message} message 
     * @param {string[]} args 
     */
    run: async (bot, message, args) => {
        const timeOver = () => message.channel.send('Time ran out.');
        
        const paths = [
            './config.json',
            './src/handlers/models/economySettings.json'
        ];
        
        const data = [
            readJSONSync(paths[0]),
            readJSONSync(paths[1])
        ];

        if (!args[0]) {
            let config = {
                prefix: 'k',
                ownerID: '558264504736153600',
                guildID: message.guild.id,
                staffRole: '',
                announcements: '',
                changeTime: 43200000,
                teams: []
            };
    
            let economySettings = {
                winThreshold: [50, 300],
                loseThreshold: [50, 150],
                failRate: 25,
                robFailRate: 50,
                $: '$'
            };
    
            // Prefix
            let input = await prompt(`What prefix should the bot use? (type \`skip\` to go with the default \`${config.prefix}\`)`);
            if (!input) return timeOver();
            if (input.content != 'skip') config.prefix = input.content;
    
            // Staff role
            input = await prompt('Please give me the ID, a @mention or the name of the staff role.');
            if (!input) return timeOver();
            let result = await getRoleID(input);
            if (!result) return message.channel.send('Please rerun this command with a valid role.');
            config.staffRole = result;
    
            // Announcements channel
            input = await prompt('Please give me the ID, a @mention or the name of the announcements channel');
            if (!input) return timeOver();
            result = await getChannelID(input);
            if (!result) return message.channel.send('Please rerun this command with a valid channel.');
            config.announcements = result;
    
            // Change time
            input = await prompt('Please give me a stringified time period (e.g. `2h30m`, `6 hours`) in which the stock will automatically change (type `skip` to go with the default)');
            if (!input) return timeOver();
            if (input.content != 'skip') {
                result = ms(input.content);
                if (isNaN(result)) return message.channel.send('Please rerun this command with a valid time period');
                config.changeTime = result;
            }
            
            // Teams
            input = await prompt('Please give me the IDs or @mentions of the teams roles, separated by spaces');
            if (!input) return timeOver();
            if (input?.mentions?.roles) result = input.mentions.roles.first(2).map(r => r.id);
            else if (input.content.split(/ +/g).every(e => e.length === 18)) 
                result = input.content.split(/ +/g);
            else return message.channel.send('Please rerun this command with 2 team roles, separated by spaces');
            config.teams = result;

            // Win thresholds
            input = await prompt(`What should be the minimum and maximum values a person can win with \`${config.prefix}earn\`? (type them in an \`x y\` format, like \`50 300\`; type \`skip\` to go with the default values)`);
            if (!input) return timeOver();
            if (input.content != 'skip') {
                result = input.content.split(/ +/g).slice(0, 1).map(e => parseInt(e));
                if (result.includes(NaN) || result[0] > result[1]) return message.channel.send('Please rerun this command with the min and max separated by spaces.');
                economySettings.winThreshold = result;
            }
    
            // Lose thresholds
            input = await prompt(`What should be the minimum and maximum values a person can lose with with \`${config.prefix}earn\`? (type them in the format from the past question; type \`skip\` to go with the default values)`);
            if (!input) return timeOver();
            if (input.content != 'skip') {
                result = input.content.split(/ +/g).slice(0, 1).map(e => parseInt(e));
                if (result.includes(NaN) || result[0] > result[1]) return message.channel.send('Please rerun this command with the min and max separated by spaces.');
                economySettings.loseThreshold = result;
            }
            
            // Fail rate
            input = await prompt(`What should be the percentage (rate) in which a person will lose money with \`${config.prefix}earn\`? (type it without the \`%\`, like \`25\`; type \`skip\` to go with the default value)`);
            if (!input) return timeOver();
            if (input.content != 'skip') {
                result = parseInt(input.content);
                if (isNaN(result) || result >= 100 || result <= 0) return message.channel.send('Please rerun this command with a valid fail rate as a number representing the percentage.');
                economySettings.failRate = result;
            }

            // Fail rate
            input = await prompt(`What should be the percentage (rate) in which a person will be fined when using \`${config.prefix}rob\`? (type it without the \`%\`, like \`25\`; type \`skip\` to go with the default value)`);
            if (!input) return timeOver();
            if (input.content != 'skip') {
                result = parseInt(input.content);
                if (isNaN(result) || result >= 100 || result <= 0) return message.channel.send('Please rerun this command with a valid rob fail rate as a number representing the percentage.');
                economySettings.robFailRate = result;
            }
    
            // $
            input = await prompt('What should the currency symbol be? (type `skip` to go with the default)');
            if (!input) return timeOver();
            if (input.content != 'skip') economySettings.$ = input.content;
    
            message.channel.send(new MessageEmbed({
                color: GoldenRod,
                description: stripIndents`Is this right?
                \`\`\`json
                ${beautify(JSON.stringify(config), { format: 'json'})}
                \`\`\`
                \`\`\`json
                ${beautify(JSON.stringify(economySettings), { format: 'json' })}
                \`\`\``,
                footer: 'You have 30 seconds to react'
            })).then(async m => {
                const emoji = await promptMessage(m, message.member, 30, '👍', '👎');
                if (emoji == '👍') {
                    writeJSONSync(paths[0], config, { spaces: 4 });
                    writeJSONSync(paths[1], economySettings, { spaces: 4 });
                    message.channel.send(`\`\`\`Wrote config to ${paths[0]}, might need a restart if changeTime was changed\`\`\`\`\`\`Wrote economySettings to ${paths[1]}\`\`\``);
                } else {
                    message.channel.send('Cancelled.');
                }
            });
        // lol eslint wont shut up
        } else if (Object.prototype.hasOwnProperty.call(data[0], args[0])) {
            if (args[0] == 'ownerID') return message.channel.send('You can\'t edit the owner ID.');
            if (!args[1]) return message.channel.send('Specify the value (as-is on the JSON) of the property you want to change');
            data[0][args[0]] = isNaN(parseInt(args[1])) ? args[1] : parseInt(args[1]);
            message.channel.send(new MessageEmbed({
                color: GoldenRod,
                description: stripIndents`${
                    message.author.id === data[0]['ownerID'] ?
                        'Is this right?' :
                        'Don\'t edit these values carelessly. Making something wrong may make the JSON prone or have consequences to the bot\'s workings. You should ask Tera about what you want to change (or rerun `setup` with no args for more interactive stuff). Otherwise, is this right?'
                } 
                \`\`\`json
                ${beautify(JSON.stringify(data[0]), { format: 'json'})}
                \`\`\``,
                footer: 'You have 30 seconds to react'
            })).then(async m => {
                const emoji = await promptMessage(m, message.member, 30, '👍', '👎');
                if (emoji == '👍') {
                    writeJSONSync(paths[0], data[0], { spaces: 4 });
                    message.channel.send(`\`\`\`Wrote config to ${paths[0]}, might need a restart if changeTime was changed\`\`\``);
                } else {
                    message.channel.send('Cancelled.');
                }
            });
        } else if (Object.prototype.hasOwnProperty.call(data[1], args[0])) {
            if (!args[1]) return message.channel.send('Specify the value (as-is on the JSON) of the property you want to change');
            data[1][args[0]] = isNaN(parseInt(args[1])) ? args[1] : parseInt(args[1]);
            message.channel.send(new MessageEmbed({
                color: GoldenRod,
                description: stripIndents`${
                    message.author.id === data[0]['ownerID'] ?
                        'Is this right?' :
                        'Don\'t edit these values carelessly. Making something wrong may make the JSON prone or have consequences to the bot\'s workings. You should ask Tera about what you want to change (or rerun `setup` with no args for more interactive stuff). Otherwise, is this right?'
                } 
                \`\`\`json
                ${beautify(JSON.stringify(data[1]), { format: 'json'})}
                \`\`\``,
                footer: 'You have 30 seconds to react'
            })).then(async m => {
                const emoji = await promptMessage(m, message.member, 30, '👍', '👎');
                if (emoji == '👍') {
                    writeJSONSync(paths[1], data[1], { spaces: 4 });
                    message.channel.send(`\`\`\`Wrote config to ${paths[1]}\`\`\``);
                } else {
                    message.channel.send('Cancelled.');
                }
            });
        } else if (args[0] == 'list') {
            message.channel.send(`\`\`\`yaml
Configuration
    Prefix: ${data[0].prefix}
    Owner ID: ${data[0].ownerID}
    Staff Role ID: ${data[0].staffRole}
    Announcements Channel ID: ${data[0].announcements}
    Change Time: every ${ms(data[0].changeTime)}
    Teams' IDs: ${data[0].teams.join(' and ')}
Economy Settings
    ${data[0].prefix}earn Win Thresholds: ${data[1].winThreshold.map(n => data[1].$+n).join(' to ')}
    ${data[0].prefix}earn Lose Thresholds: ${data[1].loseThreshold.join(' to ')}
    ${data[0].prefix}earn Fail Rate: ${data[1].failRate}%
    Currency sign: ${data[1].$}
\`\`\``);
        }


        async function prompt(msg) {
            await message.channel.send(msg);
            const collected = await message.channel.awaitMessages(
                ({ author: { id } }) => id === message.author.id,
                { max: 1, time: 60000 }
            );
            return collected.first();
        }

        async function getRoleID(message) {
            const { roles: { cache: roles } } = message.guild;
            let target;
            if (message.mentions?.roles) target = message.mentions.roles.first();
            else if (message.content.length === 18) target = roles.get(message.content);
            if (!target) target = roles.find(m => m.name === message.content);
            return target?.id ?? null;
        }

        async function getChannelID(message) {
            const { channels: { cache: channels } } = message.guild;
            let target;
            if (message.mentions?.channels) target = message.mentions.channels.first();
            else if (message.content.length === 18) target = channels.get(message.content);
            if (!target) target = channels.find(ch => ch === message.content);
            return target?.id ?? null;
        }
    }
};