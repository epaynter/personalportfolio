import { connectToDatabase } from '../../../lib/mongodb';
import JSZip from 'jszip';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const { db } = await connectToDatabase();
    const zip = new JSZip();

    // Get all assistant files
    const files = await db.collection('assistantFiles').find({}).toArray();
    console.log(`Found ${files.length} assistant files for export`);

    // Get all projects
    const projects = await db.collection('projects').find({}).toArray();
    console.log(`Found ${projects.length} projects for export`);

    // Add assistant files to zip
    for (const file of files) {
      if (!file.content) {
        console.log(`Skipping file ${file.filename} - no content found`);
        continue;
      }

      console.log(`Adding file ${file.filename} with content length: ${file.content.length}`);
      zip.file(file.filename, file.content);
    }

    // Create metadata folder
    const metadataFolder = zip.folder('metadata');
    
    // Create projects metadata file
    const projectsMetadata = projects.map(project => ({
      id: project._id.toString(),
      title: project.title,
      shortDescription: project.shortDescription,
      longDescription: project.longDescription,
      category: project.category,
      tags: project.tags,
      link: project.link,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      contentCount: project.content ? project.content.length : 0,
      contentTypes: project.content ? project.content.map(item => item.type) : []
    }));
    
    metadataFolder.file('projects.json', JSON.stringify(projectsMetadata, null, 2));

    // Add projects to zip
    const projectsFolder = zip.folder('projects');
    for (const project of projects) {
      const projectFolder = projectsFolder.folder(project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase());
      
      // Add project metadata
      projectFolder.file('metadata.json', JSON.stringify({
        title: project.title,
        shortDescription: project.shortDescription,
        longDescription: project.longDescription,
        category: project.category,
        tags: project.tags,
        link: project.link,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }, null, 2));

      // Add project content
      if (project.content && Array.isArray(project.content)) {
        const contentFolder = projectFolder.folder('content');
        for (const [index, item] of project.content.entries()) {
          if (item.type === 'image' || item.type === 'video' || item.type === 'pdf') {
            try {
              // Fetch the content from the URL
              const response = await fetch(item.url);
              if (!response.ok) {
                console.log(`Failed to fetch content for ${item.url}`);
                continue;
              }
              
              const buffer = await response.arrayBuffer();
              const extension = item.type === 'pdf' ? '.pdf' : 
                              item.type === 'video' ? '.mp4' : 
                              item.url.split('.').pop() || '.jpg';
              const filename = `content_${index + 1}${extension}`;
              
              contentFolder.file(filename, buffer);
              console.log(`Added content file ${filename} to project ${project.title}`);
            } catch (error) {
              console.error(`Error fetching content for ${item.url}:`, error);
            }
          }
        }
      }
    }

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=portfolio-export.zip');
    res.setHeader('Content-Length', zipBuffer.length);

    // Send the zip file
    return res.status(200).send(zipBuffer);
  } catch (error) {
    console.error('Export failed:', error);
    return res.status(500).json({ error: 'Failed to export files' });
  }
} 