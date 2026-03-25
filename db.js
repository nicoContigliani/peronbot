import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db = null;

export async function connectDB() {
    try {
        await client.connect();
        db = client.db(); // Uses the database from the URI (dge)
        console.log('✅ Conectado a MongoDB');
        return db;
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error.message);
        throw error;
    }
}

export function getDB() {
    if (!db) {
        throw new Error('MongoDB no está conectado. Llama a connectDB() primero.');
    }
    return db;
}

export function getCollection(name) {
    return getDB().collection(name);
}

export async function closeDB() {
    await client.close();
    db = null;
}
