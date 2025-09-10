# Overview

SecureYT is a security-focused YouTube video management application that provides controlled access to specific YouTube channels through multi-factor authentication. The application allows users to configure approved YouTube channels and implements a multi-step verification process (password + phone verification + voice verification) to grant temporary access to channel content. It's built as a full-stack application with a React frontend and Express backend, using PostgreSQL for data persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with a custom dark theme and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Framework**: Express.js with TypeScript for the REST API server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with bcrypt for password hashing
- **API Design**: RESTful API endpoints for user management, settings, video data, and security verification
- **Storage Interface**: Abstract storage interface pattern allowing for both in-memory (development) and database (production) implementations

## Database Schema
- **Users Table**: Stores user credentials (id, username, hashed password)
- **Settings Table**: User-specific configuration including allowed channel details, security settings, and phone numbers
- **Temporary Access Table**: Manages time-limited access tokens with verification words
- **Videos Table**: Caches YouTube video metadata for approved channels

## Security Architecture
- **Multi-Factor Authentication**: Three-layer verification system
  1. Password verification against stored hash
  2. Phone verification via SMS (Twilio integration)
  3. Voice verification with random verification words
- **Temporary Access**: Time-limited access tokens with configurable duration
- **Channel Restrictions**: Users can only access videos from pre-approved YouTube channels

## Data Flow
- Users configure approved YouTube channels and security settings
- Video data is fetched from YouTube API and cached in the database
- Access requests trigger the multi-step verification process
- Successful verification grants temporary access to cached video content
- Videos are displayed in a grid layout with embedded YouTube player

# External Dependencies

## Third-Party Services
- **YouTube Data API v3**: For fetching channel video metadata and content
- **Twilio**: SMS service for phone number verification during security challenges
- **Neon Database**: Serverless PostgreSQL hosting (indicated by @neondatabase/serverless dependency)

## Key Libraries
- **Database**: Drizzle ORM with PostgreSQL adapter for type-safe database operations
- **Authentication**: bcrypt for secure password hashing
- **UI Components**: Extensive Radix UI component library for accessible primitives
- **Validation**: Zod for runtime type validation and schema definitions
- **HTTP Client**: Native fetch API wrapped in custom query client
- **Development**: Vite with React plugin and Replit-specific tooling for cloud development

## API Integrations
- **YouTube API**: Requires API key for accessing channel and video data
- **Twilio SMS**: Requires account SID, auth token, and phone number for SMS verification
- **PostgreSQL**: Requires database URL for connection (configured via environment variables)