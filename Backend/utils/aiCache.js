const NodeCache = require('node-cache');

// Cache configuration
const cache = new NodeCache({
    stdTTL: 3600, // Cache for 1 hour
    checkperiod: 120 // Check for expired entries every 2 minutes
});

// Cache keys
const CACHE_KEYS = {
    RATE_LIMIT: 'gemini_rate_limit',
    DAILY_QUOTA: 'gemini_daily_quota',
    REQUESTS: 'gemini_requests'
};

// Track API usage
class AICache {
    static async trackRequest() {
        const today = new Date().toISOString().split('T')[0];
        const requests = cache.get(CACHE_KEYS.REQUESTS) || {};
        
        if (!requests[today]) {
            requests[today] = 0;
        }
        
        requests[today]++;
        cache.set(CACHE_KEYS.REQUESTS, requests);
        
        return requests[today];
    }

    static getDailyRequests() {
        const today = new Date().toISOString().split('T')[0];
        const requests = cache.get(CACHE_KEYS.REQUESTS) || {};
        return requests[today] || 0;
    }

    static setRateLimit(retryAfter) {
        cache.set(CACHE_KEYS.RATE_LIMIT, {
            timestamp: Date.now(),
            retryAfter
        });
    }

    static isRateLimited() {
        const rateLimit = cache.get(CACHE_KEYS.RATE_LIMIT);
        if (!rateLimit) return false;

        const now = Date.now();
        const limitExpires = rateLimit.timestamp + (rateLimit.retryAfter * 1000);
        return now < limitExpires;
    }

    static setDailyQuotaExceeded() {
        const today = new Date().toISOString().split('T')[0];
        cache.set(CACHE_KEYS.DAILY_QUOTA, today);
    }

    static isDailyQuotaExceeded() {
        const quotaDate = cache.get(CACHE_KEYS.DAILY_QUOTA);
        const today = new Date().toISOString().split('T')[0];
        return quotaDate === today;
    }

    // Cache responses
    static getCachedResponse(key) {
        return cache.get(key);
    }

    static setCachedResponse(key, value) {
        cache.set(key, value);
    }

    // Generate cache key for requests
    static generateCacheKey(type, params) {
        const normalized = JSON.stringify(params);
        return `${type}_${normalized}`;
    }
}

module.exports = AICache;