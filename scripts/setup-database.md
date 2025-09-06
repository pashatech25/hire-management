# Database Setup Instructions

## 1. Supabase Project Setup

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or use your existing project
3. Note down your project URL and anon key

## 2. Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run** to execute the schema

## 3. Set up Storage Buckets

The schema automatically creates storage buckets, but you may need to configure them:

1. Go to **Storage** in your Supabase dashboard
2. Verify these buckets exist:
   - `company-assets` (public)
   - `signatures` (public)

## 4. Configure Authentication

1. Go to **Authentication** > **Settings**
2. Enable **Email** authentication
3. Configure email templates if needed
4. Set up password reset redirects

## 5. Test the Application

1. Start the development server: `npm run dev`
2. Open http://localhost:5173
3. Try to sign up with a new account
4. Test the application features

## 6. Environment Variables

Make sure your `.env.local` file contains:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 7. Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your Supabase project allows your domain
2. **RLS Errors**: Check that Row Level Security policies are correctly set up
3. **Storage Errors**: Verify storage buckets exist and are public
4. **Auth Errors**: Check authentication settings and email configuration

### Debug Steps:

1. Check browser console for errors
2. Check Supabase logs in the dashboard
3. Verify environment variables are loaded
4. Test database connection in Supabase dashboard
