# Asteroid AI Application

A Next.js-powered AI search and research application with user authentication and search history management.

## Features

- **User Authentication** - Secure sign-in/sign-up with Clerk
- **AI-Powered Search** - Search and research capabilities
- **Search History** - Save and manage your search queries
- **Modern UI** - Built with shadcn/ui components and Tailwind CSS
- **Responsive Design** - Works on all devices
- **Database Storage** - Powered by Supabase

## Tech Stack

- **Framework**: Next.js 15
- **Authentication**: Clerk
- **Database**: Supabase
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Prerequisites

Before you begin, ensure you have the following:

- Node.js 18+ installed
- npm or yarn package manager
- A Clerk account (for authentication)
- A Supabase account (for database)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd asteroid
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy the environment variables template:

```bash
cp .env.example .env.local
```

Fill in your environment variables in `.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key_here
```

#### Getting Your Keys:

**Clerk:**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application or use existing one
3. Copy your Publishable Key and Secret Key

**Supabase:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Go to Settings > API
4. Copy your Project URL and anon public key

### 4. Database Setup

Create the required tables in your Supabase project:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Library table for search history
CREATE TABLE Library (
  id SERIAL PRIMARY KEY,
  searchInput TEXT,
  userEmail TEXT,
  type TEXT,
  libId TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── _components/       # Reusable components
│   ├── discover/          # Discover page
│   ├── library/            # Library page
│   ├── search/[libId]/     # Dynamic search results page
│   ├── layout.js           # Root layout
│   └── page.js             # Home page
├── components/ui/          # shadcn/ui components
├── context/               # React contexts
├── hooks/                 # Custom hooks
├── lib/                   # Utility functions
├── services/              # External service integrations
└── public/                # Static assets
```

## Key Features Explained

### Authentication
- Uses Clerk for secure authentication
- Sign in, sign up, and user management
- Protected routes with middleware

### Search Functionality
- Two search modes: Search and Research
- Search history saved to database
- AI model selection dropdown

### User Library
- View all past searches
- Delete search history
- Navigate back to search results

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure all environment variables are set correctly
2. **Authentication Issues**: Verify Clerk keys are correct
3. **Database Issues**: Check Supabase connection and table structure
4. **Import Errors**: Run `npm install` to ensure all dependencies are installed

### Environment Variables Not Working
- Ensure your `.env.local` file is in the root directory
- Restart the development server after adding environment variables
- Check that variable names match exactly

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue in the repository.
