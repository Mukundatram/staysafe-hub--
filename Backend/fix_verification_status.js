require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Document = require('./src/models/Document');

async function fixVerificationStatus() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all users with verified identity documents but missing verificationStatus
        const verifiedDocs = await Document.find({
            documentCategory: 'identity',
            status: 'verified'
        }).populate('user');

        console.log(`Found ${verifiedDocs.length} verified identity documents`);

        for (const doc of verifiedDocs) {
            const user = await User.findById(doc.user._id || doc.user);
            if (!user) {
                console.log(`User not found for document ${doc._id}`);
                continue;
            }

            // Check if verification status is missing or false
            if (!user.verificationStatus?.identity?.verified) {
                console.log(`\nFixing verification status for user: ${user.name} (${user.email})`);
                console.log(`Document type: ${doc.documentType}`);

                // Initialize verificationStatus if needed
                if (!user.verificationStatus) {
                    user.verificationStatus = {};
                }
                if (!user.verificationStatus.identity) {
                    user.verificationStatus.identity = {};
                }

                // Update verification status
                user.verificationStatus.identity.verified = true;
                user.verificationStatus.identity.verifiedAt = doc.verifiedAt || new Date();
                user.verificationStatus.identity.documentId = doc._id;

                // Update verification state
                const studentDocTypes = ['student_id', 'college_id'];
                if (studentDocTypes.includes(doc.documentType)) {
                    user.verificationState = 'verified_student';
                } else {
                    user.verificationState = 'verified_intern';
                }

                await user.save();
                console.log(`✓ Updated verification status for ${user.email}`);
            } else {
                console.log(`User ${user.email} already has verification status set`);
            }
        }

        console.log('\n✅ Verification status fix complete!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

fixVerificationStatus();
