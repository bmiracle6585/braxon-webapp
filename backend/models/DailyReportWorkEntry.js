module.exports = (sequelize, DataTypes) => {
  const DailyReportWorkEntry = sequelize.define('DailyReportWorkEntry', {
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
    site: {
      type: DataTypes.STRING(10)
    },
    module_name: {
      type: DataTypes.STRING(200)
    },
    work_performed: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    accomplishments: {
      type: DataTypes.TEXT
    },
    issues_encountered: {
      type: DataTypes.TEXT
    },
    items_completed: {
      type: DataTypes.STRING(100)
    },
    photo_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'daily_report_work_entries',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  DailyReportWorkEntry.associate = (models) => {
    DailyReportWorkEntry.belongsTo(models.DailyReport, {
      foreignKey: 'daily_report_id',
      as: 'dailyReport'
    });
    DailyReportWorkEntry.belongsTo(models.ProjectSiteModule, {
      foreignKey: 'project_site_module_id',
      as: 'projectSiteModule'
    });
    DailyReportWorkEntry.hasMany(models.DailyReportPhoto, {
      foreignKey: 'work_entry_id',
      as: 'photos'
    });
  };

  return DailyReportWorkEntry;
};