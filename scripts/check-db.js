require('dotenv').config({ path: '.env.local' });
const { connectToDatabase } = require('../lib/mongodb');

async function checkDatabase() {
  try {
    const { db } = await connectToDatabase();
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Count documents in each collection
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`${collection.name}: ${count} documents`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Database check failed:', error);
    process.exit(1);
  }
}

checkDatabase(); 