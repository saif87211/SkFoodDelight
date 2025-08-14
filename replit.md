# Overview

FoodieHub is a full-stack food delivery application built with React, Express, and PostgreSQL. The application allows users to browse food categories and products, add items to their cart, place orders, and track order status. It features a modern UI built with shadcn/ui components and a flexible authentication system that works with multiple providers (Replit, Google, GitHub) to avoid vendor lock-in.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Replit's OIDC-based authentication system with session management
- **API Design**: RESTful API endpoints with consistent error handling and logging middleware

## Database Design
- **Primary Database**: PostgreSQL with Neon serverless connection pooling
- **Schema Management**: Drizzle Kit for migrations and schema synchronization
- **Core Tables**:
  - Users table for Replit auth integration
  - Categories and Products for the food catalog
  - Cart items for shopping cart functionality
  - Orders and order items for transaction management
  - Sessions table for authentication state persistence

## Authentication & Authorization
- **JWT-Based Authentication**: Secure JSON Web Token authentication with bcrypt password hashing
- **Complete Vendor Independence**: No reliance on OAuth providers - works on any hosting platform
- **Token Storage**: JWT tokens stored in browser localStorage with automatic header injection
- **Security**: Secure password hashing with bcryptjs and configurable token expiration
- **Access Control**: JWT middleware protecting sensitive API endpoints
- **Universal Deployment**: Works on Vercel, Netlify, Railway, AWS, DigitalOcean, and any Node.js hosting

## Data Flow & API Structure
- **Client-Server Communication**: Fetch-based API requests with automatic error handling
- **Query Management**: React Query handles caching, background updates, and optimistic updates
- **Error Handling**: Centralized error handling with user-friendly notifications
- **Form Validation**: Client-side validation with Zod schemas mirrored on the server

## Development & Build Process
- **Build Tool**: Vite for fast development and optimized production builds
- **TypeScript**: Strict type checking across frontend, backend, and shared schemas
- **Hot Reload**: Development server with HMR for both client and server code
- **Path Aliases**: Configured aliases for clean imports (@/ for client, @shared for shared code)

# External Dependencies

## Database & Storage
- **Neon Database**: Serverless PostgreSQL with WebSocket connections for real-time capabilities
- **Drizzle ORM**: Type-safe database operations with automatic migrations

## Authentication Services
- **Replit Authentication**: OIDC-based authentication with automatic user provisioning
- **Session Management**: PostgreSQL session store for persistent login state

## UI & Styling Libraries
- **Radix UI**: Accessible component primitives for complex UI patterns
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Consistent icon library for UI elements

## Development Tools
- **TypeScript**: Type safety across the entire application stack
- **Vite**: Modern build tool with fast development server and optimized production builds
- **React Query**: Server state management with intelligent caching and synchronization

## Runtime Dependencies
- **Express.js**: Web application framework with middleware ecosystem
- **React 18**: Modern React with concurrent features and improved performance
- **Node.js**: JavaScript runtime with ES modules support