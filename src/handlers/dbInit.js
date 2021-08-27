const { economy, keyvEconomy } = require('./databases');
const items = require('./models/items.json');
const { changeTime } = require('../../config.json');

const CurrencyShop = require('./models/CurrencyShop')(economy);
require('./models/Users')(economy);
require('./models/UserItems')(economy);

const force = process.argv.includes('--force') || process.argv.includes('-f');
const dateForce = process.argv.includes('--dateforce') || process.argv.includes('-d');

economy.sync({ force }).then(async () => {
    const shopItems = items.map(e => CurrencyShop.upsert(e));
    await Promise.all(shopItems);
    console.log('Shop synced', force ? 'and reset' : '');
    console.log('Database synced', force ? 'and reset' : '');
    economy.close();
}).catch(console.error);

(async function () {
    if (!await keyvEconomy.get('stockPrice') || force) {
        keyvEconomy.set('stockPrice', 100);
        console.log('Stock price reset');
    }
    if (!await keyvEconomy.get('nextChange') || dateForce || force) {
        keyvEconomy.set('nextChange', `<t:${Math.floor((Date.now() + changeTime) / 1000)}:R>`);
        console.log('Next change date set');
    }
    if (!await keyvEconomy.get('changeStock') || dateForce || force) {
        keyvEconomy.set('changeStock', true);
        console.log('Stock change boolean has been set');
    }
})();

