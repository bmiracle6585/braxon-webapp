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
    // PostgreSQL doesn't support removing enum values easily
    // Rollback would require recreating the entire enum
    console.log('⚠️ Cannot remove enum values in PostgreSQL - manual intervention required');
  }
};