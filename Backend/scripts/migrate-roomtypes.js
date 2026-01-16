// Migration helper: convert existing properties to include a default roomType
// Usage: set MONGO_URI in environment or .env, then run:
// > node Backend/scripts/migrate-roomtypes.js

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Load Property model
const Property = require(path.resolve(__dirname, '..', 'src', 'models', 'Property'));

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;
if (!MONGO_URI) {
  console.error('MONGO_URI is not set. Set it in environment or .env and retry.');
  process.exit(1);
}

async function migrate() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const selector = { $or: [ { roomTypes: { $exists: false } }, { roomTypes: { $size: 0 } } ] };
  const properties = await Property.find(selector).lean();
  console.log(`Found ${properties.length} properties needing migration`);

  for (const prop of properties) {
    const totalRooms = prop.totalRooms || 1;
    const availableRooms = (typeof prop.availableRooms !== 'undefined') ? prop.availableRooms : (prop.isAvailable ? totalRooms : totalRooms);
    const price = prop.rent || 0;

    const defaultRoomType = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Default',
      totalRooms,
      availableRooms,
      price,
    };

    await Property.updateOne({ _id: prop._id }, { $set: { roomTypes: [defaultRoomType] } });
    console.log(`Migrated property ${prop._id} -> added default roomType`);
  }

  console.log('Migration complete. Closing connection.');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
