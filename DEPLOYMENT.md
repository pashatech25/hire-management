# Deployment Guide

## Vercel Deployment (Recommended)

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

### 4. Set Environment Variables
In your Vercel dashboard:
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add:
   - `VITE_SUPABASE_URL` = your_supabase_project_url
   - `VITE_SUPABASE_ANON_KEY` = your_supabase_anon_key

### 5. Redeploy
```bash
vercel --prod
```

## Netlify Deployment

### 1. Build the project
```bash
npm run build
```

### 2. Deploy to Netlify
1. Drag and drop the `dist` folder to Netlify
2. Or connect your GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`

### 3. Set Environment Variables
In Netlify dashboard:
1. Go to **Site settings** > **Environment variables**
2. Add your Supabase credentials

## Railway Deployment

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login and Deploy
```bash
railway login
railway init
railway up
```

### 3. Set Environment Variables
```bash
railway variables set VITE_SUPABASE_URL=your_url
railway variables set VITE_SUPABASE_ANON_KEY=your_key
```

## Environment Variables for Production

Make sure to set these in your deployment platform:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Post-Deployment Checklist

- [ ] Environment variables are set
- [ ] Supabase project is configured
- [ ] Database schema is applied
- [ ] Storage buckets are created
- [ ] Authentication is working
- [ ] Application loads without errors
- [ ] All features are functional

## Troubleshooting

### Common Deployment Issues:

1. **Build Failures**: Check for TypeScript errors
2. **Environment Variables**: Ensure they're set in the deployment platform
3. **Supabase Connection**: Verify URLs and keys are correct
4. **CORS Issues**: Check Supabase project settings

### Debug Steps:

1. Check deployment logs
2. Test locally with production environment variables
3. Verify Supabase project is accessible
4. Check browser console for errors
