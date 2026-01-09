// backend/models/VehicleRegularInspection.js
module.exports = (sequelize, DataTypes) => {
  const VehicleRegularInspection = sequelize.define('VehicleRegularInspection', {
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
    inspection_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    inspection_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'monthly',
      validate: {
        isIn: [['monthly', 'quarterly', 'annual', 'pre_trip', 'post_trip', 'dot_inspection']]
      }
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
    interior_photo: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    lights_functional: {
      type: DataTypes.STRING(20),
      defaultValue: 'pass',
      validate: {
        isIn: [['pass', 'fail', 'needs_attention', 'na']]
      }
    },
    tires_condition: {
      type: DataTypes.STRING(20),
      defaultValue: 'pass',
      validate: {
        isIn: [['pass', 'fail', 'needs_attention', 'na']]
      }
    },
    brakes_condition: {
      type: DataTypes.STRING(20),
      defaultValue: 'pass',
      validate: {
        isIn: [['pass', 'fail', 'needs_attention', 'na']]
      }
    },
    fluid_levels: {
      type: DataTypes.STRING(20),
      defaultValue: 'pass',
      validate: {
        isIn: [['pass', 'fail', 'needs_attention', 'na']]
      }
    },
    windshield_condition: {
      type: DataTypes.STRING(20),
      defaultValue: 'pass',
      validate: {
        isIn: [['pass', 'fail', 'needs_attention', 'na']]
      }
    },
    mirrors_condition: {
      type: DataTypes.STRING(20),
      defaultValue: 'pass',
      validate: {
        isIn: [['pass', 'fail', 'needs_attention', 'na']]
      }
    },
    wipers_functional: {
      type: DataTypes.STRING(20),
      defaultValue: 'pass',
      validate: {
        isIn: [['pass', 'fail', 'needs_attention', 'na']]
      }
    },
    horn_functional: {
      type: DataTypes.STRING(20),
      defaultValue: 'pass',
      validate: {
        isIn: [['pass', 'fail', 'needs_attention', 'na']]
      }
    },
    seatbelts_functional: {
      type: DataTypes.STRING(20),
      defaultValue: 'pass',
      validate: {
        isIn: [['pass', 'fail', 'needs_attention', 'na']]
      }
    },
    fire_extinguisher_present: {
      type: DataTypes.STRING(20),
      defaultValue: 'pass',
      validate: {
        isIn: [['pass', 'fail', 'needs_attention', 'na']]
      }
    },
    first_aid_kit_present: {
      type: DataTypes.STRING(20),
      defaultValue: 'pass',
      validate: {
        isIn: [['pass', 'fail', 'needs_attention', 'na']]
      }
    },
    overall_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pass',
      validate: {
        isIn: [['pass', 'fail', 'needs_attention']]
      }
    },
    damage_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    has_damage: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    issues_found: {
      type: DataTypes.TEXT,
      allowNull: true
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
    requires_maintenance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    maintenance_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    follow_up_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    follow_up_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    next_inspection_due: {
      type: DataTypes.DATEONLY,
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
    tableName: 'vehicle_regular_inspections',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['vehicle_id']
      },
      {
        fields: ['inspection_date']
      },
      {
        fields: ['inspection_type']
      },
      {
        fields: ['inspector_id']
      },
      {
        fields: ['overall_status']
      },
      {
        fields: ['next_inspection_due']
      }
    ]
  });

  VehicleRegularInspection.associate = (models) => {
    VehicleRegularInspection.belongsTo(models.Vehicle, {
      foreignKey: 'vehicle_id',
      as: 'vehicle'
    });

    VehicleRegularInspection.belongsTo(models.User, {
      foreignKey: 'inspector_id',
      as: 'inspector'
    });
  };

  return VehicleRegularInspection;
};