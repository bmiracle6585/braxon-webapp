// backend/models/Project.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    project_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    project_code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      }
    },

    project_manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },

    qa_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },

    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'on_hold'),
      defaultValue: 'pending'
    },

    /* ============================
       SITE DATA
    ============================ */

    site_a_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    site_a_location: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    site_a_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    site_a_latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    site_a_longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },

    site_b_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    site_b_location: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    site_b_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    site_b_latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    site_b_longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },

    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },

    scope_of_work: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    /* ============================
       HOURS BUDGET
    ============================ */

    hours_budget_total: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      defaultValue: 0
    },

    hours_used: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      defaultValue: 0
    },

    /* ============================
       PER DIEM BUDGET (NIGHTS)
    ============================ */

    per_diem_total: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },

    per_diem_used: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    }

  }, {
    tableName: 'projects',
    underscored: true,
    timestamps: true
  });

  /* ============================
     ASSOCIATIONS
  ============================ */
  Project.associate = (models) => {
    Project.hasMany(models.DailyReport, {
      foreignKey: 'project_id',
      as: 'dailyReports'
    });
  };

  return Project;
};
