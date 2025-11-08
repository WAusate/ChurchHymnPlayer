# Sistema de Hinos - Igreja

## Overview
This project is a church hymn management system that allows users to browse different church departments (organs), view hymn collections, and play audio files. It is designed to serve multiple church departments, providing them with their own hymn collections. The system aims to offer a modern and accessible platform for managing and sharing hymns.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state
- **Build Tool**: Vite
- **UI Components**: shadcn/ui system with Radix UI primitives
- **Design Approach**: Mobile-first with church-themed styling.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Express sessions with PostgreSQL store

### Project Structure
- `client/` - React frontend
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript types and database schema

### Key Features
- **Database Schema**: Includes Users, Organs, and Hymns.
- **Frontend Features**: Home page with organ navigation, hymn lists with play buttons, a full-featured audio player, responsive design, and toast notifications for error handling.
- **Backend Features**: RESTful API with `/api` prefix, abstracted storage layer, request logging, and centralized error handling.
- **Data Flow**: Users select an organ, frontend loads hymn data (initially from JSON files, now integrated with Firebase), and audio playback occurs directly in the browser.
- **Authentication System**: Utilizes Firebase Auth for email/password authentication, providing protected routes (`/config`, `/admin`) for hymn management, while public read access is maintained for hymns.

## External Dependencies
### Frontend Dependencies
- **UI Framework**: React, React DOM
- **Component Library**: Radix UI, shadcn/ui
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React icons
- **Authentication**: Firebase Auth

### Backend Dependencies
- **Web Framework**: Express.js
- **Database**: Drizzle ORM, Neon Database serverless driver
- **Session Management**: connect-pg-simple
- **Validation**: Zod schemas
- **Authentication**: Firebase Admin SDK

### Development Tools
- **Build**: Vite, esbuild
- **Linting**: TypeScript compiler

### Firebase Integration
- **Firestore**: Used for hymn data storage (`hinos` collection with fields like `numero`, `titulo`, `orgao`, `audioPath`, `criadoEm`).
- **Firebase Storage**: Stores audio files for hymns, with a naming convention of `{organ}-{number}-{timestamp}.mp3`.
- **Authentication**: Firebase Auth for user login and protected actions.
- **Offline Functionality**: Downloads hymn data and audio URLs on first load, stores in localStorage for offline access, with connection status indication and automatic fallback.

## Troubleshooting

### CORS Error in Production (Firebase Storage)
**Symptom**: Hymns load forever in production, console shows CORS errors like "Access to fetch has been blocked by CORS policy"

**Cause**: Firebase Storage blocks cross-origin requests by default

**Solutions**:
1. **Quick Fix** - Make audio files public:
   - Go to Firebase Console → Storage
   - Click on `hinos/` folder → Edit Access → Set to Public
   
2. **Via Google Cloud Console**:
   - Access: https://console.cloud.google.com/storage/browser
   - Select bucket `app-hinos.appspot.com`
   - Go to Permissions → Add Principal
   - Add `allUsers` with role `Storage Object Viewer`

3. **Via Command Line** (requires Google Cloud SDK):
   ```bash
   gcloud auth login
   gcloud config set project app-hinos
   gsutil cors set cors.json gs://app-hinos.appspot.com
   ```

4. **Automated Script**:
   ```bash
   bash aplicar-cors.sh
   ```

**Required Security Rules**:
- Firestore: Allow public read, authenticated write for `hinos` collection
- Storage: Allow public read, authenticated write for `hinos/` folder

See `CORRIGIR_CORS_FIREBASE.md` for detailed instructions.