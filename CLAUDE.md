# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack note-taking application with a React + Vite frontend and a NestJS backend. The application supports categorized notes with color coding, pinning, and search functionality.

## Architecture

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: SQLite with TypeORM
- **Port**: 3000
- **Database File**: `mynotes.db` (auto-created in backend root)

**Key Modules**:
- `NotesModule`: Handles note CRUD operations, pinning, and reordering
- `CategoriesModule`: Manages note categories

**Entities**:
- `Note`: Stores notes with title, content, color, isPinned flag, order, category relationship, and timestamps
- `Category`: Stores categories with name, icon, and color; has one-to-many relationship with notes (onDelete: SET NULL)

**API Endpoints**:
- Notes: `GET /notes`, `GET /notes/pinned`, `POST /notes`, `PATCH /notes/:id`, `PATCH /notes/reorder`, `DELETE /notes/:id`
- Categories: `GET /categories`, `POST /categories`, `DELETE /categories/:id`

**Configuration**:
- CORS enabled for all origins (configured for local network testing)
- Global validation pipe enabled with whitelist and transform
- TypeORM synchronize mode is ON (development only - auto-creates tables)

### Frontend (React + Vite)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **API Client**: Axios
- **API URL**: Dynamically constructed as `http://${window.location.hostname}:3000`

**Component Structure**:
- `App.tsx`: Main component managing global state (notes, categories, filters, theme)
- `Header`: Search bar, theme toggle, mobile menu button
- `Sidebar`: Category navigation and pinned notes filter
- `AddNote`: Form to create new notes
- `NotesGrid`: Displays filtered notes
- `NoteCard`: Individual note display with pin/delete actions

**State Management**:
- Local state with hooks in App.tsx
- Theme persisted to localStorage
- Automatic dark mode detection based on system preference

**Key Features**:
- Client-side filtering by category, search query, and pinned status
- Theme switching (light/dark) with localStorage persistence
- Responsive design with mobile sidebar overlay

## Development Commands

### Backend
```bash
cd backend
npm install              # Install dependencies
npm run start:dev        # Start development server with watch mode
npm run build            # Build for production
npm run start:prod       # Start production server
npm run lint             # Lint TypeScript files
npm run format           # Format code with Prettier
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:cov         # Run tests with coverage
npm run test:e2e         # Run end-to-end tests
```

### Frontend
```bash
cd frontend
npm install              # Install dependencies
npm run dev              # Start development server
npm run build            # Build for production (TypeScript check + Vite build)
npm run preview          # Preview production build
npm run lint             # Lint with ESLint
```

## Testing

### Backend
- Test files: `src/**/*.spec.ts`
- Jest configuration is in package.json
- Root directory for tests: `src`
- E2E test config: `test/jest-e2e.json`

### Frontend
- No test setup currently configured

## Important Notes

- The backend database file (`mynotes.db`) is created automatically on first run
- TypeORM `synchronize: true` is enabled - this auto-creates/updates tables based on entities (should be disabled in production)
- CORS is configured to allow all origins for local network testing
- The frontend API URL uses `window.location.hostname` to support running on different network addresses
- Both frontend and backend use ESLint for linting (backend also has Prettier configured)
