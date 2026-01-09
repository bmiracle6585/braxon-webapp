module.exports = (sequelize, DataTypes) => {
  const PhotoChecklistItem = sequelize.define('PhotoChecklistItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    installation_module_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    item_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    required_photo_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    display_order: {
      type: DataTypes.INTEGER
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'photo_checklist_items',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  PhotoChecklistItem.associate = (models) => {
    PhotoChecklistItem.belongsTo(models.InstallationModule, {
      foreignKey: 'installation_module_id',
      as: 'installationModule'
    });
  };

  return PhotoChecklistItem;
};