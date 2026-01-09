'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add 'foreman' to the enum_users_role enum type
    await queryInterface.sequelize.query(
      `ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'foreman';`
    );
    
    console.log('✅ Added "foreman" to enum_users_role');
  },

  down: async (queryInterface, Sequelize) => {
    // PostgreSQL doesn't support removing enum values
    // You would need to recreate the entire enum to remove a value
    console.log('⚠️ Cannot remove enum values in PostgreSQL - manual intervention required');
    
    // If you REALLY need to rollback, you would need to:
    // 1. Create a new enum without 'foreman'
    // 2. Convert the column to the new enum
    // 3. Drop the old enum
    // This is complex and rarely needed, so we skip it here
  }
};