// backend/models/VehicleAssignment.js
module.exports = (sequelize, DataTypes) => {
  const VehicleAssignment = sequelize.define('VehicleAssignment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vehicles',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assigned_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    returned_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    starting_mileage: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ending_mileage: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isGreaterThanOrEqualToStarting(value) {
          if (value !== null && this.starting_mileage !== null && value < this.starting_mileage) {
            throw new Error('Ending mileage must be greater than or equal to starting mileage');
          }
        }
      }
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'returned']]
      }
    },
    assigned_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    return_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'vehicle_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['vehicle_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['assigned_date']
      },
      {
        unique: true,
        fields: ['vehicle_id'],
        where: {
          status: 'active'
        },
        name: 'idx_vehicle_assignments_active_vehicle'
      }
    ]
  });

  VehicleAssignment.associate = (models) => {
    // Vehicle being assigned
    VehicleAssignment.belongsTo(models.Vehicle, {
      foreignKey: 'vehicle_id',
      as: 'vehicle'
    });

    // User receiving the assignment
    VehicleAssignment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'assignedUser'
    });

    // Admin/PM who created the assignment
    VehicleAssignment.belongsTo(models.User, {
      foreignKey: 'assigned_by',
      as: 'assignedByUser'
    });

    // Walkaround inspections for this assignment
    VehicleAssignment.hasMany(models.VehicleWalkaroundInspection, {
      foreignKey: 'assignment_id',
      as: 'inspections'
    });
  };

  return VehicleAssignment;
};