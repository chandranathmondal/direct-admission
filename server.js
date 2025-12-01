
const express = require('express');
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { GoogleGenAI, Type } = require("@google/genai");

// Load environment variables locally
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// ============================================================================
// CONFIGURATION
// ============================================================================
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
// Handle newlines in private key if passed via string env var
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY 
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') 
  : null;

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SHEET_CONFIG = {
  COLLEGES: {
    title: 'Colleges',
    // Added 'phone' to headers
    headers: ['id', 'name', 'location', 'state', 'logoUrl', 'description', 'rating', 'ratingCount', 'phone']
  },
  COURSES: {
    title: 'Courses',
    headers: ['id', 'collegeId', 'courseName', 'fees', 'duration', 'description', 'rating', 'ratingCount']
  },
  USERS: {
    title: 'Users',
    headers: ['email', 'name', 'role', 'avatar']
  }
};

// ============================================================================
// AUTHENTICATION & SHEET SETUP
// ============================================================================
let doc = null;
let aiClient = null;

async function getDoc() {
  if (doc) return doc;
  
  if (!GOOGLE_SHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.warn("Missing Google Service Account Credentials. App will run in Offline Mode.");
    return null;
  }

  const serviceAccountAuth = new JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  const newDoc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, serviceAccountAuth);
  await newDoc.loadInfo();
  return newDoc;
}

function getAiClient() {
  if (aiClient) return aiClient;
  if (!GEMINI_API_KEY) {
    console.warn("Missing GEMINI_API_KEY. AI features will be unavailable.");
    return null;
  }
  aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  return aiClient;
}

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================
let GLOBAL_CACHE = {
  courses: [],
  colleges: [],
  users: [],
  lastUpdated: 0
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

async function refreshCache() {
  try {
    const document = await getDoc();
    if (!document) return; // Offline mode

    console.log("Refreshing cache from Google Sheets (Columns Mode)...");

    // Helper to read row data based on headers
    const readSheetData = async (config) => {
      const sheet = document.sheetsByTitle[config.title];
      if (!sheet) return [];
      
      const rows = await sheet.getRows();
      return rows.map(row => {
        const item = {};
        config.headers.forEach(header => {
          let val = row.get(header);
          
          // Data Type Conversion
          if (header === 'fees' || header === 'rating' || header === 'ratingCount') {
            item[header] = val ? Number(val) : 0;
          } else {
            item[header] = val || '';
          }
        });
        return item;
      });
    };

    const [courses, colleges, users] = await Promise.all([
      readSheetData(SHEET_CONFIG.COURSES),
      readSheetData(SHEET_CONFIG.COLLEGES),
      readSheetData(SHEET_CONFIG.USERS)
    ]);

    if (courses) GLOBAL_CACHE.courses = courses;
    if (colleges) GLOBAL_CACHE.colleges = colleges;
    if (users) GLOBAL_CACHE.users = users;

    GLOBAL_CACHE.lastUpdated = Date.now();
    console.log(`Cache updated. Colleges: ${GLOBAL_CACHE.colleges.length}, Courses: ${GLOBAL_CACHE.courses.length}, Users: ${GLOBAL_CACHE.users.length}`);

  } catch (error) {
    console.error("Failed to refresh cache:", error);
  }
}

async function syncToSheet(config, dataArray) {
  try {
    const document = await getDoc();
    if (!document) throw new Error("Backend not configured for Google Sheets");

    console.log(`Syncing ${config.title} to Google Sheet...`);
    
    // 1. Get or Create Sheet
    let sheet = document.sheetsByTitle[config.title];
    if (!sheet) {
      sheet = await document.addSheet({ title: config.title });
    }

    // 2. Prepare Rows
    const rows = dataArray.map(item => {
      const rowData = {};
      config.headers.forEach(header => {
        let val = item[header];
        rowData[header] = val;
      });
      return rowData;
    });

    // 3. Clear and Write
    // Note: We need to preserve headers
    await sheet.clearRows(); 
    await sheet.setHeaderRow(config.headers);
    await sheet.addRows(rows);

    console.log(`Sync ${config.title} complete.`);
  } catch (error) {
    console.error(`Failed to sync ${config.title}:`, error);
    throw error;
  }
}

// ============================================================================
// MIDDLEWARE & ROUTES
// ============================================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'build')));

// GET Data
app.get('/api/data', (req, res) => {
  res.json(GLOBAL_CACHE);
});

// Manual Refresh
app.post('/api/refresh', async (req, res) => {
  await refreshCache();
  res.json({ success: true, timestamp: GLOBAL_CACHE.lastUpdated });
});

// Save Courses
app.post('/api/save-courses', async (req, res) => {
  const { courses } = req.body;
  if (!Array.isArray(courses)) return res.status(400).json({ error: "Invalid data format" });
  
  try {
    GLOBAL_CACHE.courses = courses; // Optimistic
    await syncToSheet(SHEET_CONFIG.COURSES, courses);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Sync failed: " + err.message });
  }
});

// Save Colleges
app.post('/api/save-colleges', async (req, res) => {
  const { colleges } = req.body;
  if (!Array.isArray(colleges)) return res.status(400).json({ error: "Invalid data format" });
  
  try {
    GLOBAL_CACHE.colleges = colleges;
    await syncToSheet(SHEET_CONFIG.COLLEGES, colleges);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Sync failed: " + err.message });
  }
});

// Save Users
app.post('/api/save-users', async (req, res) => {
  const { users } = req.body;
  if (!Array.isArray(users)) return res.status(400).json({ error: "Invalid data format" });
  
  try {
    GLOBAL_CACHE.users = users;
    await syncToSheet(SHEET_CONFIG.USERS, users);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Sync failed: " + err.message });
  }
});

// --- AI PROXY ROUTES ---

// Search Query Parsing
app.post('/api/ai/search', async (req, res) => {
  const { userQuery } = req.body;
  const ai = getAiClient();
  
  if (!ai) return res.status(503).json({ error: "AI Service Unavailable" });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this user query for college admissions in India: "${userQuery}".
      
      Extract search filters:
      1. location: City or State. Fix typos (e.g. "Kolkatta" -> "Kolkata").
      2. keyword: Specific degree, course, or specialization (e.g., "B.Tech", "Computer Science", "IT", "Bio Technology", "MBA"). 
         - Do NOT generalize to broad topics (e.g. keep "Computer Science", don't convert to "Engineering").
         - Fix typos (e.g. "Coputer Scence" -> "Computer Science").
      
      Return JSON: { "location": string | null, "keyword": string | null }
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: { type: Type.STRING, nullable: true },
            keyword: { type: Type.STRING, nullable: true }
          }
        }
      }
    });

    if (response.text) {
      res.json(JSON.parse(response.text));
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error("Gemini Search Error:", error);
    res.status(500).json({ error: "AI Error" });
  }
});

// Course Insights
app.post('/api/ai/course-insights', async (req, res) => {
  const { courseName, collegeName, description } = req.body;
  const ai = getAiClient();
  
  if (!ai) return res.status(503).json({ text: "AI insights unavailable." });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a 2-sentence exciting summary about the ${courseName} program at ${collegeName}, India. 
      Use the provided description for context: "${(description || '').substring(0, 1000)}...".
      Focus on career prospects and unique selling points.`,
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini Course Insight Error:", error);
    res.json({ text: "No insights available." });
  }
});

// College Insights
app.post('/api/ai/college-insights', async (req, res) => {
  const { collegeName, location, description } = req.body;
  const ai = getAiClient();
  
  if (!ai) return res.status(503).json({ text: "AI insights unavailable." });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a 2-sentence highlight summary about ${collegeName} located in ${location}.
      Use the provided description for context: "${(description || '').substring(0, 1000)}...".
      Focus on campus life, reputation, or infrastructure.`,
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini College Insight Error:", error);
    res.json({ text: "No insights available." });
  }
});

// Serve React App
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// ============================================================================
// STARTUP
// ============================================================================

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Initial Cache Load
  await refreshCache();
  // Periodic Refresh (every 1 hour)
  setInterval(refreshCache, 60 * 60 * 1000);
});
