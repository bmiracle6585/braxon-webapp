const { User } = require('./models');
const bcrypt = require('bcrypt');

async function resetPassword() {
  try {
    console.log('🔍 Looking for user: blake.miracle');
    
    const user = await User.findOne({ 
      where: { username: 'blake.miracle' } 
    });
    
    if (!user) {
      console.log('❌ User not found!');
      console.log('Checking all users...');
      const allUsers = await User.findAll({ attributes: ['id', 'username', 'email'] });
      console.log('Users in database:', allUsers.map(u => u.username));
      process.exit(1);
    }

    console.log('✅ User found:', user.username);
    console.log('📧 Email:', user.email);
    console.log('👤 Role:', user.role);
    console.log('🟢 Active:', user.is_active);

    const newPassword = await bcrypt.hash('admin123', 10);
    await user.update({ password: newPassword });

    console.log('\n✅ Password reset successfully!');
    console.log('🔐 New Password: admin123');
    console.log('\n👉 Try logging in at http://localhost:5000');
    console.log('   Email: ' + user.email);
    console.log('   Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetPassword();