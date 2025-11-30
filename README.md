
# Direct-Admission - India's College Finder 🎓

A premier portal for direct college admissions and curriculum discovery across India. Features AI-powered search, comprehensive filtering, and administrative tools.

## 🚀 Features

*   **Unified Search**: Search for Colleges and Courses simultaneously with text or voice.
    *   **Voice Search**: Click the microphone icon 🎙️ and speak.
    *   **AI Search**: Click the sparkle icon ✨ to let AI interpret complex queries (e.g., "Best B.Tech colleges in Kolkata").
*   **Smart Filtering**: Filter by State, Type (Course/College), and Sort by Fees/Rating.
*   **AI Insights**: Get instant summaries using Google Gemini AI.
*   **Admin Dashboard**: Manage Colleges, Courses, and Users via a secure interface.
*   **Excel Integration**: Bulk Import/Export entire databases.
*   **Cloud Sync**: Data is stored securely in a Google Sheet using a Service Account.

---

## 🛑 Pre-Go-Live Checklist (CRITICAL)

Before deploying to production, you must configure real authentication and secrets.

### 1. 🔒 Configure Authentication (Firebase Auth)
The `Login.tsx` component needs a real Identity Provider. We recommend **Firebase Authentication**.

1.  Go to [Firebase Console](https://console.firebase.google.com/) > Add Project.
2.  Go to **Authentication** > **Sign-in method** > Enable **Google**.
3.  Register your web app in Project Settings.
4.  Install Firebase SDK: `npm install firebase`
5.  Create a file `src/firebase.ts` with your config.
6.  Update `src/components/Login.tsx`:
    ```typescript
    import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
    // ... inside component
    const signIn = async () => {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(getAuth(), provider);
      onLogin(result.user.email);
    };
    ```

### 2. 🔑 Environment Variables Reference

You need two types of variables: **Frontend** (Embedded at build time) and **Backend** (Read at runtime).

#### Frontend Variables (React)
*Must start with `REACT_APP_`*

| Variable Name | Description | Required? |
| :--- | :--- | :--- |
| `REACT_APP_GEMINI_API_KEY` | Google Gemini API Key for AI Search & Insights. | Yes |
| `REACT_APP_ADMIN_EMAIL` | Default Admin Email (e.g., `contact@direct-admission.com`). | Yes |
| `REACT_APP_FIREBASE_API_KEY` | (If using Firebase) Firebase Config API Key. | No |

#### Backend Variables (Node.js)
*Read by `server.js` on the server*

| Variable Name | Description | Required? |
| :--- | :--- | :--- |
| `GOOGLE_SHEET_ID` | The ID of your Google Sheet database (string between `/d/` and `/edit`). | Yes |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | IAM Email of the Service Account (e.g., `sheet-bot@project.iam.gserviceaccount.com`). | Yes |
| `GOOGLE_PRIVATE_KEY` | The Private Key block from the Service Account JSON. | Yes |
| `PORT` | Server Port (Default: 8080). | No |

---

## ☁️ Deployment Guide (Google Cloud Run)

### Step 1: Prepare Google Cloud Project
1.  **Create Project**: Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  **Enable APIs**: Enable "Cloud Run API", "Cloud Build API", and "Google Sheets API".
3.  **Service Account**: 
    *   Create a Service Account (`sheet-manager`).
    *   Download the JSON Key.
    *   **Important**: Share your Google Sheet with the Service Account's email address (Editor access).

### Step 2: Build Container
Since React environment variables are baked in at build time, you must pass them as `--build-arg`.

```bash
# Login
gcloud auth login
gcloud config set project [YOUR_PROJECT_ID]

# Build Image (Inject Frontend Keys Here)
gcloud builds submit \
  --tag gcr.io/[YOUR_PROJECT_ID]/direct-admission \
  --build-arg REACT_APP_GEMINI_API_KEY="[YOUR_REAL_API_KEY]" \
  --build-arg REACT_APP_ADMIN_EMAIL="contact@direct-admission.com" \
  .
```

### Step 3: Deploy Service
Inject Backend secrets at runtime using `--set-env-vars`.

*Note: For `GOOGLE_PRIVATE_KEY`, ensure you include the full string with `\n` or use Google Secret Manager.*

```bash
gcloud run deploy direct-admission-app \
  --image gcr.io/[YOUR_PROJECT_ID]/direct-admission \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars GOOGLE_SHEET_ID="[YOUR_SHEET_ID]" \
  --set-env-vars GOOGLE_SERVICE_ACCOUNT_EMAIL="[YOUR_SA_EMAIL]" \
  --set-env-vars GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

---

## 🛠️ Local Development

1.  **Clone & Install**:
    ```bash
    npm install
    ```
2.  **Configure `.env`**:
    Create a `.env` file in the root:
    ```env
    # Frontend
    REACT_APP_GEMINI_API_KEY=xyz...
    REACT_APP_ADMIN_EMAIL=contact@direct-admission.com
    
    # Backend
    GOOGLE_SHEET_ID=abc...
    GOOGLE_SERVICE_ACCOUNT_EMAIL=bot@...
    GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
    ```
3.  **Run**:
    ```bash
    npm start
    ```
    *Note: `npm start` runs the backend server (`server.js`) which serves the React app.*

---

## 📁 Data Structure

The application automatically maps data to Columns in your Google Sheet.

| Sheet Name | Columns (Headers) |
| :--- | :--- |
| **Colleges** | `id`, `name`, `location`, `state`, `logoUrl`, `description`, `rating`, `ratingCount`, `phone` |
| **Courses** | `id`, `collegeId`, `courseName`, `fees`, `duration`, `description`, `rating`, `ratingCount` |
| **Users** | `email`, `name`, `role`, `avatar` |

*Note: The app expects these exact sheet names. If you delete the sheets, the server will recreate them on the next restart/sync.*
