import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  // Verify admin password
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { db } = await connectToDatabase();
    
    // Get all projects with their summaries
    const projects = await db.collection('projects').find({}, {
      projection: {
        title: 1,
        description: 1,
        shortDescription: 1,
        longDescription: 1,
        updatedAt: 1,
        _id: 1
      }
    }).toArray();

    // Format the project data for display
    const formattedProjects = projects.map(project => ({
      _id: project._id,
      title: project.title,
      description: project.shortDescription || project.description,
      fullDescription: project.longDescription || project.description,
      updatedAt: project.updatedAt || new Date()
    }));

    res.status(200).json(formattedProjects);
  } catch (error) {
    console.error('Error fetching project data:', error);
    res.status(500).json({ error: 'Failed to fetch project data' });
  }
} 