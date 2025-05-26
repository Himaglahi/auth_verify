import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { SUPABASE_CONFIG, OAUTH_CONFIG } from './config/index.js';
import { PROVIDERS, REALTIME_CONFIG } from '../config/oauth.js';

// Initialize Supabase client
const supabase = createClient(
    SUPABASE_CONFIG.SUPABASE_URL,
    SUPABASE_CONFIG.SUPABASE_ANON_KEY,
    SUPABASE_CONFIG.CLIENT_OPTIONS
);

// Real-time state management
let realtimeSubscription = null;
let syncInterval = null;
let lastSync = Date.now();
let retryCount = 0;

// Session management
let currentSession = null;

// Initialize session
async function initializeSession() {
    try {
        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
            currentSession = session;
            // Refresh token if needed
            if (isTokenExpiringSoon(session)) {
                await refreshSession();
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('Session initialization error:', error);
        return false;
    }
}

// Check if token is expiring soon (within 5 minutes)
function isTokenExpiringSoon(session) {
    if (!session?.expires_at) return false;
    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;
    return (expiresAt.getTime() - now.getTime()) < fiveMinutes;
}

// Refresh session
async function refreshSession() {
    try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        currentSession = session;
        return session;
    } catch (error) {
        console.error('Session refresh error:', error);
        return null;
    }
}

// Save session data
function saveSessionData(session) {
    if (session) {
        localStorage.setItem('auth_session', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            provider: session.provider,
            user: session.user
        }));
    }
}

// Initialize Google API
function initializeGoogleAPI() {
    return new Promise((resolve, reject) => {
        // Wait for gapi to load
        if (typeof gapi === 'undefined') {
            const checkGAPI = setInterval(() => {
                if (typeof gapi !== 'undefined') {
                    clearInterval(checkGAPI);
                    gapi.load('auth2', () => {
                        gapi.auth2.init({
                            client_id: OAUTH_CONFIG.google.client_id
                        }).then(() => resolve(), reject);
                    });
                }
            }, 100);
        } else {
            gapi.load('auth2', () => {
                gapi.auth2.init({
                    client_id: OAUTH_CONFIG.google.client_id
                }).then(() => resolve(), reject);
            });
        }
    });
}

// Check if provider is enabled
async function isProviderEnabled(provider) {
    try {
        const { data, error } = await supabase.auth.getSettings();
        if (error) throw error;
        
        const providers = data?.providers || [];
        return providers.includes(provider);
    } catch (error) {
        console.error(`Error checking ${provider} provider status:`, error);
        return false;
    }
}

// Google Sign In
export async function signInWithGoogle() {
    try {
        await initializeGoogleAPI();
        const auth2 = gapi.auth2.getAuthInstance();
        const googleUser = await auth2.signIn();
        
        const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: googleUser.getAuthResponse().id_token
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Google sign in error:', error);
        throw new Error('Failed to sign in with Google');
    }
}

// Facebook Sign In
export async function signInWithFacebook() {
    try {
        // Check if Facebook provider is enabled
        const isFacebookEnabled = await isProviderEnabled('facebook');
        if (!isFacebookEnabled) {
            throw new Error('Facebook login is not configured. Please contact the administrator.');
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
                redirectTo: OAUTH_CONFIG.facebook.redirect_uri,
                scopes: OAUTH_CONFIG.facebook.scope
            }
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Facebook sign in error:', error);
        // Show more user-friendly error message
        if (error.message.includes('not enabled')) {
            showMessage('Facebook login is not available at the moment. Please try another login method.', 'warning');
        } else {
            showMessage(error.message || 'Failed to sign in with Facebook', 'error');
        }
        throw error;
    }
}

// Instagram Sign In
export async function signInWithInstagram() {
    try {
        // Check if Instagram provider is enabled
        const isInstagramEnabled = await isProviderEnabled('instagram');
        if (!isInstagramEnabled) {
            throw new Error('Instagram login is not configured. Please contact the administrator.');
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'instagram',
            options: {
                redirectTo: OAUTH_CONFIG.instagram.redirect_uri,
                scopes: OAUTH_CONFIG.instagram.scope
            }
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Instagram sign in error:', error);
        // Show more user-friendly error message
        if (error.message.includes('not enabled')) {
            showMessage('Instagram login is not available at the moment. Please try another login method.', 'warning');
        } else {
            showMessage(error.message || 'Failed to sign in with Instagram', 'error');
        }
        throw error;
    }
}

// Initialize providers when the script loads
window.addEventListener('load', async () => {
    try {
        // Check which providers are enabled
        const [isGoogleEnabled, isFacebookEnabled, isInstagramEnabled] = await Promise.all([
            isProviderEnabled('google'),
            isProviderEnabled('facebook'),
            isProviderEnabled('instagram')
        ]);

        // Update UI based on available providers
        const googleBtn = document.getElementById('googleLogin');
        const facebookBtn = document.getElementById('facebookLogin');
        const instagramBtn = document.getElementById('instagramLogin');

        if (googleBtn) {
            if (!isGoogleEnabled) {
                googleBtn.style.display = 'none';
            } else {
                initializeGoogleAPI().catch(console.error);
            }
        }

        if (facebookBtn && !isFacebookEnabled) {
            facebookBtn.style.display = 'none';
        }

        if (instagramBtn && !isInstagramEnabled) {
            instagramBtn.style.display = 'none';
        }

        // Hide social login section if no providers are enabled
        const socialLoginSection = document.querySelector('.social-login');
        if (socialLoginSection && !isGoogleEnabled && !isFacebookEnabled && !isInstagramEnabled) {
            socialLoginSection.style.display = 'none';
            document.querySelector('.divider')?.style.display = 'none';
        }
    } catch (error) {
        console.error('Error initializing providers:', error);
    }
});

// Initialize social providers with real-time features
function initializeProviders() {
    // Initialize Google Sign-In
    gapi.load('auth2', () => {
        gapi.auth2.init({
            client_id: OAUTH_CONFIG.google.client_id,
            scope: OAUTH_CONFIG.google.scope
        });
    });

    // Initialize Facebook with real-time updates
    window.fbAsyncInit = function() {
        FB.init({
            appId: OAUTH_CONFIG.facebook.app_id,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
        });

        if (PROVIDERS.facebook.features.realtime_profile) {
            initializeFacebookRealtime();
        }
    };

    // Initialize Instagram real-time subscriptions
    if (PROVIDERS.instagram.features.realtime_profile) {
        initializeInstagramRealtime();
    }
}

// Facebook Real-time Updates
function initializeFacebookRealtime() {
    FB.Event.subscribe('auth.statusChange', async (response) => {
        if (response.status === 'connected') {
            try {
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'facebook',
                    access_token: response.authResponse.accessToken
                });

                if (error) throw error;
                await handleSuccessfulAuth(data.user);
            } catch (error) {
                console.error('Facebook real-time auth error:', error);
            }
        }
    });
}

// Instagram Real-time Updates
function initializeInstagramRealtime() {
    // Set up Instagram webhook endpoint for real-time updates
    if (OAUTH_CONFIG.instagram.real_time_updates) {
        setupInstagramWebhook();
    }
}

// Set up real-time subscription
async function setupRealtimeSubscription(userId) {
    try {
        // Clear existing subscription
        if (realtimeSubscription) {
            realtimeSubscription.unsubscribe();
        }

        // Subscribe to user-specific changes
        realtimeSubscription = supabase
            .channel(`user_${userId}`)
            .on('postgres_changes', 
                {
                    event: '*',
                    schema: 'public',
                    table: 'users',
                    filter: `auth_user_id=eq.${userId}`
                },
                (payload) => handleRealtimeUpdate(payload)
            )
            .subscribe();

        // Start sync interval
        startSyncInterval(userId);
    } catch (error) {
        console.error('Realtime subscription error:', error);
    }
}

// Handle real-time updates
async function handleRealtimeUpdate(payload) {
    try {
        const { new: newData, old: oldData, eventType } = payload;
        
        // Update local storage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, ...newData };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Trigger UI updates
        updateUserInterface(updatedUser);

        // Emit custom event for other components
        window.dispatchEvent(new CustomEvent('userUpdate', { 
            detail: { user: updatedUser, eventType } 
        }));
    } catch (error) {
        console.error('Update handling error:', error);
    }
}

// Start periodic sync
function startSyncInterval(userId) {
    if (syncInterval) {
        clearInterval(syncInterval);
    }

    syncInterval = setInterval(async () => {
        try {
            const now = Date.now();
            if (now - lastSync >= REALTIME_CONFIG.sync_timeout) {
                await syncUserData(userId);
                lastSync = now;
                retryCount = 0;
            }
        } catch (error) {
            console.error('Sync error:', error);
            retryCount++;
            
            if (retryCount >= REALTIME_CONFIG.retry_attempts) {
                clearInterval(syncInterval);
                showMessage('Sync connection lost. Please refresh the page.', 'error');
            }
        }
    }, REALTIME_CONFIG.update_interval);
}

// Sync user data
async function syncUserData(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

    if (error) throw error;
    if (data) {
        localStorage.setItem('user', JSON.stringify(data));
        updateUserInterface(data);
    }
}

// Update UI with user data
function updateUserInterface(userData) {
    // Update avatar if exists
    const avatar = document.querySelector('.user-avatar');
    if (avatar && userData.avatar_url) {
        avatar.src = userData.avatar_url;
    }

    // Update name if exists
    const nameElement = document.querySelector('.user-name');
    if (nameElement && userData.name) {
        nameElement.textContent = userData.name;
    }

    // Update other UI elements as needed
    updateProviderSpecificUI(userData);
}

// Update provider-specific UI elements
function updateProviderSpecificUI(userData) {
    const provider = userData.provider;
    
    switch (provider) {
        case 'google':
            updateGoogleSpecificUI(userData);
            break;
        case 'facebook':
            updateFacebookSpecificUI(userData);
            break;
        case 'instagram':
            updateInstagramSpecificUI(userData);
            break;
    }
}

// Handle successful authentication
async function handleSuccessfulAuth(user) {
    if (!user) return;

    try {
        // Store user data
        localStorage.setItem('user', JSON.stringify(user));
        
        // Set up real-time subscription
        await setupRealtimeSubscription(user.id);
        
        // Create or update user profile
        const { error: profileError } = await supabase
            .from('users')
            .upsert({
                auth_user_id: user.id,
                email: user.email,
                name: user.user_metadata.full_name || user.user_metadata.name,
                avatar_url: user.user_metadata.avatar_url,
                provider: user.app_metadata.provider,
                last_sign_in: new Date().toISOString()
            }, {
                onConflict: 'auth_user_id'
            });

        if (profileError) {
            console.error('Error updating profile:', profileError);
        }

        // Update UI
        updateUserInterface(user);
        
        // Redirect to dashboard
        window.location.href = '/dashboard.html';
    } catch (error) {
        console.error('Auth handling error:', error);
        showMessage('Error completing authentication', 'error');
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeProviders();

    // Add click handlers for social login buttons
    document.getElementById('googleLogin')?.addEventListener('click', async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('Google login error:', error);
            showMessage(error.message, 'error');
        }
    });

    document.getElementById('facebookLogin')?.addEventListener('click', async () => {
        try {
            await signInWithFacebook();
        } catch (error) {
            console.error('Facebook login error:', error);
            showMessage(error.message, 'error');
        }
    });

    document.getElementById('instagramLogin')?.addEventListener('click', async () => {
        try {
            await signInWithInstagram();
        } catch (error) {
            console.error('Instagram login error:', error);
            showMessage(error.message, 'error');
        }
    });

    // Handle OAuth callback
    if (window.location.pathname.includes('/auth/callback')) {
        handleAuthCallback().then(user => {
            if (user) {
                handleSuccessfulAuth(user);
            } else {
                window.location.href = '/login.html';
            }
        });
    }
});

// Helper function to show messages
function showMessage(text, type = 'info') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = `alert ${type}`;
        messageDiv.style.display = 'block';
    }
} 