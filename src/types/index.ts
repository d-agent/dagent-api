export type LLMProvider = "OpenAI" | "Anthropic" | "Llama" | "Google" | "Custom";

// requirements.json
export interface Requirement {
    description: string;
    preferred_llm_provider: string;
    max_agent_cost: number;
    max_total_agent_cost: number;
    skills: string[];
    streaming: boolean;
    is_multi_agent_system: boolean;
}

// AgentCard
export interface AgentCard {
    id: string; // DB id
    name: string;
    description: string;
    version: string;
    llmProvider: LLMProvider;
    llmModel: string;
    inputCostPer1M?: number;
    outputCostPer1M?: number;
    costPerToken: number;
    skills: string[];
    endpoints?: {
        url: string;
        type: string;
    }[];
    authentication?: {
        type: string;
    };
    features?: Record<string, any>;
}

export enum AgentFrameWorks {
    google_adk = "google_adk",
    crew_ai = "crew_ai",
    langraph = "langraph",
    openai = "openai",
    autogen = "autogen",
    autogpt = "autogpt",
    semantic_kernel = "semantic_kernel",
    openai_agents = "openai_agents",
}

export type FrameworkName =
    | "google_adk"
    | "crew_ai"
    | "langraph"
    | "openai"
    | "autogen"
    | "autogpt"
    | "semantic_kernel"
    | "openai_agents";

export interface ParsedResponse {
    response_content: string | null;
    input_tokens: number | null;
    output_tokens: number | null;
}

export interface GoogleADKMessagePart {
    videoMetadata?: {
        fps: number;
        endOffset: string;
        startOffset: string;
    };
    thought?: boolean;
    inlineData?: {
        displayName: string;
        data: string;
        mimeType: string;
    };
    fileData?: {
        displayName: string;
        fileUri: string;
        mimeType: string;
    };
    thoughtSignature?: string;
    functionCall?: {
        id: string;
        args: Record<string, any>;
        name: string;
    };
    codeExecutionResult?: {
        outcome: string;
        output: string;
    };
    executableCode?: {
        code: string;
        language: string;
    };
    functionResponse?: {
        willContinue: boolean;
        scheduling: string;
        id: string;
        name: string;
        response: Record<string, any>;
    };
    text?: string;
}

export interface GoogleADKRequestBody {
    appName: string;
    userId: string;
    sessionId: string;
    newMessage: {
        parts: GoogleADKMessagePart[];
        role: string;
    };
    streaming: boolean;
    stateDelta: Record<string, any>;
}