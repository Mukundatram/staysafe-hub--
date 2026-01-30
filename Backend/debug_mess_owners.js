const mongoose = require('mongoose');
const Mess = require('./src/models/Mess');
const User = require('./src/models/User');
require('dotenv').config();

const debugMessOwners = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const messes = await Mess.find({}).populate('owner');

        console.log('Total Messes:', messes.length);
        messes.forEach(mess => {
            console.log('--- Mess ---');
            console.log('ID:', mess._id);
            console.log('Name:', mess.name);
            console.log('Owner Field:', mess.owner);
            if (!mess.owner) {
                console.log('!!! WARNING: Mess has no owner !!!');
            } else {
                console.log('Owner ID:', mess.owner._id);
                console.log('Owner Name:', mess.owner.name);
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

debugMessOwners();
