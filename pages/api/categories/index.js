import { ObjectId } from 'mongodb';
import { getDb } from '../../../lib/mongodb';

export default async function handler(req, res) {
  const { method } = req;
  const db = await getDb();

  switch (method) {
    case 'GET':
      try {
        const categories = await db
          .collection('categories')
          .find({})
          .sort({ position: 1 })
          .toArray();
        res.status(200).json(categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
      }
      break;

    case 'POST':
      try {
        const { name, position } = req.body;
        
        if (!name) {
          return res.status(400).json({ error: 'Name is required' });
        }

        // If position is not provided, add to the end
        let newPosition = position;
        if (newPosition === undefined) {
          const lastCategory = await db
            .collection('categories')
            .findOne({}, { sort: { position: -1 } });
          newPosition = lastCategory ? lastCategory.position + 1 : 0;
        }

        const result = await db.collection('categories').insertOne({
          name,
          position: newPosition,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        res.status(201).json({
          _id: result.insertedId,
          name,
          position: newPosition
        });
      } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
      }
      break;

    case 'PUT':
      try {
        const { _id, updates } = req.body;
        
        if (!_id || !updates) {
          return res.status(400).json({ error: 'ID and updates are required' });
        }

        const result = await db.collection('categories').updateOne(
          { _id: new ObjectId(_id) },
          { 
            $set: {
              ...updates,
              updatedAt: new Date()
            }
          }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'Category not found' });
        }

        res.status(200).json({ message: 'Category updated successfully' });
      } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
      }
      break;

    case 'DELETE':
      try {
        const { _id } = req.query;
        
        if (!_id) {
          return res.status(400).json({ error: 'Category ID is required' });
        }

        // First, check if there are any projects using this category
        const projectsWithCategory = await db
          .collection('projects')
          .countDocuments({ category: _id });

        if (projectsWithCategory > 0) {
          return res.status(400).json({ 
            error: 'Cannot delete category. It is being used by one or more projects.' 
          });
        }

        const result = await db.collection('categories').deleteOne({
          _id: new ObjectId(_id)
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Category not found' });
        }

        res.status(200).json({ message: 'Category deleted successfully' });
      } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}