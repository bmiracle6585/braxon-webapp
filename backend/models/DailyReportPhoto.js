module.exports = (sequelize, DataTypes) => {
  const DailyReportPhoto = sequelize.define('DailyReportPhoto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    daily_report_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    project_site_module_id: {
      type: DataTypes.INTEGER
    },
    photo_checklist_item_id: {
      type: DataTypes.INTEGER
    },
    work_entry_id: {
      type: DataTypes.INTEGER
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    file_name: {
      type: DataTypes.STRING(255)
    },
    file_size: {
      type: DataTypes.INTEGER
    },
    mime_type: {
      type: DataTypes.STRING(100)
    },
    caption: {
      type: DataTypes.TEXT
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8)
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8)
    },
    taken_at: {
      type: DataTypes.DATE
    },
    site: {
      type: DataTypes.STRING(10)
    },
    module_name: {
      type: DataTypes.STRING(200)
    },
    checklist_item_name: {
      type: DataTypes.STRING(200)
    },
    uploaded_by_user_id: {
      type: DataTypes.INTEGER
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'daily_report_photos',
    timestamps: false,
    underscored: true
  });

  DailyReportPhoto.associate = (models) => {
    DailyReportPhoto.belongsTo(models.DailyReport, {
      foreignKey: 'daily_report_id',
      as: 'dailyReport'
    });
    DailyReportPhoto.belongsTo(models.ProjectSiteModule, {
      foreignKey: 'project_site_module_id',
      as: 'projectSiteModule'
    });
    DailyReportPhoto.belongsTo(models.PhotoChecklistItem, {
      foreignKey: 'photo_checklist_item_id',
      as: 'checklistItem'
    });
    DailyReportPhoto.belongsTo(models.DailyReportWorkEntry, {
      foreignKey: 'work_entry_id',
      as: 'workEntry'
    });
    DailyReportPhoto.belongsTo(models.User, {
      foreignKey: 'uploaded_by_user_id',
      as: 'uploadedBy'
    });
  };

  return DailyReportPhoto;
};