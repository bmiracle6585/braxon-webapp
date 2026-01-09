module.exports = (sequelize, DataTypes) => {
  const ProjectChecklistProgress = sequelize.define('ProjectChecklistProgress', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    project_site_module_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    photo_checklist_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    required_photo_count: {
      type: DataTypes.INTEGER
    },
    uploaded_photo_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'project_checklist_progress',
    timestamps: true,
    underscored: true
  });

  ProjectChecklistProgress.associate = (models) => {
    ProjectChecklistProgress.belongsTo(models.ProjectSiteModule, {
      foreignKey: 'project_site_module_id',
      as: 'projectSiteModule'
    });
    ProjectChecklistProgress.belongsTo(models.PhotoChecklistItem, {
      foreignKey: 'photo_checklist_item_id',
      as: 'checklistItem'
    });
  };

  return ProjectChecklistProgress;
};