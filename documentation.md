# VibeVault - Universal Media Rating & Social Matching Platform

## Project Overview

VibeVault is a comprehensive media discovery and social matching platform that combines the functionality of popular rating platforms (MyAnimeList, IMDb, Goodreads) with social matching features similar to Tinder. Users can rate and track their favorite anime, movies, TV shows, and books, then find matches with people who share similar media preferences.

## Core Concept

**"All Your Media Ratings in One Place + Find Your Perfect Media Match"**

VibeVault serves as a unified platform where users can:
- Rate and track anime, movies, TV shows, and books in one centralized location
- Discover new media through comprehensive search and filtering
- Get matched with other users based on shared media preferences and ratings
- Build connections through common interests in entertainment

## Key Features

### 🎬 Universal Media Library
- **Multi-Platform Integration**: Supports anime (Shikimori API), movies/shows (TMDB API), and books (Open Library API)
- **Comprehensive Rating System**: 5-star rating system with status tracking (watching, completed, dropped, etc.)
- **Personal Library Management**: Track your progress, add reviews, and organize your media consumption
- **Advanced Search & Discovery**: Search across all media types with sorting options (popularity, rating, release date, etc.)

### 💕 Social Matching System
- **Compatibility Algorithm**: Matches users based on shared media preferences and rating patterns
- **Match Percentage**: Calculates compatibility scores based on common media and rating similarities
- **Detailed Match Insights**: View shared favorites and rating comparisons with potential matches
- **Progressive Matching**: The more you rate, the better your matches become

### 🔍 Media Discovery
- **Cross-Platform Search**: Unified search across anime, movies, TV shows, and books
- **Personalized Recommendations**: Discover new content based on your rating history
- **Trending Content**: Stay updated with popular and highly-rated media
- **Genre-Based Filtering**: Find content that matches your specific interests

### 👥 Social Features
- **User Profiles**: Showcase your media preferences and statistics
- **Match Communication**: Connect with users who share your taste
- **Community Insights**: See what others with similar preferences are watching/reading

## Technical Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript for type safety
- **State Management**: Redux Toolkit for centralized state management
- **UI Framework**: Material-UI (MUI) for consistent design system
- **Routing**: React Router for navigation
- **API Integration**: Centralized API configuration with automatic environment detection

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js framework
- **Database**: Prisma ORM with database abstraction
- **Authentication**: JWT-based authentication system
- **Real-time Features**: Socket.IO for live updates and messaging
- **External APIs**: Integration with Shikimori, TMDB, and Open Library APIs

### Key Technologies
- **Frontend**: React, TypeScript, Redux Toolkit, Material-UI, Axios
- **Backend**: Node.js, Express, Prisma, Socket.IO, JWT
- **Database**: PostgreSQL/MySQL (via Prisma)
- **External APIs**: Shikimori (Anime), TMDB (Movies/Shows), Open Library (Books)

## Project Structure

```
VibeVault/
├── vibe-vault/                 # Frontend React Application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Main application pages
│   │   │   ├── Explore/       # Media discovery and search
│   │   │   ├── match/         # User matching interface
│   │   │   └── my-vibe/       # Personal media library
│   │   ├── redux/             # State management
│   │   ├── config/            # API configuration
│   │   └── theme/             # UI theming
│   └── package.json
├── VibeVault-Server/          # Backend API Server
│   ├── src/
│   │   ├── controller/        # API route handlers
│   │   ├── routes/            # API route definitions
│   │   ├── services/          # Business logic services
│   │   ├── middleware/        # Authentication & validation
│   │   └── socket/            # Real-time communication
│   └── package.json
└── documentation.md           # This file
```

## Core Functionality

### Media Management
1. **Search & Discovery**: Users can search across all media types with advanced filtering
2. **Rating System**: 5-star rating system with status tracking (watching, completed, etc.)
3. **Personal Library**: Centralized location for all rated and tracked media
4. **Progress Tracking**: Track episodes watched, pages read, etc.

### Matching Algorithm
1. **Preference Analysis**: Analyzes user's rating patterns and media preferences
2. **Compatibility Scoring**: Calculates match percentages based on shared interests
3. **Common Media Identification**: Identifies shared favorites between users
4. **Match Ranking**: Prioritizes matches based on compatibility scores

### User Experience
1. **Unified Interface**: Single platform for all media types
2. **Responsive Design**: Works seamlessly across desktop and mobile devices
3. **Real-time Updates**: Live notifications for new matches and messages
4. **Personalized Dashboard**: Customized experience based on user preferences

## API Integration

### External APIs
- **Shikimori API**: Anime data, ratings, and metadata
- **TMDB API**: Movie and TV show information, ratings, and images
- **Open Library API**: Book data, ratings, and cover images

### Internal API Structure
- **Authentication**: `/auth` - User registration, login, token management
- **Media**: `/media` - External API integration and data fetching
- **User Media**: `/myMedia` - Personal library management
- **Matching**: `/matches` - User matching and compatibility
- **Profile**: `/profile` - User profile management
- **Social**: `/connections` - User interactions and messaging

## Development Status

### Completed Features
✅ Multi-platform media search and discovery
✅ User authentication and profile management
✅ Personal media library with rating system
✅ User matching based on media preferences
✅ Responsive UI with Material Design
✅ Centralized API configuration
✅ Real-time communication infrastructure

### Current Architecture
- Frontend: React + TypeScript with Redux state management
- Backend: Node.js + Express with Prisma ORM
- Database: Relational database with user, media, and matching tables
- APIs: Integrated with major media databases

## Future Enhancements

### Planned Features
- **Enhanced Matching**: More sophisticated compatibility algorithms
- **Social Features**: User reviews, recommendations, and discussions
- **Mobile App**: Native mobile applications for iOS and Android
- **Advanced Analytics**: Detailed insights into viewing/reading habits
- **Group Features**: Create and join media-focused communities
- **Recommendation Engine**: AI-powered content suggestions

### Technical Improvements
- **Performance Optimization**: Caching and database query optimization
- **Scalability**: Microservices architecture for better scalability
- **Testing**: Comprehensive test coverage for reliability
- **Monitoring**: Advanced logging and performance monitoring

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Database (PostgreSQL/MySQL)

### Installation
1. Clone the repository
2. Install frontend dependencies: `cd vibe-vault && npm install`
3. Install backend dependencies: `cd VibeVault-Server && npm install`
4. Configure environment variables
5. Run database migrations
6. Start development servers

### Development
- Frontend: `npm run dev` (runs on http://localhost:5173)
- Backend: `npm run dev` (runs on http://localhost:3200)

## Contributing

VibeVault is designed to be a comprehensive solution for media enthusiasts who want to:
- Keep track of all their entertainment in one place
- Discover new content based on their preferences
- Connect with like-minded individuals who share their taste
- Build meaningful connections through shared media experiences

The platform bridges the gap between media consumption tracking and social discovery, creating a unique ecosystem where entertainment preferences become the foundation for meaningful connections.