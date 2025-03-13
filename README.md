<p align="center">
  <img src="frontend/src/assets/prototype_wordmark.svg" alt="PrototypeSF Logo" width="300" style="margin-top: 20px;">
</p>

# PrototypeSF Website

Welcome to the PrototypeSF website repository. This is the official website for the PrototypeSF house.

### Public URL
- [prototypesf.org](https://prototypesf.org)

## Features
- PrototypeSF home page with information about the house and community
- The Deface Program - a tool for anonymizing faces in videos

## Project Structure
```
/
├── frontend/          # React frontend application
└── backend/           # Express backend API server
```

## Requirements
- Node.js 18+ 
- Python 3.7+
- Deface Python package (`pip install deface`)

## Installation

1. Clone the repository
2. Install dependencies for both frontend and backend
```
npm install
```

3. Set up Python virtual environment and install the Deface package
```bash
# Navigate to the backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install deface in the virtual environment
pip install deface

# Deactivate when done (optional)
deactivate
```

## Running the application

### Development mode
Run both frontend and backend servers:
```
npm run start
```

Or run them separately:
```
# Frontend only
npm run start:frontend

# Backend only
npm run start:backend
```

### Production build
```
npm run build
```

## Usage
1. Navigate to the home page at http://localhost:5173/
2. Click on "The Deface Program" to access the face anonymization tool
3. Upload a video to automatically process and anonymize all faces
4. Download the processed video using the Export button

## API Endpoints

### POST /api/deface
Processes a video to anonymize all faces.

**Request:**
- Content-Type: multipart/form-data
- Body: 
  - video: Video file (MP4, MOV, etc.)

**Response:**
```json
{
  "message": "Video processed successfully",
  "processedVideoUrl": "/processed/processed-filename.mp4"
}
```
