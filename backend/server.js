import express from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import bodyParser from 'body-parser';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'https://www.prototypesf.org'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static('public'));

// Create uploads and processed directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const processedDir = path.join(__dirname, 'public', 'processed');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// API endpoint to process videos
app.post('/api/deface', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No video file provided' });
  }

  const inputPath = req.file.path;
  const outputFileName = `processed-${path.basename(req.file.filename)}`;
  const outputPath = path.join(processedDir, outputFileName);
  
  // Parse configuration options
  let config = {
    fps: 60,
    maskType: 'blur',
    keepAudio: true,
    resolution: '720p'
  };
  
  // Override with client-provided config if available
  if (req.body.config) {
    try {
      const clientConfig = JSON.parse(req.body.config);
      config = { ...config, ...clientConfig };
    } catch (error) {
      console.warn('Failed to parse client config:', error);
    }
  }
  
  // Map resolution to actual dimensions
  const resolutionMap = {
    '480p': { width: 854, height: 480 },
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 }
  };
  
  const resolution = resolutionMap[config.resolution] || resolutionMap['720p'];
  
  // Map mask type to deface options
  const maskTypeMap = {
    'blur': 'blur',
    'solid': 'solid',
    'mosaic': 'mosaic'
  };
  
  const maskType = maskTypeMap[config.maskType] || 'blur';
  
  // Build ffmpeg config
  const ffmpegConfig = {
    fps: config.fps,
    preset: 'medium',
    crf: 23, // Quality factor (lower = better quality)
    pix_fmt: 'yuv420p',
    vcodec: 'libx264',
    vf: `scale=${resolution.width}:${resolution.height}`
  };
  
  // Command to run the deface Python script from the virtual environment
  const defacePath = path.resolve(__dirname, 'venv/bin/deface');
  
  // Let's go back to basics - what we know worked before
  let command;
  
  // Properly escape paths for shell
  const escapedInputPath = inputPath.replace(/'/g, "'\\''");
  const escapedOutputPath = outputPath.replace(/'/g, "'\\''");
  const escapedVenvPath = path.resolve(__dirname, 'venv/bin/activate').replace(/'/g, "'\\''");
  const escapedDefacePath = defacePath.replace(/'/g, "'\\''");
  
  // Create a temporary JSON file for the ffmpeg config
  const configJson = JSON.stringify({ fps: config.fps });
  const configPath = path.join(__dirname, `config-${Date.now()}.json`);
  fs.writeFileSync(configPath, configJson);
  
  // Set default values for new parameters if they're not provided
  const threshold = config.threshold || 0.19;
  const maskScale = config.maskScale || 1.3;
  
  if (config.keepAudio) {
    // Simple command using a temp file for the config, with detection threshold and mask scale
    command = `/bin/bash -c 'source "${escapedVenvPath}" && ` +
              `"${escapedDefacePath}" "${escapedInputPath}" -o "${escapedOutputPath}" -k ` +
              `--replacewith ${maskType} ` +
              `--mask-scale ${maskScale} ` +
              `--thresh ${threshold} ` +
              `--ffmpeg-config "$(cat "${configPath}")"'`; 
  } else {
    // Without audio, with detection threshold and mask scale
    command = `/bin/bash -c 'source "${escapedVenvPath}" && ` +
              `"${escapedDefacePath}" "${escapedInputPath}" -o "${escapedOutputPath}" ` +
              `--replacewith ${maskType} ` +
              `--mask-scale ${maskScale} ` +
              `--thresh ${threshold} ` +
              `--ffmpeg-config "$(cat "${configPath}")"'`; 
  }
  
  console.log(`Executing command: ${command}`);
  
  // Check if the deface command exists
  if (!fs.existsSync(defacePath)) {
    const errorMsg = `Deface command not found at path: ${defacePath}`;
    console.error(errorMsg);
    return res.status(500).json({ message: 'Error processing video', error: errorMsg });
  }

  // Check if input path exists
  if (!fs.existsSync(inputPath)) {
    const errorMsg = `Input video file not found at path: ${inputPath}`;
    console.error(errorMsg);
    return res.status(500).json({ message: 'Error processing video', error: errorMsg });
  }

  // Check if output directory exists and is writable
  if (!fs.existsSync(path.dirname(outputPath))) {
    const errorMsg = `Output directory not found: ${path.dirname(outputPath)}`;
    console.error(errorMsg);
    return res.status(500).json({ message: 'Error processing video', error: errorMsg });
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing deface command: ${error.message}`);
      console.error(`Command was: ${command}`);
      return res.status(500).json({ 
        message: 'Error processing video', 
        error: error.message,
        command: command
      });
    }
    
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    
    console.log(`stdout: ${stdout}`);
    
    // Return the URL to the processed video
    const processedVideoUrl = `/processed/${outputFileName}`;
    res.json({ 
      message: 'Video processed successfully', 
      processedVideoUrl: processedVideoUrl
    });
    
    // Clean up the original uploaded file and temp config file
    try {
      fs.unlinkSync(inputPath);
      
      // Also clean up the config file
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }
    } catch (err) {
      console.error('Error deleting files:', err);
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});