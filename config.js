// Supabase Configuration
export const SUPABASE_CONFIG = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  CLIENT_OPTIONS: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage,
      storageKey: 'auth-storage',
      flowType: 'implicit'
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'auth-verify',
        'X-Client-Info': 'auth-verify-web'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      },
      config: {
        presence: {
          key: 'user_presence'
        }
      }
    }
  }
};

// Connection and real-time configuration
export const CONNECTION_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  healthCheckInterval: 30000,
  timeout: 10000,
  realtime: {
    heartbeat: {
      interval: 30000,
      timeout: 60000
    },
    presence: {
      enabled: true,
      cleanupTimeout: 300000
    },
    reconnect: {
      auto: true,
      maxAttempts: 5,
      backoff: {
        initialDelay: 1000,
        maxDelay: 30000,
        multiplier: 1.5
      }
    }
  }
};

// Cache configuration
export const CACHE_CONFIG = {
  storage: 'localStorage',
  prefix: 'auth_verify:',
  ttl: 3600,
  invalidation: {
    enabled: true,
    interval: 300000
  }
};

// Zero Auth configuration
export const ZERO_AUTH_CONFIG = {
  enabled: true,
  providers: ['google', 'facebook', 'instagram'],
  features: {
    autoPrompt: true,
    persistSession: true,
    offlineSupport: true
  },
  ui: {
    autoShow: true,
    theme: 'dark',
    position: 'bottom-right'
  }
}; 