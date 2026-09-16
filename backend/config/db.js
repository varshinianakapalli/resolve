const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const seed = require('../seed');
const User = require('../models/User');

let mongoServer;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/resolvenow';
  
  try {
    // Attempt connection with 3 sec timeout
    console.log(`Attempting MongoDB connection to: ${uri}...`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('✅ Connected to MongoDB successfully.');
  } catch (err) {
    console.warn('⚠️ Could not connect to local MongoDB:', err.message);
    console.log('🚀 Starting MongoMemoryServer as fallback for seamless execution...');
    
    try {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      console.log(`✅ In-Memory MongoDB running at ${mongoUri}`);
      
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to In-Memory MongoDB.');
    } catch (memErr) {
      console.error('❌ Failed to start In-Memory MongoDB:', memErr);
      process.exit(1);
    }
  }

  // Seed demo data if database is empty
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database is empty. Seeding initial demo data...');
      // Re-use connection, seed function handles seed operations
      const seedScript = require('../seed');
      // We pass active mongoose connection to avoid disconnect
      const Complaint = require('../models/Complaint');
      const Message = require('../models/Message');

      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@resolvenow.in',
        password: 'Admin@123',
        phone: '9988776655',
        role: 'admin',
      });

      const agents = await User.insertMany([
        { name: 'Ravi Kumar', email: 'ravi@resolvenow.in', password: 'Agent@123', phone: '9876511111', role: 'agent' },
        { name: 'Priya Sharma', email: 'priya@resolvenow.in', password: 'Agent@123', phone: '9876522222', role: 'agent' },
        { name: 'Mohan Rao', email: 'mohan@resolvenow.in', password: 'Agent@123', phone: '9876533333', role: 'agent' },
      ]);

      const users = await User.insertMany([
        { name: 'John Smith', email: 'john@example.com', password: 'User@123', phone: '9000011111', role: 'user' },
        { name: 'Anita Verma', email: 'anita@example.com', password: 'User@123', phone: '9000022222', role: 'user' },
        { name: 'Vikram Nair', email: 'vikram@example.com', password: 'User@123', phone: '9000033333', role: 'user' },
      ]);


      const complaintData = [
        {
          title: 'Road potholes on MG Road causing accidents',
          description: 'There are multiple deep potholes on MG Road near Gandhi Circle. Several vehicles have been damaged and it poses a serious safety hazard especially at night.',
          category: 'Infrastructure',
          priority: 'high',
          status: 'inprogress',
          address: { street: 'MG Road, Gandhi Circle', city: 'Rajamahendravaram', state: 'Andhra Pradesh', pincode: '533101' },
          submittedBy: users[0]._id,
          assignedTo: agents[0]._id,
        },
        {
          title: 'Broken street lights in Sector 5',
          description: 'All street lights on the main road of Sector 5 have been non-functional for the past 2 weeks. The area is very dark and unsafe after 7 PM.',
          category: 'Utilities',
          priority: 'medium',
          status: 'pending',
          address: { street: 'Sector 5, Main Road', city: 'Rajamahendravaram', state: 'Andhra Pradesh', pincode: '533102' },
          submittedBy: users[1]._id,
        },
        {
          title: 'Water leakage near Gandhi Circle',
          description: 'A major pipe has burst near Gandhi Circle and water is flowing onto the road since yesterday morning. Causing traffic issues and water wastage.',
          category: 'Public Services',
          priority: 'high',
          status: 'resolved',
          address: { street: 'Gandhi Circle', city: 'Rajamahendravaram', state: 'Andhra Pradesh', pincode: '533101' },
          submittedBy: users[0]._id,
          assignedTo: agents[1]._id,
          resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Garbage not collected for 3 days',
          description: 'The garbage collection vehicle has not visited our street for 3 consecutive days. Waste is piling up and causing foul smell and health concerns.',
          category: 'Sanitation',
          priority: 'medium',
          status: 'inprogress',
          address: { street: 'Railway Station Road', city: 'Rajamahendravaram', state: 'Andhra Pradesh', pincode: '533103' },
          submittedBy: users[2]._id,
          assignedTo: agents[2]._id,
        },
        {
          title: 'Blocked drainage causing flooding near market',
          description: 'The main drainage near the vegetable market is completely blocked. Even light rain causes 2-3 feet of water stagnation making the area impassable.',
          category: 'Infrastructure',
          priority: 'high',
          status: 'pending',
          address: { street: 'Vegetable Market Road', city: 'Rajamahendravaram', state: 'Andhra Pradesh', pincode: '533104' },
          submittedBy: users[1]._id,
        },
        {
          title: 'Water supply irregular in Colony 7',
          description: 'Water supply in Colony 7 has been very irregular for the past month. We receive water only once in 3 days and that too for just 30 minutes.',
          category: 'Utilities',
          priority: 'medium',
          status: 'resolved',
          address: { street: 'Colony 7, Block B', city: 'Rajamahendravaram', state: 'Andhra Pradesh', pincode: '533105' },
          submittedBy: users[2]._id,
          assignedTo: agents[2]._id,
          resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          feedback: { rating: 4, comment: 'Issue was resolved but took longer than expected.', submittedAt: new Date() },
        },
      ];

      const complaints = await Complaint.insertMany(complaintData);

      await Message.insertMany([
        {
          complaint: complaints[0]._id,
          sender: agents[0]._id,
          senderRole: 'agent',
          message: 'Hello! I am Agent Ravi. I have been assigned to your road pothole complaint. Could you provide the exact street number?',
        },
        {
          complaint: complaints[0]._id,
          sender: users[0]._id,
          senderRole: 'user',
          message: 'Yes, the potholes are near MG Road house number 45 to 60. There are about 8-9 large potholes.',
        },
        {
          complaint: complaints[0]._id,
          sender: agents[0]._id,
          senderRole: 'agent',
          message: 'Thank you for the details. I have escalated this to the road maintenance department. They will inspect within 48 hours.',
        },
        {
          complaint: complaints[0]._id,
          sender: users[0]._id,
          senderRole: 'user',
          message: 'Great, appreciate the quick response!',
        },
      ]);

      console.log('✅ Demo data seeded successfully.');
      console.log('─────────────────────────────────────');
      console.log('LOGIN CREDENTIALS:');
      console.log('Admin  → admin@resolvenow.in  / Admin@123');
      console.log('Agent  → ravi@resolvenow.in   / Agent@123');
      console.log('User   → john@example.com     / User@123');
      console.log('─────────────────────────────────────');
    }
  } catch (seedErr) {
    console.error('Error auto-seeding demo data:', seedErr);
  }
};

module.exports = connectDB;
