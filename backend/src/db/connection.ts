import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MONGODB_URI } from '../config/env';

let mongodInstance: MongoMemoryServer | null = null;
let isConnected = false;
let connectionType = 'none';
let connectionUri = '';

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  if (MONGODB_URI) {
    try {
      console.log(`[MongoDB] Connecting to external MongoDB at ${MONGODB_URI}...`);
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 4000,
      });
      isConnected = true;
      connectionType = 'external';
      connectionUri = MONGODB_URI;
      console.log('[MongoDB] Successfully connected to external MongoDB instance.');
      return;
    } catch (err: any) {
      console.warn(`[MongoDB] Could not connect to external MongoDB: ${err.message}. Falling back to embedded MongoDB...`);
    }
  }

  try {
    console.log('[MongoDB] Initializing embedded MongoDB server instance...');
    mongodInstance = await MongoMemoryServer.create();
    const uri = mongodInstance.getUri();
    await mongoose.connect(uri);
    isConnected = true;
    connectionType = 'embedded-memory';
    connectionUri = uri;
    console.log(`[MongoDB] Connected to embedded MongoDB server instance at ${uri}`);
  } catch (err: any) {
    console.error(`[MongoDB] Fatal error initializing MongoDB: ${err.message}`);
    throw new Error(`Failed to connect to MongoDB: ${err.message}`);
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
  isConnected = false;
  connectionType = 'none';
}

export function getDbStatus(): { isConnected: boolean; connectionType: string; uri: string } {
  return {
    isConnected: mongoose.connection.readyState === 1,
    connectionType,
    uri: connectionUri ? connectionUri.replace(/:\/\/.*@/, '://***@') : '',
  };
}
