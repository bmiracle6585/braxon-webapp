// models/ProjectTeamMember.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const ProjectTeamMember = sequelize.define('ProjectTeamMember', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    role: {
  type: DataTypes.STRING(50),
  defaultValue: 'technician',
  validate: {
    isIn: [['lead', 'technician', 'supervisor']]
  }
},
    assigned_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'project_team_members',
    timestamps: true,
    underscored: true
  });

  return ProjectTeamMember;
};