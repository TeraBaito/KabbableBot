const { Sequelize, DataTypes } = require('sequelize');

/** @param {Sequelize} sequelize */
module.exports = (sequelize) => sequelize.define('currency_shop', {
    name: {
        type: DataTypes.STRING,
        unique: true,
    },
    description: {
        type: DataTypes.STRING,
        defaultValue: 'A cool new item'
    },
    cost: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    stock: {
        type: DataTypes.INTEGER
    }
}, {
    timestamps: false,
});