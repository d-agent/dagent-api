import { getRedisClient } from '../lib/redis';

const SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds
const SESSION_KEY_PREFIX = 'agent_session:';

export class SessionService {
    /**
     * Generate a session key from user_id and api_key_id
     * This creates a unique session identifier for each user+api_key combination
     */
    private static getSessionKey(userId: string, apiKeyId: string): string {
        // Create a deterministic session key from user_id and api_key_id
        // This ensures the same user+api_key combination gets the same session
        return `${SESSION_KEY_PREFIX}${userId}:${apiKeyId}`;
    }

    /**
     * Store agent_id for a session
     */
    public static async setAgentId(
        userId: string,
        apiKeyId: string,
        agentId: string
    ): Promise<void> {
        try {
            const redis = getRedisClient();
            const sessionKey = this.getSessionKey(userId, apiKeyId);
            // Upstash uses set with ex option instead of setex
            await redis.set(sessionKey, agentId, { ex: SESSION_TTL });
        } catch (error) {
            console.error('Error setting agent_id in Redis:', error);
            throw new Error('Failed to store session data');
        }
    }

    /**
     * Get agent_id for a session
     */
    public static async getAgentId(
        userId: string,
        apiKeyId: string
    ): Promise<string | null> {
        try {
            const redis = getRedisClient();
            const sessionKey = this.getSessionKey(userId, apiKeyId);
            const agentId = await redis.get(sessionKey);
            // Upstash returns the value directly or null
            return agentId as string | null;
        } catch (error) {
            console.error('Error getting agent_id from Redis:', error);
            return null;
        }
    }

    /**
     * Clear agent_id for a session (start new session)
     */
    public static async clearAgentId(
        userId: string,
        apiKeyId: string
    ): Promise<void> {
        try {
            const redis = getRedisClient();
            const sessionKey = this.getSessionKey(userId, apiKeyId);
            await redis.del(sessionKey);
        } catch (error) {
            console.error('Error clearing agent_id from Redis:', error);
            // Don't throw, just log - clearing is best effort
        }
    }

    /**
     * Extend session TTL (refresh session)
     */
    public static async refreshSession(
        userId: string,
        apiKeyId: string
    ): Promise<void> {
        try {
            const redis = getRedisClient();
            const sessionKey = this.getSessionKey(userId, apiKeyId);
            const exists = await redis.exists(sessionKey);
            // Upstash returns 1 if key exists, 0 if not
            if (exists === 1) {
                await redis.expire(sessionKey, SESSION_TTL);
            }
        } catch (error) {
            console.error('Error refreshing session in Redis:', error);
            // Don't throw, just log - refresh is best effort
        }
    }
}

