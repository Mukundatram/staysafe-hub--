const mongoose = require('mongoose');
const User = require('./src/models/User');
const Mess = require('./src/models/Mess');
const MessSubscription = require('./src/models/MessSubscription');
require('dotenv').config();

const debugSubscriptions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const subscriptions = await MessSubscription.find({})
            .populate('user', 'name email')
            .populate('mess', 'name');

        console.log('Total Subscriptions:', subscriptions.length);
        subscriptions.forEach(sub => {
            console.log('--- Subscription ---');
            console.log('ID:', sub._id);
            console.log('User:', sub.user ? `${sub.user.name} (${sub.user._id})` : sub.user);
            console.log('Mess:', sub.mess ? `${sub.mess.name} (${sub.mess._id})` : sub.mess);
            console.log('Status:', sub.status);
            console.log('Created At:', sub.createdAt);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

debugSubscriptions();
