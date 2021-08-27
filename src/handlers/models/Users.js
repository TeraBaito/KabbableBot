const { Sequelize, DataTypes } = require('sequelize');

/** @param {Sequelize} sequelize */
module.exports = (sequelize) => sequelize.define('users', {
    user_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    balance: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    }
}, {
    timestamps: false,
});