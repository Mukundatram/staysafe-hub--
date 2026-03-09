const mongoose = require('mongoose');
const Property = require('./src/models/Property');
require('dotenv').config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to database');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const user = await User.findOne({ email: 'siboki5591@kaoing.com' });

        if (!user) {
            console.log('User with email siboki5591@kaoing.com not found!');
            process.exit(1);
        }

        console.log('Found user ID:', user._id);

        const properties = [
            {
                owner: user._id,
                title: 'Cozy Single Room near Campus',
                description: 'A quiet and comfortable single room perfect for students. Close to all amenities and public transport.',
                propertyType: 'single_property',
                rent: 5000,
                amenities: ['WiFi', 'Air Conditioning', 'Study Table', 'Attached Washroom'],
                location: 'Downtown Area, near University',
                coordinates: { lat: 28.7041, lng: 77.1025 },
                images: [
                    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1502672260266-1c1e52416454?w=800&auto=format&fit=crop'
                ],
                isAvailable: true
            },
            {
                owner: user._id,
                title: 'Spacious Boys PG with Meals',
                description: 'Shared PG accommodation with meals included. Vibrant community and great for students.',
                propertyType: 'pg',
                rent: 4000,
                amenities: ['Meals Included', 'WiFi', 'Laundry', 'TV', 'RO Water'],
                meals: ['Breakfast', 'Dinner'],
                location: 'North Campus',
                coordinates: { lat: 28.686, lng: 77.206 },
                images: [
                    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format&fit=crop'
                ],
                isAvailable: true
            },
            {
                owner: user._id,
                title: 'Modern Safe Girls Hostel',
                description: 'Secure and modern hostel for girls with 24/7 security. All facilities provided for a comfortable stay.',
                propertyType: 'hostel',
                rent: 6000,
                amenities: ['Security', 'Meals Included', 'Power Backup', 'Gym', 'Washing Machine'],
                meals: ['Breakfast', 'Lunch', 'Dinner'],
                location: 'South City Center',
                coordinates: { lat: 28.5355, lng: 77.2410 },
                images: [
                    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop'
                ],
                isAvailable: true
            },
            {
                owner: user._id,
                title: 'Affordable Studio Apartment',
                description: 'A private studio apartment with kitchenette. Ideal for young professionals seeking privacy.',
                propertyType: 'single_property',
                rent: 8000,
                amenities: ['Kitchen', 'WiFi', 'Parking', 'Refrigerator'],
                location: 'Tech Park Avenue',
                coordinates: { lat: 28.4595, lng: 77.0266 },
                images: [
                    'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1560448205-4d9b3e6bb6db?w=800&auto=format&fit=crop'
                ],
                isAvailable: true
            },
            {
                owner: user._id,
                title: 'Premium PG with Private Balcony',
                description: 'Excellent PG accommodation featuring rooms with private balconies and unhindered views. Fully furnished.',
                propertyType: 'pg',
                rent: 5500,
                amenities: ['Balcony', 'WiFi', 'Daily Cleaning', 'RO Water', 'AC'],
                location: 'West End Heights',
                coordinates: { lat: 28.632, lng: 77.086 },
                images: [
                    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&auto=format&fit=crop'
                ],
                isAvailable: true
            }
        ];

        const result = await Property.insertMany(properties);
        console.log(`Inserted ${result.length} properties successfully.`);

        process.exit(0);
    } catch (err) {
        console.error('Error during seeding:', err);
        process.exit(1);
    }
}

seed();
