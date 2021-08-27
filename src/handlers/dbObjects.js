const { Op } = require('sequelize');
const { economy } = require('./databases');
const CurrencyShop = require('./models/CurrencyShop')(economy);
const Users = require('./models/Users')(economy);
const UserItems = require('./models/UserItems')(economy);

UserItems.belongsTo(CurrencyShop, { foreignKey: 'item_id', as: 'item' });

Users.prototype.addItem = async function(item, amount = 1) {
    const userItem = await UserItems.findOne({ where: { user_id: this.user_id, item_id: item.id } });
    if (userItem) {
        userItem.amount += amount;
        return userItem.save();
    }

    return UserItems.create({ user_id: this.user_id, item_id: item.id, amount });
};

Users.prototype.getItems = function() {
    return UserItems.findAll({
        where: { user_id: this.user_id, amount: { [Op.gt]: 0 } },
        include: [ 'item' ]
    }).catch(console.error);
};

module.exports = { Users, CurrencyShop, UserItems };