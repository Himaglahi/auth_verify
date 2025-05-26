// Offline storage handler
class OfflineStorage {
    constructor() {
        this.STORAGE_KEYS = {
            USERS: 'offline_users',
            PENDING_SYNC: 'pending_sync',
            LAST_SYNC: 'last_sync'
        };
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem(this.STORAGE_KEYS.USERS)) {
            localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.STORAGE_KEYS.PENDING_SYNC)) {
            localStorage.setItem(this.STORAGE_KEYS.PENDING_SYNC, JSON.stringify([]));
        }
    }

    // User operations
    async createUser(userData) {
        const users = this.getUsers();
        const existingUser = users.find(user => user.email === userData.email);
        
        if (existingUser) {
            throw new Error('Email already registered');
        }

        const newUser = {
            ...userData,
            id: `offline_${Date.now()}`,
            created_at: new Date().toISOString(),
            is_offline: true
        };

        users.push(newUser);
        localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));

        // Add to pending sync
        this.addToPendingSync('create', newUser);
        return newUser;
    }

    async loginUser(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            throw new Error('User not found');
        }

        if (user.password !== password) {
            throw new Error('Invalid password');
        }

        return user;
    }

    getUsers() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USERS) || '[]');
    }

    // Sync management
    addToPendingSync(operation, data) {
        const pendingSync = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PENDING_SYNC) || '[]');
        pendingSync.push({
            operation,
            data,
            timestamp: Date.now()
        });
        localStorage.setItem(this.STORAGE_KEYS.PENDING_SYNC, JSON.stringify(pendingSync));
    }

    getPendingSync() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PENDING_SYNC) || '[]');
    }

    clearPendingSync() {
        localStorage.setItem(this.STORAGE_KEYS.PENDING_SYNC, JSON.stringify([]));
    }

    setLastSync(timestamp) {
        localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, timestamp.toString());
    }

    getLastSync() {
        return parseInt(localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC) || '0');
    }
}

export const offlineStorage = new OfflineStorage();