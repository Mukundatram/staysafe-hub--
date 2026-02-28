require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/staysafe';

async function seedUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if users exist and delete them for a fresh start
        await User.deleteMany({ email: { $in: ['test_student@example.com', 'test_owner@example.com', 'test_admin@example.com'] } });

        const passwordHash = await bcrypt.hash('password123', 10);

        const users = [
            {
                name: 'Test Student',
                email: 'test_student@example.com',
                passwordHash,
                role: 'student',
                emailVerified: true
            },
            {
                name: 'Test Owner',
                email: 'test_owner@example.com',
                passwordHash,
                role: 'owner',
                emailVerified: true
            },
            {
                name: 'Test Admin',
                email: 'test_admin@example.com',
                passwordHash,
                role: 'admin',
                emailVerified: true
            }
        ];

        await User.insertMany(users);
        console.log('✅ Test users seeded successfully!');
        console.log('--------------------------------------------------');
        console.log('Emails:');
        console.log('1. test_student@example.com  (Password: password123)');
        console.log('2. test_owner@example.com    (Password: password123)');
        console.log('3. test_admin@example.com    (Password: password123)');
        console.log('--------------------------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    }
}

seedUsers();
