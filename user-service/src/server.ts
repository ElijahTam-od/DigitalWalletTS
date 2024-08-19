import express from 'express';
import Config from './config/config'; // Make sure to use the correct path to db.ts
import routes from './routes/index';
import connectDB from './config/db.config';

// Get the configuration instance
const config = Config.getInstance();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
// app.use(cors());
app.use(express.json());

// Use routes
app.use('/api', routes);

// Start the server
app.listen(config.port, () => console.log(`Server running on port ${config.port}`));

export default app;
