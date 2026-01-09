const { User } = require('./models');

async function createProperAdmin() {
  try {
    // Delete existing user
    await User.destroy({ where: { email: 'blake@braxon.net' } });
    console.log('Deleted existing user');

    // Create using Sequelize (this will trigger beforeCreate hook)
    const admin = await User.create({
      username: 'blake.miracle',
      email: 'blake@braxon.net',
      password: 'admin123',  // Plain text - hook will hash it
      full_name: 'Blake Miracle',
      first_name: 'Blake',
      last_name: 'Miracle',
      role: 'admin',
      is_active: true
    });

    console.log('✅ Admin created successfully!');
    console.log('Email:', admin.email);
    console.log('Username:', admin.username);
    console.log('Password: admin123');
    console.log('Hash starts with:', admin.password.substring(0, 10));
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createProperAdmin();
