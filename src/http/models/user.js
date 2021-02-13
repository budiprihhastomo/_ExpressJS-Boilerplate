'use strict';
const {
  Model
} = require('sequelize');
const uuid = require('uuid').v4
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  User.init({
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    remember_token: DataTypes.STRING,
    level: DataTypes.INTEGER,
    profile: DataTypes.STRING
  }, {
    sequelize,
    paranoid: true,
    modelName: 'User',
    scopes: {
      withoutSensitiveData: {
        attributes: {
          exclude: ['password', 'remember_token']
        }
      }
    }
  });

  User.beforeCreate(user => user.id = uuid())

  return User;
};