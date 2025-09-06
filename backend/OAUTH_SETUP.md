# OAuth Setup Guide for CampusConnect

## Google OAuth Setup

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set Application type to "Web application"
6. Add Authorized redirect URIs:
   ```
   https://tefsuxgslyowilylcqtw.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback (for development)
   ```
7. Copy Client ID and Client Secret

### 2. Supabase Configuration
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add Google Client ID and Client Secret
4. Save configuration

### 3. Frontend Usage
```javascript
// Sign in with Google
const { data, error } = await authAPI.signInWithGoogle()

// Handle OAuth callback
const { data, error } = await authAPI.handleOAuthCallback()

// Listen to auth state changes
const subscription = authAPI.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user)
  }
})
```

## GitHub OAuth Setup (Optional)

### 1. GitHub App Setup
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL:
   ```
   https://tefsuxgslyowilylcqtw.supabase.co/auth/v1/callback
   ```
4. Copy Client ID and Client Secret

### 2. Supabase Configuration
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable GitHub provider
3. Add GitHub Client ID and Client Secret
4. Save configuration

## Profile Auto-Creation

The updated trigger automatically handles OAuth user data:
- Google: Uses `name`, `picture` from Google profile
- GitHub: Uses `name`, `avatar_url` from GitHub profile
- Email: Uses provided `username`, `display_name`

## Testing OAuth Integration

```bash
# Test OAuth API structure
npm run test:oauth

# Test comprehensive backend (includes OAuth)
npm run test:comprehensive
```

## Security Notes

1. **Redirect URLs:** Always use HTTPS in production
2. **Client Secrets:** Keep them secure, never expose in frontend
3. **Scopes:** Request minimal required permissions
4. **Session Management:** Handle auth state changes properly

## Troubleshooting

### Common Issues:
1. **Redirect URI mismatch:** Ensure URLs match exactly in OAuth provider settings
2. **Invalid client:** Check Client ID and Secret are correct
3. **CORS errors:** Ensure domain is whitelisted in Supabase settings
4. **Profile not created:** Check trigger function is working

### Debug Steps:
1. Check Supabase Auth logs
2. Verify OAuth provider configuration
3. Test with Supabase Auth UI first
4. Check browser network tab for errors
