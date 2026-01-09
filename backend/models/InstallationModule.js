module.exports = (sequelize, DataTypes) => {
  const InstallationModule = sequelize.define('InstallationModule', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    icon: {
      type: DataTypes.STRING(50)
    },
    category: {
      type: DataTypes.STRING(50)
    },
    display_order: {
      type: DataTypes.INTEGER
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'installation_modules',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  InstallationModule.associate = (models) => {
    InstallationModule.hasMany(models.PhotoChecklistItem, {
      foreignKey: 'installation_module_id',
      as: 'checklistItems'
    });
  };

  return InstallationModule;
};