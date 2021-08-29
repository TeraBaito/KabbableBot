const { Message, GuildMember, User } = require('discord.js');
const { teams } = require('../../config.json');
const { setTimeout } = require('timers/promises');

/**
* Finds and returns member object by ID, mention, displayName, username or tag (respectively)
* 
* @param {Message} message The Message object to perform actions using message
* @param {string} toFind String that fetches the user (can be mention, id, tag, or displayName)
* @returns {Promise<GuildMember>}
*/
async function getMember(message, toFind) {
    toFind = toFind.toLowerCase();
    let target;
    // By mention
    target = message.mentions?.members?.first();
    // By cache (ID, displayName, username, tag)
    if (!target) target = message.guild.members.cache.get(toFind);
    if (!target) target = message.guild.members.cache.find(member => {
        return member.displayName.toLowerCase().includes(toFind) ||
        member.user.username.toLowerCase().includes(toFind) ||
        member.user.tag.toLowerCase().includes(toFind);
    });
    // By fetching (if valid user ID)
    if (!target && toFind.length == 18) target = await message.guild.members.fetch(toFind).catch(() => {});
    // By searching nickname / username
    // if (!target) target = (await message.guild.members.search({ query: toFind, limit: 1 })).first();
    return target ?? null;
}

/**
 * Randomizes a number between `min` (inclusive) and `max` (inclusive)
 * @param {number} min The minimum value of the randomizer
 * @param {number} max The maximum value of the randomizer
 * @returns {number}
 */
const rng = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

/**
 * @param {GuildMember} member 
 */
async function getTeam(member) {
    member = await member.fetch();
    const { roles: { cache } } = member;
    if (cache.has(teams[0])) return teams[0];
    else if (cache.has[teams[1]]) return teams[1];
    else return null;
}

/**
 * A more complex, (nasty) randomizer where the chances of slight changes would be higher
 * than the chances of grand changes.
 * @returns {number}
 */
function nastyRng(number) {
    let res;
    res = rng(1, 200);
    if (Math.abs(number - res) <= 30 || res <= 0) return nastyRng(number);
    return res;
}

/**
* Sends a message (prompt) with X reactions, the bot will take action depending on the chosen reaction.
* 
* @param {Message} message The Message object to perform actions using message
* @param {User|GuildMember} author The author of the message, so that actions only perform based on theirs
* @param {Number} time Prompt message expiration time in seconds
* @param {Array} validReactions Array with reactions the bot will listen to
*/
async function promptMessage(message, author, time, ...validReactions) {
    time *= 1000;

    for (const reaction of validReactions) {
        message.react(reaction);
        await setTimeout(500);
    }

    const filter = (reaction, user) => validReactions.includes(reaction.emoji.name) && user.id === author.id;

    return message
        .awaitReactions(filter, { max: 1, time: time})
        .then(collected => collected.first() && collected.first().emoji.name);
}

module.exports = { getMember, rng, nastyRng, promptMessage, getTeam };