// models/ProjectSchedule.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const ProjectSchedule = sequelize.define('ProjectSchedule', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    schedule_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
  type: DataTypes.STRING(20),
  defaultValue: 'scheduled',
  validate: {
    isIn: [['scheduled', 'confirmed', 'completed', 'cancelled']]
  }
},
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'project_schedule',
    timestamps: true,
    underscored: true
  });

  return ProjectSchedule;
};