# Sistema de Hinos - Igreja

## Overview

This is a church hymn management system built with a modern React frontend and Express.js backend. The application allows users to browse different church organs (departments), view hymn collections, and play audio files. The system is designed to serve multiple church departments like Coral, Children's Ministry, Youth Groups, and more, each with their own hymn collections.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: Comprehensive shadcn/ui component system with Radix UI primitives

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: TSX for TypeScript execution

### Project Structure
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript types and database schema
- `migrations/` - Database migration files

## Key Components

### Database Schema
- **Users**: Basic user authentication with username/password
- **Organs**: Church departments/groups (Coral, Youth, Children, etc.)
- **Hymns**: Individual hymn records with titles, URLs, and organization

### Frontend Features
- **Home Page**: Grid of church organ cards for navigation
- **Hymn Lists**: Display hymns for each organ with play buttons
- **Audio Player**: Full-featured audio player with controls
- **Responsive Design**: Mobile-first approach with church-themed styling
- **Error Handling**: Toast notifications for user feedback

### Backend Features
- **RESTful API**: Structured API endpoints with `/api` prefix
- **Storage Interface**: Abstracted storage layer supporting both memory and database implementations
- **Request Logging**: Comprehensive request/response logging
- **Error Handling**: Centralized error handling middleware

## Data Flow

1. **Organ Selection**: Users select a church organ from the home page
2. **Hymn Loading**: Frontend loads hymn data from JSON files for the selected organ
3. **Audio Playback**: Users can play hymns directly in the browser
4. **Navigation**: Breadcrumb navigation and back buttons for intuitive UX

### Current Data Storage
- Hymn collections are stored as static JSON files in `client/src/data/hymns/`
- Each organ has its own JSON file with hymn metadata
- Audio files are referenced but stored separately (not in repository)

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React, React DOM
- **Component Library**: Radix UI primitives, shadcn/ui components
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form with Zod validation
- **Audio/Media**: Native HTML5 audio elements
- **Icons**: Lucide React icons

### Backend Dependencies
- **Web Framework**: Express.js
- **Database**: Drizzle ORM, Neon Database serverless driver
- **Session Management**: connect-pg-simple
- **Validation**: Zod schemas
- **Development**: TSX, TypeScript

### Development Tools
- **Build**: Vite, esbuild
- **Development**: Replit-specific plugins and tools
- **Linting**: TypeScript compiler checking

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- TSX for backend TypeScript execution
- Integrated development with Replit tooling

### Production Build
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server to `dist/index.js`
- Static asset serving through Express
- Database migrations through Drizzle Kit

### Environment Configuration
- Database URL required for PostgreSQL connection
- Environment-specific configuration through process.env
- Replit-specific development banner and cartographer integration

## Firebase Integration

### Firestore Structure
- **Collection**: `hinos`
- **Document Fields**:
  - `numero` (number): Auto-generated hymn number
  - `titulo` (string): Hymn title
  - `orgao` (string): Organ name (Coral, Crianças, etc.)
  - `audioPath` (string): Firebase Storage path to audio file
  - `criadoEm` (timestamp): Creation timestamp

### Firebase Storage Structure
- **Root folder**: `hinos/`
- Audio files are automatically named with pattern: `{organ}-{number}-{timestamp}.mp3`
- Ensure your Firebase Storage rules allow authenticated read/write
  or configure public uploads while testing. Also confirm the
  `storageBucket` value in `.env` matches your project bucket name.

### Offline Functionality
- App downloads all hymn data and audio URLs on first load
- Data stored in localStorage for offline access
- Connection status indicator shows online/offline state
- Automatic fallback to offline data when connection is lost

### Environment Variables Required
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Changelog
- July 08, 2025. Initial setup
- July 08, 2025. Added Firebase Firestore and Storage integration with offline support

## User Preferences
Preferred communication style: Simple, everyday language.