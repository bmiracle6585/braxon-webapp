const { User } = require('./models');
const bcrypt = require('bcrypt');

async function reset() {
  try {
    const user = await User.findOne({ where: { email: 'blake@braxon.net' } });
    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }
    
    const newPassword = await bcrypt.hash('admin123', 10);
    await user.update({ password: newPassword });
    console.log('Password reset successfully!');
    console.log('Email: blake@braxon.net');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

reset();
