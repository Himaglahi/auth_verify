// OAuth Configuration with Zero Auth Support
export const OAUTH_CONFIG = {
    google: {
        client_id: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com', // Replace with your Google Client ID
        redirect_uri: `${window.location.origin}/auth/callback`,
        scope: 'email profile openid',
        response_type: 'token id_token',
        prompt: 'select_account',
        access_type: 'offline',
        include_granted_scopes: true,
        enable_one_tap: true,
        auto_select: true
    },
    facebook: {
        app_id: '1234567890123456', // Replace with your Facebook App ID
        redirect_uri: `${window.location.origin}/auth/callback`,
        scope: 'email,public_profile',
        response_type: 'token',
        auth_type: 'rerequest',
        enable_profile_selector: true,
        return_scopes: true,
        enable_profile_selector: true,
        state: 'facebookauth'
    },
    instagram: {
        client_id: '1234567890123456', // Replace with your Instagram Client ID
        redirect_uri: `${window.location.origin}/auth/callback`,
        scope: 'basic',
        response_type: 'token',
        state: 'instagramauth'
    }
};

// Social auth providers UI configuration
export const PROVIDERS = {
    google: {
        name: 'Google',
        icon: 'fa-google',
        color: '#DB4437',
        hoverColor: '#C13828',
        features: {
            one_tap: true,
            auto_prompt: true,
            remember_me: true,
            offline_access: true
        }
    },
    facebook: {
        name: 'Facebook',
        icon: 'fa-facebook-f',
        color: '#4267B2',
        hoverColor: '#365899',
        features: {
            persist_token: true,
            auto_logout: false,
            remember_me: true
        }
    },
    instagram: {
        name: 'Instagram',
        icon: 'fa-instagram',
        color: '#E1306C',
        hoverColor: '#C13584',
        features: {
            persist_token: true,
            auto_logout: false,
            remember_me: true
        }
    }
};

// Real-time configuration
export const REALTIME_CONFIG = {
    websocket: {
        reconnect: true,
        timeout: 10000,
        heartbeat: 30000
    },
    sync: {
        interval: 5000,
        retry_attempts: 3,
        retry_delay: 1000
    },
    cache: {
        enabled: true,
        expire: 3600,
        prefix: 'auth:'
    },
    features: {
        auto_reconnect: true,
        background_sync: true,
        offline_support: true
    }
};

// Error handling configuration
export const ERROR_CONFIG = {
    retry: {
        max_attempts: 3,
        delay: 1000,
        multiplier: 2
    },
    fallback: {
        enabled: true,
        offline_mode: true,
        cache_duration: 3600
    },
    logging: {
        enabled: true,
        level: 'error',
        remote: false
    }
}; 