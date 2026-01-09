module.exports = (sequelize, DataTypes) => {
  const DailyReport = sequelize.define('DailyReport', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    report_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    site: {
      type: DataTypes.STRING(10)
    },
    submitted_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    submitted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    crew_time: {
      type: DataTypes.JSONB
    },
    total_hours: {
      type: DataTypes.DECIMAL(5, 2)
    },
    weather_conditions: {
      type: DataTypes.STRING(100)
    },
    customer_contact: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    customer_notes: {
      type: DataTypes.TEXT
    },
    general_notes: {
      type: DataTypes.TEXT
    },
    issues: {
      type: DataTypes.JSONB
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'submitted'
    },
    reviewed_by_user_id: {
      type: DataTypes.INTEGER
    },
    reviewed_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'daily_reports',
    timestamps: true,
    underscored: true
  });

  DailyReport.associate = (models) => {
    DailyReport.belongsTo(models.Project, {
      foreignKey: 'project_id',
      as: 'project'
    });
    DailyReport.belongsTo(models.User, {
      foreignKey: 'submitted_by_user_id',
      as: 'submittedBy'
    });
    DailyReport.belongsTo(models.User, {
      foreignKey: 'reviewed_by_user_id',
      as: 'reviewedBy'
    });
    DailyReport.hasMany(models.DailyReportWorkEntry, {
      foreignKey: 'daily_report_id',
      as: 'workEntries'
    });
    DailyReport.hasMany(models.DailyReportPhoto, {
      foreignKey: 'daily_report_id',
      as: 'photos'
    });
  };

  return DailyReport;
};