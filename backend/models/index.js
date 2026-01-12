// backend/models/index.js
const { sequelize } = require('../config/database');
const { Sequelize, DataTypes } = require('sequelize');

// Initialize models - pass both sequelize AND DataTypes for consistency
const User = require('./User')(sequelize, DataTypes);
const Customer = require('./Customer')(sequelize, DataTypes);
const Project = require('./Project')(sequelize, DataTypes);
const DailyReport = require('./DailyReport')(sequelize, DataTypes);
const Receipt = require('./Receipt')(sequelize, DataTypes);
const ProjectTeamMember = require('./ProjectTeamMember')(sequelize, DataTypes);
const ProjectSchedule = require('./ProjectSchedule')(sequelize, DataTypes);
const Vehicle = require('./Vehicle')(sequelize, DataTypes);
const VehicleAssignment = require('./VehicleAssignment')(sequelize, DataTypes);
const VehicleWalkaroundInspection = require('./VehicleWalkaroundInspection')(sequelize, DataTypes);
const VehicleRegularInspection = require('./VehicleRegularInspection')(sequelize, DataTypes);
const VehicleInspectionDamageItem = require('./VehicleInspectionDamageItem')(sequelize, DataTypes);
const UserEmergencyContact = require('./UserEmergencyContact')(sequelize, DataTypes);
const UserCertification = require('./UserCertification')(sequelize, DataTypes);
const UserEquipment = require('./UserEquipment')(sequelize, DataTypes);

// Create db object
const db = {
  sequelize,
  Sequelize,
  User,
  Customer,
  Project,
  DailyReport,
  Receipt,
  ProjectTeamMember,
  ProjectSchedule,
  Vehicle,
  VehicleAssignment,
  VehicleWalkaroundInspection,
  VehicleRegularInspection,
  VehicleInspectionDamageItem,
  UserEmergencyContact,
  UserCertification,
  UserEquipment
};

// ==========================================
// DEFINE ASSOCIATIONS
// ==========================================

// User <-> Customer
User.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(User, { foreignKey: 'customer_id', as: 'Users' });

// Project <-> Customer
Project.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Project, { foreignKey: 'customer_id', as: 'Projects' });

// DailyReport <-> Project
DailyReport.belongsTo(Project, { foreignKey: 'project_id', as: 'Project' });
Project.hasMany(DailyReport, { foreignKey: 'project_id', as: 'DailyReports' });

// DailyReport <-> User
DailyReport.belongsTo(User, { foreignKey: 'submitted_by', as: 'submittedBy' });
User.hasMany(DailyReport, { foreignKey: 'submitted_by', as: 'DailyReports' });

// Receipt <-> Project
Receipt.belongsTo(Project, { foreignKey: 'project_id', as: 'Project' });
Project.hasMany(Receipt, { foreignKey: 'project_id', as: 'Receipts' });

// Receipt <-> User
Receipt.belongsTo(User, { foreignKey: 'submitted_by', as: 'submittedBy' });
User.hasMany(Receipt, { foreignKey: 'submitted_by', as: 'Receipts' });

// ProjectTeamMember associations
ProjectTeamMember.belongsTo(Project, { foreignKey: 'project_id', as: 'Project' });
ProjectTeamMember.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
Project.hasMany(ProjectTeamMember, { foreignKey: 'project_id', as: 'TeamMembers' });
User.hasMany(ProjectTeamMember, { foreignKey: 'user_id', as: 'ProjectAssignments' });

// ProjectSchedule associations
ProjectSchedule.belongsTo(Project, { foreignKey: 'project_id', as: 'Project' });
ProjectSchedule.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
Project.hasMany(ProjectSchedule, { foreignKey: 'project_id', as: 'Schedule' });
User.hasMany(ProjectSchedule, { foreignKey: 'user_id', as: 'Schedule' });

// ==========================================
// VEHICLE ASSOCIATIONS
// ==========================================

// Vehicle <-> User (assigned user)
Vehicle.belongsTo(User, { foreignKey: 'assigned_user_id', as: 'assignedUser' });
User.hasMany(Vehicle, { foreignKey: 'assigned_user_id', as: 'vehicles' });

// VehicleAssignment <-> Vehicle
VehicleAssignment.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
Vehicle.hasMany(VehicleAssignment, { foreignKey: 'vehicle_id', as: 'assignments' });

// VehicleAssignment <-> User (assigned to)
VehicleAssignment.belongsTo(User, { foreignKey: 'user_id', as: 'assignedUser' });
User.hasMany(VehicleAssignment, { foreignKey: 'user_id', as: 'vehicleAssignments' });

// VehicleAssignment <-> User (assigned by)
VehicleAssignment.belongsTo(User, { foreignKey: 'assigned_by', as: 'assignedByUser' });
User.hasMany(VehicleAssignment, { foreignKey: 'assigned_by', as: 'assignmentsCreated' });

// VehicleWalkaroundInspection <-> VehicleAssignment
VehicleWalkaroundInspection.belongsTo(VehicleAssignment, { foreignKey: 'assignment_id', as: 'assignment' });
VehicleAssignment.hasMany(VehicleWalkaroundInspection, { foreignKey: 'assignment_id', as: 'inspections' });

// VehicleWalkaroundInspection <-> User (inspector)
VehicleWalkaroundInspection.belongsTo(User, { foreignKey: 'inspector_id', as: 'inspector' });
User.hasMany(VehicleWalkaroundInspection, { foreignKey: 'inspector_id', as: 'walkaroundInspections' });

// VehicleRegularInspection <-> Vehicle
VehicleRegularInspection.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
Vehicle.hasMany(VehicleRegularInspection, { foreignKey: 'vehicle_id', as: 'regularInspections' });

// VehicleRegularInspection <-> User (inspector)
VehicleRegularInspection.belongsTo(User, { foreignKey: 'inspector_id', as: 'inspector' });
User.hasMany(VehicleRegularInspection, { foreignKey: 'inspector_id', as: 'regularInspections' });

// VehicleInspectionDamageItem <-> VehicleWalkaroundInspection
VehicleInspectionDamageItem.belongsTo(VehicleWalkaroundInspection, { foreignKey: 'inspection_id', as: 'inspection' });
VehicleWalkaroundInspection.hasMany(VehicleInspectionDamageItem, { foreignKey: 'inspection_id', as: 'damageItems' });

module.exports = db;
