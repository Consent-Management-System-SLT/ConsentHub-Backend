#!/usr/bin/env node

/**
 * MongoDB Atlas Connection Test
 * Tests the connection to your MongoDB Atlas database
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function testDatabaseConnection() {
    console.log('🔍 MongoDB Atlas Connection Test');
    console.log('================================');
    
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://consentuser:12345@consentcluster.ylmrqgl.mongodb.net/consentDB?retryWrites=true&w=majority&appName=ConsentCluster';
    
    console.log('📊 Configuration:');
    console.log('  Database URI:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password
    console.log('  Node Environment:', process.env.NODE_ENV || 'development');
    console.log('  Port:', process.env.PORT || 3000);
    console.log('');

    try {
        console.log('🔗 Connecting to MongoDB Atlas...');
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ MongoDB Atlas Connected Successfully!');
        console.log('   Host:', mongoose.connection.host);
        console.log('   Database:', mongoose.connection.name);
        console.log('   Ready State:', mongoose.connection.readyState); // 1 = connected
        console.log('   Connection ID:', mongoose.connection.id);
        
        // Test database operations
        console.log('');
        console.log('🧪 Testing Database Operations...');
        
        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📦 Available Collections:');
        if (collections.length === 0) {
            console.log('   (No collections found - this is normal for a new database)');
        } else {
            collections.forEach(collection => {
                console.log(`   - ${collection.name}`);
            });
        }
        
        // Test a simple operation
        const testSchema = new mongoose.Schema({ test: String, timestamp: { type: Date, default: Date.now } });
        const TestModel = mongoose.model('ConnectionTest', testSchema);
        
        const testDoc = new TestModel({ test: 'Connection test successful' });
        await testDoc.save();
        console.log('✅ Test document created successfully');
        
        // Clean up test document
        await TestModel.deleteOne({ _id: testDoc._id });
        console.log('🧹 Test document cleaned up');
        
        console.log('');
        console.log('🎉 Database Connection Test: PASSED');
        console.log('📊 Your system is using MongoDB Atlas (NOT in-memory storage)');
        
        // Check for existing data
        console.log('');
        console.log('🔍 Checking for existing data...');
        const stats = await mongoose.connection.db.stats();
        console.log('   Database Size:', Math.round(stats.dataSize / 1024), 'KB');
        console.log('   Documents:', stats.objects);
        console.log('   Collections:', stats.collections);
        
        if (stats.objects > 0) {
            console.log('✅ Database contains existing data');
        } else {
            console.log('ℹ️  Database is empty (ready for seeding)');
        }

    } catch (error) {
        console.error('❌ MongoDB Connection Failed:');
        console.error('   Error:', error.message);
        
        if (error.message.includes('authentication failed')) {
            console.error('   🔑 Check your database credentials');
        } else if (error.message.includes('network')) {
            console.error('   🌐 Check your network connection');
        }
        
        console.log('');
        console.log('🔧 Troubleshooting Tips:');
        console.log('   1. Verify MONGODB_URI in your .env file');
        console.log('   2. Check MongoDB Atlas cluster is running');
        console.log('   3. Verify network access (IP whitelist)');
        console.log('   4. Confirm database user permissions');
    } finally {
        await mongoose.disconnect();
        console.log('');
        console.log('🔌 Database connection closed');
    }
}

// Configuration Analysis
function analyzeConfiguration() {
    console.log('⚙️ Configuration Analysis:');
    console.log('========================');
    
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
        console.log('❌ MONGODB_URI not found in environment');
        return false;
    }
    
    if (mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1')) {
        console.log('⚠️  Using local MongoDB (not Atlas)');
        return false;
    }
    
    if (mongoURI.includes('mongodb+srv://')) {
        console.log('✅ Using MongoDB Atlas (SRV connection)');
        if (mongoURI.includes('consentcluster.ylmrqgl.mongodb.net')) {
            console.log('✅ Cluster: consentcluster.ylmrqgl.mongodb.net');
        }
        if (mongoURI.includes('consentDB')) {
            console.log('✅ Database: consentDB');
        }
        return true;
    }
    
    console.log('⚠️  Unknown MongoDB configuration');
    return false;
}

async function main() {
    const isAtlas = analyzeConfiguration();
    console.log('');
    
    if (isAtlas) {
        await testDatabaseConnection();
    } else {
        console.log('❌ System is NOT configured for MongoDB Atlas');
        console.log('📝 Please check your MONGODB_URI configuration');
    }
}

main().catch(console.error);
