import mongoose from 'mongoose';
import config from './config.js';
import app from './app.js';

await mongoose.connect(config.mongoUri);
console.log('MongoDB connected');
app.listen(config.port, () => console.log(`API listening on :${config.port}`));
