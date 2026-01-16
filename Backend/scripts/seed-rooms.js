require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('../src/models/Property');
const Room = require('../src/models/Room');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const properties = await Property.find({}).limit(10);
  for (const prop of properties) {
    const roomsCount = await Room.countDocuments({ property: prop._id });
    if (roomsCount === 0) {
      const room = new Room({
        property: prop._id,
        roomName: `${prop.title} - Default Room`,
        roomType: 'single',
        maxOccupancy: 1,
        totalRooms: 1,
        availableRooms: 1,
        pricePerRoom: prop.rent || 0,
        pricePerBed: prop.rent || 0,
        genderPreference: 'any'
      });
      await room.save();
      console.log('Created default room for property', prop._id.toString());
    } else {
      console.log('Property already has rooms:', prop._id.toString());
    }
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
