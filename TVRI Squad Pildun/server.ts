import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { google } from "googleapis";
import path from "path";
import fs from "fs";

// Initialize express app
const app = express();
const PORT = 3000;

// Setup multer for handling file uploads (stored in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Setup Google Auth using Service Account JSON
// We expect them to provide the stringified JSON via GOOGLE_SERVICE_ACCOUNT_JSON
// OR they could provide GOOGLE_APPLICATION_CREDENTIALS path.
// For this example, we assume GOOGLE_SERVICE_ACCOUNT_JSON is present in env.
function getGoogleAuth() {
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing in environment variables');
  }

  const credentials = JSON.parse(saJson);
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets'
    ],
  });

  return auth;
}

app.use(express.json());

// Main upload route wrapper
app.post('/api/upload', upload.single('image'), async (req, res): Promise<any> => {
  try {
    const file = req.file;
    const { platform, likes, comments, shares, saves } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    if (!platform) {
      return res.status(400).json({ error: 'Platform is required' });
    }

    // Check if auth config is available before proceeding
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        // Return a mock success response when running locally without credentials
        console.warn('Running without Google credentials. Simulating successful upload.');
        return res.json({ 
            success: true, 
            message: 'Simulated upload successful (no credentials)', 
            fileId: 'mock-file-id-12345'
        });
    }

    const auth = getGoogleAuth();

    // 1. Upload to Google Drive
    const drive = google.drive({ version: 'v3', auth });
    
    // Create a readable stream from the buffer
    const { Readable } = require('stream');
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    // Bikin format penamaan file baru
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}_${String(today.getMonth() + 1).padStart(2, '0')}_${today.getFullYear()}`;
    const uniqueId = Date.now(); // ID unik menggunakan timestamp
    const ext = path.extname(file.originalname);
    const newFileName = `Bukti_Dukung_${dateStr}_${platform}_${uniqueId}${ext}`;

    const driveResponse = await drive.files.create({
      requestBody: {
        name: newFileName,
        mimeType: file.mimetype,
      },
      media: {
        mimeType: file.mimetype,
        body: bufferStream,
      },
      fields: 'id',
    });

    const fileId = driveResponse.data.id;

    // 2. Insert metrics into Google Sheets
    // Assume SPREADSHEET_ID is also provided in env variables
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error('SPREADSHEET_ID is missing in environment variables');
    }

    const sheets = google.sheets({ version: 'v4', auth });
    
    // We assume there's a sheet named "Uploads" (or adapt the range accordingly)
    const range = 'Uploads!A:G'; 
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            new Date().toISOString(),
            platform,
            likes || 0,
            comments || 0,
            shares || 0,
            saves || 0,
            fileId,
          ]
        ]
      }
    });

    res.status(200).json({
      success: true,
      message: 'Upload and spreadsheet update successful!',
      fileId,
    });

  } catch (error: any) {
    console.error('Error during upload process:', error);
    res.status(500).json({ 
      error: 'Failed to process upload',
      details: error.message 
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files inside the 'dist' folder
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
