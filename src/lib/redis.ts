import { Redis } from '@upstash/redis';
import { config } from './env';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
    if (!redisClient) {
        // Try to use fromEnv first (simpler, reads from UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)
        try {
            redisClient = Redis.fromEnv();
            console.log('Upstash Redis Client initialized from environment variables');
        } catch (error) {
            // Fallback to explicit configuration if fromEnv fails
            if (!config.UPSTASH_REDIS_REST_URL || !config.UPSTASH_REDIS_REST_TOKEN) {
                throw new Error(
                    'Upstash Redis credentials must be configured in environment variables for session persistence. ' +
                    'Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your .env file. ' +
                    'You can find these in your Upstash dashboard at https://console.upstash.com/'
                );
            }

            redisClient = new Redis({
                url: config.UPSTASH_REDIS_REST_URL,
                token: config.UPSTASH_REDIS_REST_TOKEN,
            });

            console.log('Upstash Redis Client initialized with explicit configuration');
        }
    }
    return redisClient;
}

export async function closeRedisConnection(): Promise<void> {
    // Upstash Redis REST API doesn't require connection closing
    // but we can reset the client reference
    redisClient = null;
}

