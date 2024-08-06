import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

class FilesController {
  static async postUpload(req, res) {
    const { name, type, parentId, isPublic = false, data } = req.body;
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tokenKey = `auth_${token}`;
    const userId = await redisClient.get(tokenKey);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing or invalid type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: new dbClient.ObjectId(parentId) });

      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const filePath = path.join(folderPath, uuidv4());

    if (type !== 'folder') {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    }

    const fileDoc = {
      userId,
      name,
      type,
      isPublic,
      parentId: parentId || 0,
      localPath: type !== 'folder' ? filePath : null,
    };

    const result = await dbClient.db.collection('files').insertOne(fileDoc);

    return res.status(201).json({ id: result.insertedId, ...fileDoc });
  }
}

export default FilesController;
