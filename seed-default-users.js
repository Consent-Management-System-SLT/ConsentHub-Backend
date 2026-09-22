/**
 * Seed Default Users Script
 * Run this to create or reset the default admin/csr/customer accounts in MongoDB.
 * Usage: node seed-default-users.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI;

const DEFAULT_USERS = [
    {
        email: 'admin@sltmobitel.lk',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+94771234567',
        company: 'SLT-Mobitel',
        department: 'Administration',
        jobTitle: 'System Administrator',
        role: 'admin',
        status: 'active',
        isActive: true,
        emailVerified: true,
        acceptTerms: true,
        acceptPrivacy: true
    },
    {
        email: 'csr@sltmobitel.lk',
        password: 'csr123',
        firstName: 'CSR',
        lastName: 'User',
        phone: '+94771234568',
        company: 'SLT-Mobitel',
        department: 'Customer Service',
        jobTitle: 'Customer Service Representative',
        role: 'csr',
        status: 'active',
        isActive: true,
        emailVerified: true,
        acceptTerms: true,
        acceptPrivacy: true
    },
    {
        email: 'customer@sltmobitel.lk',
        password: 'customer123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+94771234569',
        company: 'SLT-Mobitel',
        department: '',
        jobTitle: '',
        role: 'customer',
        status: 'active',
        isActive: true,
        emailVerified: true,
        acceptTerms: true,
        acceptPrivacy: true,
        address: '123 Main St, Colombo 03'
    }
];

async function seedUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        for (const userData of DEFAULT_USERS) {
            const existing = await User.findOne({ email: userData.email });
            if (existing) {
                // Update the password to ensure it matches the expected value
                existing.password = userData.password;
                existing.status = userData.status;
                existing.isActive = userData.isActive;
                existing.role = userData.role;
                await existing.save();
                console.log(`🔄 Updated existing user: ${userData.email} (role: ${userData.role})`);
            } else {
                const newUser = new User(userData);
                await newUser.save();
                console.log(`✅ Created new user: ${userData.email} (role: ${userData.role})`);
            }
        }

        console.log('\n🎉 Seeding complete! Default credentials:');
        console.log('   Admin:    admin@sltmobitel.lk   / admin123');
        console.log('   CSR:      csr@sltmobitel.lk     / csr123');
        console.log('   Customer: customer@sltmobitel.lk / customer123');

    } catch (err) {
        console.error('❌ Seeding error:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

seedUsers();
