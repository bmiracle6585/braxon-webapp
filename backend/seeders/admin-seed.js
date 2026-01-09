// backend/seeders/admin-seed.js - Create Blake's Admin Account

const bcrypt = require('bcrypt');
const { User } = require('../models');

async function seedAdmin() {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({
            where: { email: process.env.ADMIN_EMAIL }
        });

        if (existingAdmin) {
            console.log('✅ Admin user already exists - skipping seed');
            return;
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
        
        const adminUser = await User.create({
            username: 'blake.miracle',
            email: process.env.ADMIN_EMAIL,
            password: hashedPassword,
            full_name: process.env.ADMIN_NAME,
            role: 'admin',
            is_active: true
        });

        console.log('✅ Admin user created successfully');
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Name: ${adminUser.full_name}`);
        console.log(`   Role: ${adminUser.role}`);
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        throw error;
    }
}

module.exports = seedAdmin;