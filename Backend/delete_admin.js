require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/staysafe';

async function deleteAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await User.deleteOne({ email: 'test_admin@example.com' });
        if (result.deletedCount > 0) {
            console.log('✅ Successfully deleted test_admin@example.com from the database.');
        } else {
            console.log('⚠️ test_admin@example.com was not found in the database. It might have already been deleted.');
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        process.exit(1);
    }
}

deleteAdmin();
