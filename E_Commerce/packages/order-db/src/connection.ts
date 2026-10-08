import moongose from 'mongoose';

let isConnected = false;
export const connectOrderDB = async () => {
  if (isConnected) {
    return;
  }
  if (!process.env.MONGO_URL) {
    throw new Error('MONGO_URL is not defined');
  }
  try {
    await moongose.connect(process.env.MONGO_URL!);
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.log(error);
    throw error;
  }
}
