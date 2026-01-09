// models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    full_name: {
  type: DataTypes.STRING(100),
  allowNull: false
},
first_name: {
  type: DataTypes.STRING(100),
  allowNull: true
},
last_name: {
  type: DataTypes.STRING(100),
  allowNull: true
},
phone: {
  type: DataTypes.STRING(20),
  allowNull: true
},
customer_id: {
  type: DataTypes.INTEGER,
  allowNull: true,
  references: {
    model: 'customers',
    key: 'id'
  }
},
    company: {
    type: DataTypes.STRING(255),
    allowNull: true
},

role: {
      type: DataTypes.ENUM('admin', 'pm', 'qa', 'field', 'customer'),
      allowNull: false,
      defaultValue: 'field'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Instance method to verify password
  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  return User;
};