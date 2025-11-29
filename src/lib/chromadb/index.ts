import { ChromaClient } from 'chromadb';

export class CustomChromaClient {
    private chromaClientInstance: ChromaClient | null = null;

    constructor() { }

    async client(): Promise<ChromaClient> {
        // Return cached instance if available
        if (this.chromaClientInstance) {
            return this.chromaClientInstance;
        }

        // Validate environment variables
        const username = process.env.CHROMA_USERNAME;
        const password = process.env.CHROMA_PASSWORD;
        const serverUrl = process.env.CHROMA_DB_URL;


        if (!username || !password || !serverUrl) {
            throw new Error('Missing required ChromaDB environment variables');
        }

        try {
            // Create basic auth token (fixing the 'Basic' duplication issue)
            const token = btoa(`${username}:${password}`);

            // Parse the server URL to extract host, port, and SSL settings
            const url = new URL(serverUrl);
            const host = url.hostname;
            const port = url.port ? parseInt(url.port, 10) : (url.protocol === 'https:' ? 443 : 80);
            const ssl = url.protocol === 'https:';

            // Create and cache the client
            this.chromaClientInstance = new ChromaClient({
                host,
                port,
                ssl,
                fetchOptions: {
                    headers: {
                        Authorization: `Basic ${token}`,
                        "Content-Type": "application/json",
                    }
                }
            });

            return this.chromaClientInstance;
        } catch (error) {
            console.error('Failed to initialize ChromaDB client:', error);
            throw new Error('ChromaDB client initialization failed');
        }
    }
}

export const chromaClient = new CustomChromaClient();