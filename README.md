
# Direct-Admission - India's College Finder 🎓

A premier portal for direct college admissions and curriculum discovery across India. Features AI-powered search, comprehensive filtering, and administrative tools.

## 🚀 Features

*   **Unified Search**: Search for Colleges and Courses simultaneously with text or voice.
    *   **Voice Search**: Click the microphone icon 🎙️ and speak.
    *   **AI Search**: Click the sparkle icon ✨ to let AI interpret complex queries.
*   **Secure Authentication**: Real Google Sign-In (OAuth 2.0) for administrators.
*   **Smart Filtering**: Filter by State, Type (Course/College), and Sort by Fees/Rating.
*   **AI Insights**: Get instant summaries using Google Gemini AI.
*   **Admin Dashboard**: Manage Colleges, Courses, and Users via a secure interface.
*   **Excel Integration**: Bulk Import/Export entire databases.
*   **Cloud Sync**: Data is stored securely in a Google Sheet using a Service Account.

---

## 🛑 Pre-Go-Live Checklist

### 1. 🔑 Generate Google OAuth Credentials
To enable the "Sign in with Google" button:

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Navigate to **APIs & Services** > **Credentials**.
3.  Click **Create Credentials** > **OAuth client ID**.
4.  Application Type: **Web application**.
5.  **Authorized JavaScript origins**:
    *   `http://localhost:3000` (for local testing)
    *   `https://your-cloud-run-url.a.run.app` (your deployed URL)
6.  Copy the **Client ID** (e.g., `123...apps.googleusercontent.com`).
7.  Pass this as `REACT_APP_GOOGLE_CLIENT_ID`.

### 2. 🤖 Setup Service Account
To enable database storage (Google Sheets):

1.  Create a Service Account in IAM & Admin.
2.  Download the JSON Key file.
3.  Share your Google Sheet with the Service Account email (Editor access).
4.  Copy the **Sheet ID** from your Google Sheet URL.

### 3. ✨ Get Gemini API Key
To enable AI search and summaries:

1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Get an API Key.
3.  This key will be passed to the **Backend Server** (it is safe from public view).

---

## 🔑 Environment Variables Reference

#### Frontend Variables (React - Build Time)
*These must be provided during the build process.*

| Variable Name | Description | Required? |
| :--- | :--- | :--- |
| `REACT_APP_INITIAL_ADMIN_EMAIL` | **Seed Admin Email**. Used to bootstrap the first user if the database is empty. Once logged in, this admin can add other users via the dashboard. | Yes |
| `REACT_APP_GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID for Login. | Yes |

#### Backend Variables (Node.js - Runtime)
*These must be provided to the running container.*

| Variable Name | Description | Required? |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API Key for AI features. | Yes |
| `GOOGLE_SHEET_ID` | The ID of your Google Sheet database. | Yes |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | IAM Email of the Service Account. | Yes |
| `GOOGLE_PRIVATE_KEY` | The Private Key block from the JSON key file. | Yes |
| `PORT` | Server Port (Default: 8080). | No |

---

## ☁️ Deployment Guide (Google Cloud Run)

### Step 1: Build Container
Since React environment variables are baked in at build time, you must pass them using `--build-arg`.

```bash
# Login
gcloud auth login
gcloud config set project [YOUR_PROJECT_ID]

# Build Image
gcloud builds submit \
  --tag gcr.io/[YOUR_PROJECT_ID]/direct-admission \
  --build-arg REACT_APP_INITIAL_ADMIN_EMAIL="[YOUR_EMAIL]" \
  --build-arg REACT_APP_GOOGLE_CLIENT_ID="[YOUR_OAUTH_CLIENT_ID]" \
  .
```

### Step 2: Deploy Service
Inject Backend secrets at runtime using `--set-env-vars`.

*Note: For `GOOGLE_PRIVATE_KEY`, ensure you include the full string with `\n` or use Google Secret Manager.*

```bash
gcloud run deploy direct-admission-app \
  --image gcr.io/[YOUR_PROJECT_ID]/direct-admission \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars GEMINI_API_KEY="[YOUR_GEMINI_KEY]" \
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
    REACT_APP_INITIAL_ADMIN_EMAIL=your-email@gmail.com
    REACT_APP_GOOGLE_CLIENT_ID=123...apps.googleusercontent.com
    
    # Backend
    GEMINI_API_KEY=xyz...
    GOOGLE_SHEET_ID=abc...
    GOOGLE_SERVICE_ACCOUNT_EMAIL=bot@...
    GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
    ```
3.  **Run**:
    ```bash
    npm start
    ```
