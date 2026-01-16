/*
  Test script: simulate booking creation and owner confirmation.
  Usage:
    NODE_ENV=test node scripts/testBookingFlows.js
  Environment variables (optional):
    API_BASE - base API URL (default http://localhost:4000/api)
    STUDENT_TOKEN - JWT for a student user
    OWNER_TOKEN - JWT for an owner user
    PROPERTY_ID - a property id to book

  The script will:
    1) Create a booking as STUDENT_TOKEN
    2) Wait briefly, then try to approve as OWNER_TOKEN
    3) Log responses for inspection
*/

const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:4000/api';
const STUDENT_TOKEN = process.env.STUDENT_TOKEN || '';
const OWNER_TOKEN = process.env.OWNER_TOKEN || '';
const PROPERTY_ID = process.env.PROPERTY_ID || '';

if (!PROPERTY_ID) {
  console.error('Please set PROPERTY_ID env var to a valid property id');
  process.exit(1);
}

(async () => {
  try {
    console.log('Creating booking for property', PROPERTY_ID);
    const createRes = await axios.post(
      `${API_BASE}/bookings/book/${PROPERTY_ID}`,
      {
        startDate: new Date().toISOString().slice(0,10),
        endDate: new Date(new Date().setMonth(new Date().getMonth()+6)).toISOString().slice(0,10),
        mealsSelected: false,
        roomId: undefined, // omit if property-level booking
        roomsCount: 1,
        membersCount: 1,
      },
      {
        headers: {
          Authorization: STUDENT_TOKEN ? `Bearer ${STUDENT_TOKEN}` : undefined,
        },
      }
    );

    console.log('Create response status:', createRes.status);
    console.log('Booking created:', createRes.data);

    const bookingId = createRes.data._id || createRes.data.id;
    if (!bookingId) {
      console.error('Could not determine booking id from create response');
      process.exit(1);
    }

    // Wait a bit then attempt to approve as owner
    await new Promise(r => setTimeout(r, 1000));

    console.log('Approving booking as owner:', bookingId);
    const approveRes = await axios.patch(
      `${API_BASE}/bookings/owner/${bookingId}`,
      { status: 'approved' },
      {
        headers: {
          Authorization: OWNER_TOKEN ? `Bearer ${OWNER_TOKEN}` : undefined,
        },
      }
    );

    console.log('Approve response status:', approveRes.status);
    console.log('Approve response data:', approveRes.data);
  } catch (err) {
    if (err.response) {
      console.error('Error response:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
})();
