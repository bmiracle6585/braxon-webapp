module.exports = (sequelize, DataTypes) => {
  const ProjectSiteModule = sequelize.define('ProjectSiteModule', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    site: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    installation_module_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    custom_label: {
      type: DataTypes.STRING(200)
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending'
    },
    total_required_photos: {
      type: DataTypes.INTEGER
    },
    total_uploaded_photos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    completion_percentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    notes: {
      type: DataTypes.TEXT
    },
    started_at: {
      type: DataTypes.DATE
    },
    completed_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'project_site_modules',
    timestamps: true,
    underscored: true
  });

  ProjectSiteModule.associate = (models) => {
    ProjectSiteModule.belongsTo(models.Project, {
      foreignKey: 'project_id',
      as: 'project'
    });
    ProjectSiteModule.belongsTo(models.InstallationModule, {
      foreignKey: 'installation_module_id',
      as: 'installationModule'
    });
    ProjectSiteModule.hasMany(models.ProjectChecklistProgress, {  // UNCOMMENTED
    foreignKey: 'project_site_module_id',
    as: 'checklistProgress'
  });
  };

  return ProjectSiteModule;
};