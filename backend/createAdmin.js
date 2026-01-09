const { User } = require('./models');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    // Check if user already exists
    const existing = await User.findOne({ where: { email: 'blake@braxon.net' } });
    if (existing) {
      console.log('Admin already exists!');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await User.create({
      username: 'blake.miracle',
      email: 'blake@braxon.net',
      password: hashedPassword,
      full_name: 'Blake Miracle',
      first_name: 'Blake',
      last_name: 'Miracle',
      role: 'admin',
      is_active: true
    });

    console.log('Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Username:', admin.username);
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
