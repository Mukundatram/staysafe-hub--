const mongoose = require('mongoose');
const RoommateRequest = require('./src/models/RoommateRequest');
const User = require('./src/models/User');
require('dotenv').config();

const userId = '6968be05280864cc9d159d5c';

async function checkConnections() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found!');
            return;
        }
        console.log(`Checking connections for user: ${user.name} (${user._id})`);

        // Check requests
        const connections = await RoommateRequest.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        });

        console.log(`Found ${connections.length} total requests involved with this user.`);

        connections.forEach(conn => {
            console.log(`\nConnection ID: ${conn._id}`);
            console.log(`Sender: ${conn.sender}`);
            console.log(`Receiver: ${conn.receiver}`);
            console.log(`Status: ${conn.status}`);

            const otherId = conn.sender.toString() === userId ? conn.receiver.toString() : conn.sender.toString();
            console.log(`Roommate ID: ${otherId}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkConnections();
