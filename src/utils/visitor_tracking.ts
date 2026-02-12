import { apiRequest } from './api';

const VISITOR_ID_KEY = 'lyceum_visitor_id';

/**
 * Generates or retrieves a persistent visitor ID from localStorage.
 */
export const getVisitorId = (): string => {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
        visitorId = 'v-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
};

/**
 * Tracks a visit to the given path.
 */
export const trackVisit = async (path: string) => {
    try {
        const visitorId = getVisitorId();
        const referrer = document.referrer;
        const userAgent = navigator.userAgent;

        // We use a public endpoint that doesn't require authentication
        await fetch(`${import.meta.env.VITE_API_URL}/public/track-visit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                visitorId,
                path,
                referrer,
                userAgent
            })
        });
    } catch (error) {
        // Silent fail for tracking - we don't want to break the UI
        console.warn('Visitor tracking failed:', error);
    }
};
