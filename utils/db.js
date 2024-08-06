import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client
      .connect()
      .then(() => {
        this.db = this.client.db(database);
      })
      .catch((err) => {
        console.error('MongoDB client not connected to the server:', err);
      });
  }

  isAlive() {
    return this.client.topology && this.client.topology.isConnected();
  }

  async nbUsers() {
    if (this.isAlive()) {
      return this.db.collection('users').countDocuments();
    }
    return 0;
  }

  async nbFiles() {
    if (this.isAlive()) {
      return this.db.collection('files').countDocuments();
    }
    return 0;
  }
}

const dbClient = new DBClient();
export default dbClient;
