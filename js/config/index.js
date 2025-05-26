// OAuth Configuration
export const OAUTH_CONFIG = {
    google: {
        client_id: 'YOUR_GOOGLE_CLIENT_ID',
        redirect_uri: `${window.location.origin}/auth/callback`,
        scope: 'email profile',
        response_type: 'token id_token',
        prompt: 'select_account',
        access_type: 'offline',
        include_granted_scopes: true
    },
    facebook: {
        app_id: 'YOUR_FACEBOOK_APP_ID',
        redirect_uri: 'https://yswgkemxlueyssnxartr.supabase.co/auth/v1/callback',
        scope: 'email,public_profile',
        response_type: 'token',
        auth_type: 'rerequest',
        enable_profile_selector: true,
        return_scopes: true
    },
    instagram: {
        client_id: 'YOUR_INSTAGRAM_CLIENT_ID',
        redirect_uri: 'http://localhost/auth_verify/auth/callback',
        scope: 'basic',
        response_type: 'token'
    }
};

// Supabase Configuration
export const SUPABASE_CONFIG = {
    SUPABASE_URL: "https://yswgkemxlueyssnxartr.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzd2drZW14bHVleXNzbnhhcnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNTIwMjIsImV4cCI6MjA2MDcyODAyMn0.BewVaPObxMnFHVNyRn-d1pFOnqCrHYXQ7W5BTysgRPQ",
    CLIENT_OPTIONS: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
};

// Session Configuration
export const SESSION_CONFIG = {
    refreshInterval: 4 * 60 * 1000, // 4 minutes
    expiryBuffer: 5 * 60 * 1000,    // 5 minutes
    storage: {
        prefix: 'auth_',
        keys: {
            session: 'session',
            user: 'user',
            tokens: 'tokens'
        }
    },
    cookies: {
        enabled: true,
        secure: true,
        sameSite: 'lax'
    }
}; 