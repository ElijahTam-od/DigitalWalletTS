import mongoose from 'mongoose';
import Config from './config';

const config = Config.getInstance();
const dbConnectionString = config.dbConnectionString; 

const connectDB = async () => {
    try {
        await mongoose.connect(dbConnectionString, {});
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;