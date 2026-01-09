// backend/models/VehicleInspectionDamageItem.js
module.exports = (sequelize, DataTypes) => {
  const VehicleInspectionDamageItem = sequelize.define('VehicleInspectionDamageItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    inspection_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vehicle_walkaround_inspections',
        key: 'id'
      }
    },
    damage_location: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['front', 'rear', 'left', 'right', 'top', 'interior', 'undercarriage']]
      }
    },
    damage_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['scratch', 'dent', 'crack', 'chip', 'missing_part', 'fluid_leak', 'tire_damage', 'other']]
      }
    },
    severity: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['minor', 'moderate', 'severe']]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    photo_reference: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Links to one of the 5 main inspection photos'
    },
    estimated_repair_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    tableName: 'vehicle_inspection_damage_items',
    timestamps: false,
    indexes: [
      {
        fields: ['inspection_id']
      },
      {
        fields: ['severity']
      }
    ]
  });

  VehicleInspectionDamageItem.associate = (models) => {
    // Walkaround inspection this damage item belongs to
    VehicleInspectionDamageItem.belongsTo(models.VehicleWalkaroundInspection, {
      foreignKey: 'inspection_id',
      as: 'inspection'
    });
  };

  return VehicleInspectionDamageItem;
};