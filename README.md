# Direct-Admission - India's College Finder 🎓

**Version:** 1.0.0

A premier portal for direct college admissions and curriculum discovery across India. Features AI-powered search, comprehensive filtering, and administrative tools.

---

## 📖 Table of Contents

1. [Overview](#-overview)
2. [Features](#-features)
3. [Architecture & Strategy](#-architecture--strategy)
4. [Prerequisites](#-prerequisites)
5. [Environment Variables](#-environment-variables)
6. [Local Development](#-local-development)
    - [Using NPM](#using-npm)
    - [Using Docker](#using-docker)
    - [Using Makefile](#using-makefile)
7. [Testing](#-testing)
8. [Deployment Guide](#-deployment-guide)
    - [Container Build Strategy](#container-build-strategy)
    - [Secrets Management](#secrets-management)
    - [Staging: GCP Cloud Run](#staging-google-cloud-run-gcp)
    - [Production: AWS App Runner](#production-aws-app-runner)
9. [Troubleshooting](#-troubleshooting)

---

## 🚀 Overview

Direct-Admission connects students directly with institution administrations, bypassing agents. It uses a Google Sheet as a database for easy content management and leverages Google Gemini AI for intelligent search and summarization.

## ✨ Features

*   **Unified Search**: Search for Colleges and Courses simultaneously using text or voice.
    *   **Voice Search**: Click the microphone icon 🎙️.
    *   **AI Search**: Click the sparkle icon ✨ to parse complex queries (e.g., "Cheapest engineering colleges in West Bengal").
*   **Role-Based Access**:
    *   **Admin**: Full access to manage Colleges, Courses, and Users.
    *   **Editor**: Can edit content but cannot delete items.
    *   **Viewer**: Read-only access to the dashboard.
*   **Secure Authentication**: Google OAuth 2.0 integration.
*   **AI Insights**: Real-time summaries of college bios and course descriptions using Google Gemini.
*   **Excel Integration**: Bulk Import/Export capabilities for large datasets.
*   **Cloud Sync**: Automated synchronization with a Google Sheet backend.

## 🏗 Architecture & Strategy

We employ a **multi-cloud deployment strategy** to ensure redundancy and leverage best-in-class services.

### Environments
*   **Staging (GCP)**: Deployed on **Google Cloud Run**. The container image is pulled from **Docker Hub**.
*   **Production (AWS)**: Deployed on **AWS App Runner**. The container image is pulled from **Amazon ECR**.

### Data Persistence
The application uses **Google Sheets** as its primary database (via a Service Account). This allows non-technical administrators to view or modify data directly in a spreadsheet if needed, while the app maintains a synchronized in-memory cache for high performance.

### Secrets Management
We strictly avoid hardcoding sensitive keys.
*   **Staging**: Secrets are stored in **GCP Secret Manager**.
*   **Production**: Secrets are stored in **AWS Secrets Manager**.
*   **Local**: Secrets are loaded from a `.env` file (git-ignored).

---

## 🛑 Prerequisites

Before running the application, ensure you have the following:

### 1. Google OAuth 2.0 Credentials
Required for the "Sign in with Google" functionality.
1.  Go to [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **Credentials**.
2.  Create **OAuth Client ID** (Web Application).
3.  Add Authorized Origins: `http://localhost:3000`, `http://localhost:8080`, and your deployment URLs.
4.  Copy the **Client ID**.

### 2. Google Service Account
Required for database (Google Sheets) access.
1.  Create a Service Account in IAM & Admin.
2.  Download the JSON Key file.
3.  **Important**: Share your target Google Sheet with the Service Account email (give Editor access).
4.  Note the **Sheet ID** from the URL.

### 3. Google Gemini API Key
Required for AI features.
1.  Get a key from [Google AI Studio](https://aistudio.google.com/).

---

## 🔑 Environment Variables

The application requires specific variables at **Build Time** (Frontend) and **Run Time** (Backend).

### Frontend Variables (Build Time)
*These must be passed as build arguments (docker) or defined in `.env` (local).*

| Variable | Description | Required |
| :--- | :--- | :--- |
| `REACT_APP_GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID for login. | **Yes** |

### Backend Variables (Run Time)
*These are injected into the running container or process.*

| Variable | Description | Required |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-side key for calling Gemini API. | **Yes** |
| `GOOGLE_SHEET_ID` | The ID of the database Google Sheet. | **Yes** |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The service account email address. | **Yes** |
| `GOOGLE_PRIVATE_KEY` | The full private key block. Handle newlines with `\n`. | **Yes** |
| `PORT` | Server port (default: 8080). | No |

---

## 💻 Local Development

You can run the application using NPM directly, Docker, or Make.

### Configuration
Create a `.env` file in the root directory:
```env
# Frontend
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Backend
GEMINI_API_KEY=AIzaSy...
GOOGLE_SHEET_ID=1A2B3C...
GOOGLE_SERVICE_ACCOUNT_EMAIL=my-bot@my-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```

### Using NPM

**Option A: Quick Iterate (Build & Serve)**
Best for testing the final production build locally.
```bash
npm install
npm run build
npm run start
# Open http://localhost:8080
```

**Option B: Live Development (Hot Reload)**
Best for UI development. Runs frontend (port 3000) and backend (port 8080) separately.
```bash
# Terminal 1 (Frontend)
npm install
npm run dev

# Terminal 2 (Backend)
PORT=8080 node server.js
```

### Using Docker

**Using Docker Compose** (Reads `.env` automatically)
```bash
docker compose up --build -d
docker compose logs -f
# Open http://localhost:8080
```

**Using Docker Run**
```bash
docker build -t direct-admission:local .
docker run --rm -d --env-file .env -p 8080:8080 direct-admission:local
```

### Using Makefile
For Mac/Linux users, we provide a Makefile for convenience:
*   `make install`: Install dependencies.
*   `make dev`: Run frontend and backend in parallel.
*   `make build`: Build the frontend.
*   `make start`: Start the production server.
*   `make compose-up`: Run with docker-compose.
*   `make e2e`: Run E2E tests.

---

## 🧪 Testing

The project includes unit tests and E2E tests using Playwright.

**Run Unit Tests:**
```bash
npm test
```

**Run E2E Tests:**
1.  Start the app (e.g., `docker compose up -d`).
2.  Install Playwright browsers: `npx playwright install`.
3.  Run tests:
    ```bash
    npm run test:e2e
    ```

---

## 🚢 Deployment Guide

### Secrets Management
For both GCP and AWS, **do not** embed secrets in the `Dockerfile` or source code.
*   **Local**: Use `.env` (git-ignored).
*   **Staging (GCP)**: Create secrets in **Secret Manager**. Map them to environment variables in Cloud Run.
*   **Production (AWS)**: Create secrets in **AWS Secrets Manager**. Reference them in the App Runner configuration.

### Container Build Strategy
Since React environment variables (`REACT_APP_*`) are embedded at **build time**, you must build environment-specific images if these values differ between Staging and Prod (e.g., different OAuth Client IDs).

### Staging: Google Cloud Run (GCP)
**Registry:** Docker Hub (`docker.io`)

1.  **Build & Push to Docker Hub**:
    ```bash
    # Login to Docker Hub
    docker login

    # Build with Staging Args
    docker build -t index.docker.io/[YOUR_DOCKERHUB_USER]/direct-admission:staging \
      --build-arg REACT_APP_GOOGLE_CLIENT_ID="[STAGING_CLIENT_ID]" \
      .

    # Push Image
    docker push index.docker.io/[YOUR_DOCKERHUB_USER]/direct-admission:staging
    ```

2.  **Deploy to Cloud Run**:
    ```bash
    gcloud run deploy direct-admission-staging \
      --image index.docker.io/[YOUR_DOCKERHUB_USER]/direct-admission:staging \
      --region us-central1 \
      --set-env-vars GOOGLE_SHEET_ID="[SHEET_ID]" \
      # Map other secrets via Secret Manager references in UI or CLI
    ```

### Production: AWS App Runner
**Registry:** Amazon ECR

1.  **Push to ECR**:
    Authenticate and push your Docker image to Amazon Elastic Container Registry (ECR).
    ```bash
    # Login to ECR
    aws ecr get-login-password --region [REGION] | docker login --username AWS --password-stdin [AWS_ACCOUNT_ID].dkr.ecr.[REGION].amazonaws.com

    # Build with Production Args
    docker build -t [AWS_ACCOUNT_ID].dkr.ecr.[REGION].amazonaws.com/direct-admission:prod \
      --build-arg REACT_APP_GOOGLE_CLIENT_ID="[PROD_CLIENT_ID]" \
      .

    # Push Image
    docker push [AWS_ACCOUNT_ID].dkr.ecr.[REGION].amazonaws.com/direct-admission:prod
    ```

2.  **Create Service in App Runner**:
    *   **Source**: Container Registry (ECR).
    *   **Image**: Select the image pushed above.
    *   **Deployment Settings**: Automatic.

3.  **Configure Runtime**:
    *   **Port**: 8080.
    *   **Environment Variables**: Add non-sensitive vars (`GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`).

4.  **Secrets Integration**:
    *   Store `GEMINI_API_KEY` and `GOOGLE_PRIVATE_KEY` in **AWS Secrets Manager**.
    *   In App Runner Service Configuration, create an instance role with permission to access Secrets Manager.
    *   Reference the secrets as environment variables in the App Runner console using the ARN or secret name.

---

## 🔧 Troubleshooting

*   **Login Fails**: Ensure `REACT_APP_GOOGLE_CLIENT_ID` matches the one in Google Cloud Console and that the origin (e.g., `https://myapp.awsapprunner.com`) is authorized.
*   **AI Search Not Working**: Check server logs for `GEMINI_API_KEY` errors. Ensure the backend has internet access.
*   **Database Not Syncing**: Check `GOOGLE_SERVICE_ACCOUNT_EMAIL` has Editor access to the Sheet. Verify `GOOGLE_PRIVATE_KEY` is formatted correctly (newlines must be real newlines or escaped `\n`).
*   **Docker Build Fails**: Ensure build args are passed correctly (`--build-arg`).
*   **Blank UI**: Did you run `npm run build`? The backend serves the `build/` folder.
