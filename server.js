const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const net = require('net');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const MAX_PORT_ATTEMPTS = 20; // Maximum number of ports to try

// Function to find an available port
const findAvailablePort = async (startPort, attempts = 0) => {
  if (attempts >= MAX_PORT_ATTEMPTS) {
    throw new Error(`Could not find an available port after ${MAX_PORT_ATTEMPTS} attempts`);
  }

  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${startPort} is in use, trying ${startPort + 1}...`);
        resolve(findAvailablePort(startPort + 1, attempts + 1));
      } else {
        reject(err);
      }
    });
    
    server.once('listening', () => {
      server.close(() => {
        console.log(`Found available port: ${startPort}`);
        resolve(startPort);
      });
    });
    
    server.listen(startPort);
  });
};

// Start the server
app.prepare().then(async () => {
  try {
    const desiredPort = parseInt(process.env.PORT || '3000', 10);
    console.log(`Attempting to start server on port ${desiredPort}...`);
    
    // Find an available port starting from the desired port
    const port = await findAvailablePort(desiredPort);
    
    // Create the server
    const server = createServer((req, res) => {
      try {
        // Parse the URL
        const parsedUrl = parse(req.url, true);
        
        // Handle the request
        handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
    
    // Handle server errors
    server.on('error', (err) => {
      console.error('Server error:', err);
    });
    
    // Start listening
    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
      if (port !== desiredPort) {
        console.log(`Note: Using port ${port} instead of desired port ${desiredPort}`);
      }
    });
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}); 