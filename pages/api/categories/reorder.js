import { ObjectId } from 'mongodb';
import { getDb } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({ message: 'Categories must be an array' });
    }

    const db = await getDb();
    const collection = db.collection('categories');

    // Create bulk operations for updating positions
    const bulkOps = categories.map(category => ({
      updateOne: {
        filter: { _id: new ObjectId(category._id) },
        update: {
          $set: {
            position: category.position,
            updatedAt: new Date()
          }
        }
      }
    }));

    // Execute bulk update
    await collection.bulkWrite(bulkOps);

    // Fetch and return the updated categories in the correct order
    const updatedCategories = await collection
      .find({})
      .sort({ position: 1 })
      .toArray();

    return res.status(200).json({ 
      message: 'Categories reordered successfully',
      categories: updatedCategories
    });
  } catch (error) {
    console.error('Error reordering categories:', error);
    return res.status(500).json({ 
      message: 'Failed to reorder categories',
      error: error.message 
    });
  }
} 