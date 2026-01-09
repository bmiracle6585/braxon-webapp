require('dotenv').config(); // Load .env first
const db = require('./models');
const { InstallationModule, PhotoChecklistItem } = db;

async function seedModules() {
  try {
    // Test connection first
    await db.sequelize.authenticate();
    console.log('✅ Database connected');
    
    console.log('🌱 Seeding installation modules...');

    const modules = [
      { name: 'Antenna Installation', description: 'Antenna mounting and alignment', icon: '📡', category: 'RF Equipment', display_order: 1 },
      { name: 'Waveguide Installation', description: 'Waveguide routing and grounding', icon: '🔧', category: 'RF Equipment', display_order: 2 },
      { name: 'ODU Installation', description: 'Outdoor unit mounting', icon: '📦', category: 'RF Equipment', display_order: 3 },
      { name: 'Hybrid or Coax/Fiber', description: 'Cable runs and terminations', icon: '🔌', category: 'Cabling', display_order: 4 },
      { name: 'Ice Shield', description: 'Ice shield installation', icon: '❄️', category: 'Protection', display_order: 5 },
      { name: 'Radio Installation', description: 'Indoor radio equipment', icon: '📻', category: 'RF Equipment', display_order: 6 },
      { name: 'Overall Photos (from ground)', description: 'Site overview photos', icon: '📸', category: 'Documentation', display_order: 7 },
      { name: 'Misc. Photos', description: 'Additional documentation', icon: '📷', category: 'Documentation', display_order: 8 }
    ];

    for (const module of modules) {
      await InstallationModule.create(module);
      console.log(`✅ Created: ${module.name}`);
    }

    console.log('🎉 Module seeding complete!');
    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
}

seedModules();