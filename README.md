# Direct-Admission - India's College Finder 🎓

A premier portal for direct college admissions and curriculum discovery across India. Features AI-powered search, comprehensive filtering, and administrative tools.

## 🚀 Features

*   **Unified Search**: Search for Colleges and Courses simultaneously with text or voice.
*   **Smart Filtering**: Filter by State, Type (Course/College), and Sort by Fees/Rating.
*   **AI Insights**: Get instant summaries about courses and colleges using Google Gemini AI, leveraging detailed curriculum descriptions.
*   **Rich Content**: HTML support for both Course and College descriptions for formatted brochures.
*   **Admin Dashboard**: Manage Colleges, Courses, and Users via a secure interface.
*   **Excel Integration**: Bulk Import/Export entire databases (Overwrites existing data).
*   **Cloud Sync**: Data is stored securely in a Google Sheet using a Service Account.

---

## 🛑 Pre-Go-Live Checklist (CRITICAL)

Before deploying this application to a public URL for real users, you **MUST** complete these steps to ensure security and functionality:

### 1. 🔒 Secure Authentication (Priority: High)
The current application uses a **Simulated Login** for demonstration purposes. 
*   **Risk**: Anyone can log in as an Admin by simply typing `chandranathmondal@yahoo.com` without a password.
*   **Action**: 
    1.  Go to `components/Login.tsx`.
    2.  Replace the mock logic with a real Identity Provider (Auth0, Firebase Auth, or Clerk).
    3.  Example using Firebase:
        ```typescript
        // In Login.tsx
        import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
        const signIn = () => signInWithPopup(getAuth(), new GoogleAuthProvider());
        ```
    4.  Update `App.tsx` to verify the ID token from the provider, not just the email string.

### 2. 🔑 Environment Variables
Ensure you have the following secrets ready. **NEVER commit these to GitHub.**
*   `GOOGLE_SHEET_ID`: The ID of your backend database sheet.
*   `GOOGLE_SERVICE_ACCOUNT_EMAIL`: The IAM email for the robot account.
*   `GOOGLE_PRIVATE_KEY`: The private key for the service account.
*   `API_KEY`: Google Gemini API Key (for AI features).

### 3. 📄 Terms & Privacy
*   Update the Footer links in `App.tsx` to point to real "Privacy Policy" and "Terms of Service" pages.
*   Ensure you comply with Indian Education data regulations if storing student data (currently, this app only stores public college info).

---

## ☁️ Deployment Guide (Google Cloud Run)

We recommend **Google Cloud Run** because it is serverless, scales to zero (free when unused), and handles SSL certificates automatically.

### Step 1: Prepare Google Cloud Project
1.  **Create Project**: Go to [Google Cloud Console](https://console.cloud.google.com/) and create a new project (e.g., `direct-admission-prod`).
2.  **Enable APIs**: Enable "Cloud Run API", "Cloud Build API", and "Google Sheets API".
3.  **Service Account**: 
    *   Create a Service Account (`sheet-manager`).
    *   Download the JSON Key.
    *   Share your Google Sheet with the Service Account's email address (Editor access).

### Step 2: Build & Push Container
You need the Google Cloud CLI (`gcloud`) installed.

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project [YOUR_PROJECT_ID]

# Build the Docker image and save it to Google Container Registry
gcloud builds submit --tag gcr.io/[YOUR_PROJECT_ID]/direct-admission .
```

### Step 3: Deploy Service
Deploy the container with your secrets injected as Environment Variables.

*Note: For `GOOGLE_PRIVATE_KEY`, ensure you include the full string with `\n` or use Google Secret Manager for better security.*

```bash
gcloud run deploy direct-admission-app \
  --image gcr.io/[YOUR_PROJECT_ID]/direct-admission \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars GOOGLE_SHEET_ID="[YOUR_SHEET_ID]" \
  --set-env-vars GOOGLE_SERVICE_ACCOUNT_EMAIL="[YOUR_SA_EMAIL]" \
  --set-env-vars API_KEY="[YOUR_GEMINI_KEY]" \
  --set-env-vars GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### Step 4: Verify Domain Mapping (Optional)
1.  Go to Cloud Run Console > Manage Custom Domains.
2.  Add mapping for `www.direct-admission.com`.
3.  Update your DNS records (A/AAAA records) as provided by Google.
4.  SSL Certificates are provisioned automatically (takes ~15 mins).

---

## 🛠️ Local Development Setup

### 1. Prerequisites
*   Node.js (v18+)
*   Google Cloud Account (for Sheet API)

### 2. Configuration
Create a `.env` file in the root directory:

```env
# Google Sheet Config
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_robot_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# AI Config (Optional)
API_KEY=your_gemini_api_key

# Port
PORT=8080
```

### 3. Running the App
```bash
npm install
npm start
```
The app will run at `http://localhost:8080`.

---

## 👥 User Guide & Accessibility

### 1. Public Viewer (Students/Parents)
*   **Unified Search**: Search for Colleges and Courses simultaneously with text or voice.
    *   **Voice Search**: Click the microphone icon 🎙️ and speak (e.g., "Engineering colleges in West Bengal").
    *   **AI Search**: Click the sparkle icon ✨ to let AI interpret complex queries.
*   **Filters**:
    *   **View Type**: Toggle between "All", "Courses", or "Colleges".
    *   **Sort**: Organize results by Rating or Fees (Low/High).
*   **Interactions**:
    *   Click a **College Card** to see all courses offered by that institute in a detailed brochure view.
    *   Click a **Course Card** to see curriculum details, fees, and AI insights.
    *   **Rate**: Click stars to rate a college or course (Restricted to 1 vote per item per browser).

### 2. Admin User
*   **Login**: Use an email present in the `Users` database (e.g., `chandranathmondal@yahoo.com`).
*   **Dashboard Access**:
    *   **Manage Colleges**: Add new colleges with Logos (auto-resized), Location, and Rich Bio.
    *   **Manage Courses**: Add courses linked to specific colleges. Uses a Rich Text Editor for descriptions.
    *   **Manage Users**: Add other Admins or Editors.
    *   **Data Tools**:
        *   **Import**: Upload a `.xlsx` file to **overwrite** the database.
        *   **Export**: Download the full database as `.xlsx`.
        *   *Note: Import operations will trigger a system-wide data refresh.*

---

## 📁 Data Structure

The application automatically maps data to Columns in your Google Sheet. You can view/edit the sheet manually if needed.

| Sheet Name | Columns (Headers) | Description |
| :--- | :--- | :--- |
| **Colleges** | `id`, `name`, `location`, `state`, `logoUrl`, `description`, `rating`, `ratingCount` | Stores institute details. |
| **Courses** | `id`, `collegeId`, `courseName`, `fees`, `duration`, `description`, `rating`, `ratingCount` | Linked to colleges via `collegeId`. |
| **Users** | `email`, `name`, `role`, `avatar` | Access control list. |

*Note: The app expects these exact sheet names. If you delete the sheets, the server will recreate them on the next restart/sync.*