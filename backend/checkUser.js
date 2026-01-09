const { User } = require('./models');

async function checkUser() {
  try {
    const user = await User.findOne({ where: { email: 'blake@braxon.net' } });
    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }
    
    console.log('User found:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Username:', user.username);
    console.log('Role:', user.role);
    console.log('Password hash (first 50 chars):', user.password.substring(0, 50));
    console.log('Password hash length:', user.password.length);
    
    // Test password comparison
    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare('admin123', user.password);
    console.log('Password comparison test:', isMatch ? 'MATCH!' : 'NO MATCH');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUser();
