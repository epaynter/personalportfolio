import { IncomingForm } from 'formidable';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Debug incoming request
    console.log('Incoming request:', {
      fields,
      files,
      fileKeys: files ? Object.keys(files) : []
    });

    // Handle the case where file is an array (multiple files)
    const fileArray = files.file;
    if (!fileArray || (Array.isArray(fileArray) && fileArray.length === 0)) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Get the first file if it's an array
    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

    // Debug file information
    console.log('File info:', {
      originalFilename: file.originalFilename,
      mimetype: file.mimetype,
      size: file.size,
      filepath: file.filepath,
      // Log the entire file object to see its structure
      fileObject: JSON.stringify(file, null, 2)
    });

    // Get file extension and mime type
    const fileExtension = file.originalFilename?.split('.').pop()?.toLowerCase() || '';
    const fileType = file.mimetype || '';

    // Check for image types
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'tiff', 'bmp', 'svg'];
    const isImage = fileType.startsWith('image/') || imageExtensions.includes(fileExtension);
    
    // Check for video types
    const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
    const isVideo = fileType.startsWith('video/') || videoExtensions.includes(fileExtension);
    
    // Check for document types
    const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    const isDocument = fileType.includes('pdf') || 
                      fileType.includes('document') || 
                      fileType.includes('spreadsheet') || 
                      fileType.includes('presentation') ||
                      documentExtensions.includes(fileExtension);
    
    // Check for text types
    const textExtensions = ['txt', 'md', 'json', 'csv'];
    const isText = fileType.includes('text') || textExtensions.includes(fileExtension);
    
    // Check for archive types
    const archiveExtensions = ['zip', 'rar', '7z'];
    const isArchive = fileType.includes('zip') || fileType.includes('rar') || archiveExtensions.includes(fileExtension);

    // Debug type detection
    console.log('Type detection:', {
      fileExtension,
      fileType,
      isImage,
      isVideo,
      isDocument,
      isText,
      isArchive
    });

    // If we can't determine the file type, try to infer it from the file path
    if (!isImage && !isVideo && !isDocument && !isText && !isArchive && file.filepath) {
      const pathExtension = file.filepath.split('.').pop()?.toLowerCase() || '';
      if (imageExtensions.includes(pathExtension)) {
        // Assume it's an image if the path extension matches
        console.log('Inferring image type from path extension:', pathExtension);
        // Upload to Cloudinary with appropriate settings
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'portfolio',
              format: 'auto',
              quality: 'auto:best',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          // Create a readable stream from the file
          const fileStream = fs.createReadStream(file.filepath);
          fileStream.pipe(uploadStream);
        });

        // Clean up the temporary file
        fs.unlinkSync(file.filepath);

        // Return the URL of the uploaded file
        return res.status(200).json({ url: result.secure_url });
      }
    }

    if (!isImage && !isVideo && !isDocument && !isText && !isArchive) {
      return res.status(400).json({ 
        error: 'Invalid file type',
        details: {
          fileExtension,
          fileType,
          allowedTypes: {
            images: imageExtensions,
            videos: videoExtensions,
            documents: documentExtensions,
            text: textExtensions,
            archives: archiveExtensions
          }
        }
      });
    }

    // Create upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: isDocument ? 'raw' : 'auto',
        folder: 'portfolio',
        type: 'upload',
        access_mode: 'public',
        use_filename: true,
        unique_filename: true,
        format: isDocument ? 'pdf' : undefined
      },
      async (error, result) => {
        if (error) {
          console.error('Error uploading file:', error);
          res.status(500).json({ error: 'Failed to upload file' });
          return;
        }

        // If it's a PDF, generate a thumbnail from the first page
        if (isDocument && fileExtension === 'pdf') {
          try {
            // Generate a thumbnail from the first page
            const thumbnailUrl = cloudinary.url(result.public_id, {
              resource_type: 'image',
              format: 'jpg',
              page: 1,
              width: 800,
              height: 600,
              crop: 'fill',
              quality: 'auto',
              flags: 'attachment'
            });

            // Clean up the temporary file
            fs.unlinkSync(file.filepath);

            res.status(200).json({ 
              url: result.secure_url,
              thumbnailUrl: thumbnailUrl,
              type: 'pdf'
            });
          } catch (thumbnailError) {
            console.error('Error generating PDF thumbnail:', thumbnailError);
            // If thumbnail generation fails, still return the PDF URL
            res.status(200).json({ url: result.secure_url, type: 'pdf' });
          }
        } else {
          // Clean up the temporary file
          fs.unlinkSync(file.filepath);
          res.status(200).json({ url: result.secure_url });
        }
      }
    );

    // Create a readable stream from the file
    const fileStream = fs.createReadStream(file.filepath);
    fileStream.pipe(uploadStream);
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Error uploading file', details: error.message });
  }
} 