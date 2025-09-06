# Solution Gate Media — Onboarding Docs Builder

A modern React application for creating and managing onboarding documents with real-time collaboration features. Built with React, TypeScript, Tailwind CSS, Zustand, Supabase, and Puppeteer.

## Features

### 🏢 Multi-Tenant Architecture
- Company-specific data isolation
- User authentication and authorization
- Role-based access control

### 📄 Document Generation
- **Training Waiver & Liability Release**
- **Non-Compete Agreement**
- **Equipment, Gear & Supply Obligations**
- **Compensation Agreement**
- **Acceptance Letter**

### 🎨 Modern UI/UX
- Apple-inspired design with muted pastel colors
- Responsive layout
- Smooth animations and transitions
- Intuitive tabbed interface

### ⚡ Real-Time Collaboration
- Share documents with hirees via secure links
- Online signature capture
- Real-time updates
- Document preview and PDF generation

### 🔧 Advanced Features
- Digital signature capture with HTML5 Canvas
- CSV import/export for services and rates
- Tiered pricing system with validation
- Template customization
- Profile management with IndexedDB backup

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **PDF Generation**: Puppeteer
- **Icons**: Lucide React
- **Deployment**: Vercel (Production), Localhost (Development)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sgm-onboarding-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql`
   - Get your project URL and anon key

4. **Configure environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## Supabase Setup

### 1. Database Schema
Run the SQL commands from `supabase-schema.sql` in your Supabase SQL editor to create all necessary tables, policies, and indexes.

### 2. Storage Buckets
The schema automatically creates two storage buckets:
- `company-assets` - For company logos
- `signatures` - For digital signatures

### 3. Authentication
- Enable email authentication in Supabase Auth settings
- Configure email templates if needed
- Set up password reset redirects

### 4. Row Level Security (RLS)
All tables have RLS enabled with policies that ensure users can only access their own data.

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   ├── tabs/           # Tab components for each section
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts
├── lib/                # Utility functions and services
├── store/              # Zustand stores
├── types/              # TypeScript type definitions
└── App.tsx             # Main application component
```

## Key Components

### State Management (Zustand)
- `useAppStore` - Main application state
- Centralized state for all tabs and data
- Persistent state with localStorage backup

### Authentication
- Supabase Auth integration
- Protected routes
- User session management

### PDF Generation
- Puppeteer-based PDF generation
- High-quality document output
- Custom styling and formatting

### Real-Time Features
- Supabase real-time subscriptions
- Live updates across sessions
- Collaborative editing

## Usage

### 1. Company Setup
- Enter company information
- Upload company logo
- Set jurisdiction

### 2. Hiree Information
- Add hiree personal details
- Set dates and contact information

### 3. Services Configuration
- **Flat Services**: Fixed-rate services
- **Tiered Services**: Square footage-based pricing
- Import/export CSV data

### 4. Equipment Requirements
- Define required gear items
- Manage equipment lists

### 5. Offer Details
- Configure offer letter information
- Set probation periods
- Add manager details

### 6. Templates
- Customize document clauses
- Add addendums and notes
- Reset to defaults

### 7. Digital Signatures
- Capture hiree signatures
- Capture company signatures
- Clear and re-sign

### 8. Data Management
- Save profiles to Supabase
- Load existing profiles
- Duplicate profiles
- Quick save/load

### 9. Document Generation
- Preview documents
- Generate PDFs
- Share with hirees

## Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Set environment variables**
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Other Platforms
- Netlify
- Railway
- Render
- Any platform supporting Node.js

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component-based architecture

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software for Solution Gate Media.

## Support

For support and questions, contact the development team.

---

**Built with ❤️ for Solution Gate Media**