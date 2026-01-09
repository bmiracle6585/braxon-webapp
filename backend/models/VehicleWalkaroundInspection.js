// backend/models/VehicleWalkaroundInspection.js
module.exports = (sequelize, DataTypes) => {
  const VehicleWalkaroundInspection = sequelize.define('VehicleWalkaroundInspection', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    assignment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vehicle_assignments',
        key: 'id'
      }
    },
    inspection_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['checkout', 'checkin']]
      }
    },
    inspection_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    mileage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    front_photo: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    rear_photo: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    left_photo: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    right_photo: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    top_photo: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    damage_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    has_damage: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    inspector_signature: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Base64 encoded signature image'
    },
    inspector_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    inspector_name: {
      type: DataTypes.STRING(255),
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
    tableName: 'vehicle_walkaround_inspections',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['assignment_id']
      },
      {
        fields: ['inspection_type']
      },
      {
        fields: ['inspection_date']
      },
      {
        fields: ['inspector_id']
      },
      {
        unique: true,
        fields: ['assignment_id'],
        where: {
          inspection_type: 'checkout'
        },
        name: 'idx_walkaround_checkout_per_assignment'
      }
    ]
  });

  VehicleWalkaroundInspection.associate = (models) => {
    // Assignment this inspection belongs to
    VehicleWalkaroundInspection.belongsTo(models.VehicleAssignment, {
      foreignKey: 'assignment_id',
      as: 'assignment'
    });

    // Inspector (user who performed inspection)
    VehicleWalkaroundInspection.belongsTo(models.User, {
      foreignKey: 'inspector_id',
      as: 'inspector'
    });

    // Damage items documented in this inspection
    VehicleWalkaroundInspection.hasMany(models.VehicleInspectionDamageItem, {
      foreignKey: 'inspection_id',
      as: 'damageItems'
    });
  };

  return VehicleWalkaroundInspection;
};