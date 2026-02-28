const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:4000/api';

const config = {
    studentToken: null,
    ownerToken: null,
    propertyId: null,
    roomId: null,
    messId: null,
    bookingId: null,
    messSubscriptionId: null,
    studentId: null,
    ownerId: null,
};

// Colors for console output
const colors = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", blue: "\x1b[34m" };
const logHeader = (msg) => console.log(`\n${colors.blue}========== ${msg} ==========${colors.reset}`);
const logSuccess = (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`);
const logError = (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`);

// Utility: Create a dummy image for testing multi-part file uploads
function createDummyImage() {
    const dummyPath = path.join(__dirname, 'dummy-image.jpg');
    if (!fs.existsSync(dummyPath)) {
        // Just write some dummy text data as a file
        fs.writeFileSync(dummyPath, 'fake image content');
    }
    return dummyPath;
}

async function runTests() {
    try {
        logHeader('Starting E2E Tests');

        // 1. Auth Flow
        logHeader('1. Auth Flow - Login');

        // Attempt login
        try {
            const studentLogin = await axios.post(`${API_BASE}/auth/login`, { email: 'test_student@example.com', password: 'password123' });
            config.studentToken = studentLogin.data.token;
            config.studentId = studentLogin.data.user.id;
            logSuccess('Logged in as test_student');

            const ownerLogin = await axios.post(`${API_BASE}/auth/login`, { email: 'test_owner@example.com', password: 'password123' });
            config.ownerToken = ownerLogin.data.token;
            config.ownerId = ownerLogin.data.user.id;
            logSuccess('Logged in as test_owner');
        } catch (e) {
            logError('Could not login: ' + (e.response?.data?.message || e.message));
            return;
        }

        const ownerApi = axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${config.ownerToken}` } });
        const studentApi = axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${config.studentToken}` } });

        // 2. Property Management (Owner)
        logHeader('2. Property Management (Owner)');
        const dummyImage = createDummyImage();

        try {
            const form = new FormData();
            form.append('title', 'E2E Test Property');
            form.append('description', 'A beautiful automated test property.');
            form.append('rent', '5000');
            form.append('location', 'Test City Area');
            form.append('amenities', 'WiFi, AC, Power Backup');
            form.append('meals', 'Breakfast, Dinner');
            form.append('totalRooms', '5');
            form.append('maxOccupancy', '2');
            form.append('pricePerBed', '2500');

            // Add minimum 3 images required by propertyService
            form.append('images', fs.createReadStream(dummyImage));
            form.append('images', fs.createReadStream(dummyImage));
            form.append('images', fs.createReadStream(dummyImage));

            const res = await ownerApi.post('/owner/add-property', form, {
                headers: { ...form.getHeaders() }
            });
            config.propertyId = res.data.property?._id || res.data._id;
            logSuccess(`Property created successfully: ${config.propertyId}`);
        } catch (e) {
            logError('Add Property failed: ' + (e.response?.data?.message || e.message));
        }

        // Room Management
        if (config.propertyId) {
            try {
                const roomRes = await ownerApi.post(`/owner/property/${config.propertyId}/rooms`, {
                    roomName: 'Standard Room A1',
                    roomNumber: 'A1',
                    roomType: 'double',
                    maxOccupancy: 2,
                    totalRooms: 1,
                    availableRooms: 1,
                    pricePerBed: 2500,
                    pricePerRoom: 5000,
                    genderPreference: 'any'
                });
                config.roomId = roomRes.data.room?._id || roomRes.data._id;
                logSuccess(`Room added successfully check: ${config.roomId ? 'Yes' : 'No'}`);
            } catch (e) {
                console.error('Room error full:', e.response?.data || e.message);
                logError('Add Room failed: ' + (e.response?.data?.message || e.message));
            }
        }

        // 3. Mess Management (Owner)
        logHeader('3. Mess Service Management (Owner)');
        try {
            const res = await ownerApi.post('/mess', {
                name: 'E2E Test Mess',
                description: 'Healthy homemade test food',
                location: 'Test City Area',
                cuisineType: ['North Indian', 'South Indian'],
                mealTypes: ['lunch', 'dinner'],
                pricing: {
                    monthly: { oneMeal: '1500', twoMeals: '2800', allMeals: '4000' },
                    daily: { lunch: '60', dinner: '60' }
                },
                timings: {
                    lunch: { start: '12:00', end: '14:00' },
                    dinner: { start: '19:00', end: '21:00' }
                },
                features: ['Pure Veg'],
                contactPhone: '9999999999'
            });
            config.messId = res.data.mess?._id || res.data._id;
            logSuccess(`Mess Service created successfully: ${config.messId}`);
        } catch (e) {
            console.error('Mess error full:', e.response?.data || e.message);
            logError('Add Mess failed: ' + (e.response?.data?.message || e.message));
        }

        // 3.5 Search & Discovery (Public/Student)
        logHeader('3.5 Search & Discovery (Student/Public)');
        try {
            // Search properties by location
            const propSearch = await axios.get(`${API_BASE}/properties?location=Test%20City`);
            if (propSearch.data.properties && propSearch.data.properties.length > 0) {
                logSuccess(`Property Search: Found ${propSearch.data.properties.length} properties in Test City`);
            } else {
                logError('Property Search: No properties found for Test City');
            }

            // Search mess by features/cuisine
            const messSearch = await axios.get(`${API_BASE}/mess?features=Pure%20Veg&cuisineType=North%20Indian`);
            if (messSearch.data.messServices && messSearch.data.messServices.length > 0) {
                logSuccess(`Mess Search: Found ${messSearch.data.messServices.length} Pure Veg/North Indian messes`);
            } else {
                logError('Mess Search: No mess services found matching criteria');
            }

            // Get specific property details
            if (config.propertyId) {
                const propDetails = await axios.get(`${API_BASE}/properties/${config.propertyId}`);
                if (propDetails.data._id === config.propertyId) {
                    logSuccess('Property Details: Successfully fetched individual property');
                } else {
                    logError('Property Details: Failed to fetch individual property');
                }
            }

            // Get specific mess details
            if (config.messId) {
                const messDetails = await axios.get(`${API_BASE}/mess/${config.messId}`);
                if (messDetails.data._id === config.messId) {
                    logSuccess('Mess Details: Successfully fetched individual mess');
                } else {
                    logError('Mess Details: Failed to fetch individual mess');
                }
            }
        } catch (e) {
            logError('Search & Discovery failed: ' + (e.response?.data?.error || e.response?.data?.message || e.message));
        }

        // 4. Booking (Student)
        logHeader('4. Booking (Student)');
        if (config.propertyId) {
            try {
                // To fetch rooms we can hit the public endpoint first
                const propRes = await axios.get(`${API_BASE}/properties/${config.propertyId}`);
                const rooms = propRes.data.rooms || [];
                const roomToBook = rooms[0];

                if (roomToBook) {
                    const res = await studentApi.post(`/bookings/book/${config.propertyId}`, {
                        roomId: roomToBook._id,
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        bookingType: 'bed'
                    });
                    config.bookingId = res.data.booking?._id || res.data._id;
                    logSuccess(`Booking request submitted: ${config.bookingId}`);
                } else {
                    logError('No rooms found to book');
                }
            } catch (e) {
                logError('Booking request failed: ' + (e.response?.data?.message || e.message));
            }
        }

        // 5. Booking Approval (Owner)
        logHeader('5. Booking Approval (Owner)');
        if (config.bookingId) {
            try {
                const res = await ownerApi.patch(`/bookings/owner/${config.bookingId}`, {
                    status: 'Confirmed'
                });
                logSuccess('Booking approved successfully');
            } catch (e) {
                logError('Booking approval failed: ' + (e.response?.data?.message || e.message));
            }
        }

        // 6. Mess Subscription (Student)
        logHeader('6. Mess Subscription (Student)');
        if (config.messId) {
            try {
                // Clear existing subscriptions to avoid "already have an active subscription" error across multiple script runs
                const existingReq = await studentApi.get('/mess/subscriptions/my');
                if (existingReq.data && Array.isArray(existingReq.data)) {
                    for (const sub of existingReq.data) {
                        if (sub.status === 'Active' || sub.status === 'Pending') {
                            await studentApi.patch(`/mess/subscriptions/${sub._id}/cancel`);
                        }
                    }
                }

                const res = await studentApi.post(`/mess/${config.messId}/subscribe`, {
                    plan: 'monthly-all',
                    selectedMeals: ['lunch', 'dinner'],
                    startDate: new Date().toISOString().split('T')[0],
                    deliveryPreference: 'Dine-in'
                });
                config.messSubscriptionId = res.data.subscription?._id || res.data._id || (res.data.subscription && res.data.subscription._id);
                logSuccess(`Mess subscription request submitted: ${config.messSubscriptionId}`);
            } catch (e) {
                logError('Mess subscription failed: ' + (e.response?.data?.error || e.response?.data?.message || e.message));
            }
        }

        // 7. Mess Subscription Approval (Owner)
        logHeader('7. Mess Subscription Approval (Owner)');
        if (config.messSubscriptionId) {
            try {
                const res = await ownerApi.patch(`/mess/subscriptions/${config.messSubscriptionId}/approve`);
                logSuccess('Mess subscription approved successfully');
            } catch (e) {
                logError('Mess subscription approval failed: ' + (e.response?.data?.error || e.response?.data?.message || e.message));
            }
        }

        // 8. Chat & Communication (Property & Mess)
        logHeader('8. Chat & Communication');
        if (config.propertyId && config.ownerId) {
            try {
                // Student sends message to Owner regarding the property
                await studentApi.post('/chat/send', {
                    receiverId: config.ownerId,
                    propertyId: config.propertyId,
                    content: 'Hello! I have booked your property and am excited to move in.'
                });
                logSuccess('Property Chat: Student sent message to Owner');

                // Owner responds to Student
                await ownerApi.post('/chat/send', {
                    receiverId: config.studentId,
                    propertyId: config.propertyId,
                    content: 'Hello! Looking forward to hosting you.'
                });
                logSuccess('Property Chat: Owner replied to Student');

                // Fetch student unread count
                const unreadRes = await studentApi.get('/chat/unread-count');
                if (unreadRes.data.count >= 1) {
                    logSuccess(`Property Chat: Student has ${unreadRes.data.count} unread messages`);
                } else {
                    logError('Property Chat: Student unread message count did not increment');
                }
            } catch (e) {
                logError('Property Chat testing failed: ' + (e.response?.data?.error || e.response?.data?.message || e.message));
            }
        }

        if (config.messId && config.ownerId) {
            try {
                // Student sends message to Owner regarding the mess
                await studentApi.post('/chat/mess/send', {
                    receiverId: config.ownerId,
                    messId: config.messId,
                    content: 'Can I request Jain food for Saturday?'
                });
                logSuccess('Mess Chat: Student sent mess-related message to Owner');
            } catch (e) {
                logError('Mess Chat testing failed: ' + (e.response?.data?.error || e.response?.data?.message || e.message));
            }
        }

        // 8.5 Update Property (Owner)
        logHeader('8.5 Update Property (Owner)');
        if (config.propertyId) {
            try {
                await ownerApi.put(`/owner/property/${config.propertyId}`, {
                    rent: 5500
                });
                logSuccess('Property Updated successfully');
            } catch (e) {
                logError('Property Update failed: ' + (e.response?.data?.message || e.message));
            }
        }

        // 8.6 Update Mess (Owner)
        logHeader('8.6 Update Mess (Owner)');
        if (config.messId) {
            try {
                await ownerApi.put(`/mess/${config.messId}`, {
                    description: 'Updated test description'
                });
                logSuccess('Mess Service Updated successfully');
            } catch (e) {
                logError('Mess Update failed: ' + (e.response?.data?.message || e.message));
            }
        }

        // 9. Booking Cancellation (Student)
        logHeader('9. Booking Cancellation (Student)');
        if (config.bookingId) {
            try {
                await studentApi.patch(`/bookings/cancel/${config.bookingId}`);
                logSuccess('Booking Cancelled successfully');
            } catch (e) {
                logError('Booking Cancellation failed: ' + (e.response?.data?.error || e.response?.data?.message || e.message));
            }
        }

        // 10. Cleanup & Deletion (Owner)
        logHeader('10. Cleanup & Deletion (Owner)');
        if (config.messId) {
            try {
                await ownerApi.delete(`/mess/${config.messId}`);
                logSuccess('Mess Service Deleted successfully');
            } catch (e) {
                logError('Mess Deletion failed: ' + (e.response?.data?.message || e.message));
            }
        }
        if (config.propertyId) {
            try {
                await ownerApi.delete(`/owner/property/${config.propertyId}`);
                logSuccess('Property Deleted successfully');
            } catch (e) {
                logError('Property Deletion failed: ' + (e.response?.data?.message || e.message));
            }
        }

        logHeader('Tests Finished');

        // Cleanup
        if (fs.existsSync(dummyImage)) fs.unlinkSync(dummyImage);

    } catch (error) {
        logError('Unexpected test failure: ' + (error.response?.data?.message || error.message));
    }
}

runTests();
