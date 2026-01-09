// models/Customer.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
  type: DataTypes.STRING(100),
  allowNull: false,
  field: 'customer_name'  // Maps to database column
},
    contact_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contact_email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
customer_pm: {
  type: DataTypes.STRING(100),
  allowNull: true,
  field: 'customer_pm'
},
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'customers',
    underscored: true,
    timestamps: true
  });

  return Customer;
};