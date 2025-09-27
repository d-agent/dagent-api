import { FrameworkName, ParsedResponse } from "../../types";


export function parseAgentResponse(
    frameworkName: FrameworkName,
    responseJson: any
): ParsedResponse {
    const name = frameworkName.toLowerCase() as FrameworkName;

    // helper
    const get = (obj: any, path: string): any =>
        path.split(".").reduce((o, k) => (o && k in o ? o[k] : undefined), obj);

    // framework-specific extraction
    switch (name) {
        case "google_adk": {
            // if response is an array of conversation turns
            if (Array.isArray(responseJson)) {
                const lastTurn = responseJson[responseJson.length - 1];
                let content: string | null = null;

                if (lastTurn?.content?.parts) {
                    // pick last text part
                    const part = lastTurn.content.parts.find((p: any) => p.text);
                    if (part?.text) content = part.text;
                }

                // tokens from usageMetadata
                const inputTokens =
                    lastTurn?.usageMetadata?.promptTokenCount ??
                    lastTurn?.usageMetadata?.toolUsePromptTokenCount ??
                    null;
                const outputTokens =
                    lastTurn?.usageMetadata?.candidatesTokenCount ?? null;

                return {
                    response_content: content,
                    input_tokens: inputTokens,
                    output_tokens: outputTokens,
                };
            }

            // fallback (older schema)
            const responses = get(responseJson, "responses");
            if (Array.isArray(responses) && responses.length > 0) {
                const candidate = responses[0].candidates?.[0] ?? responses[0];
                const content = candidate.text ?? candidate.content ?? null;
                return {
                    response_content: content,
                    input_tokens: get(responseJson, "usageMetadata.promptTokenCount") ?? null,
                    output_tokens: get(responseJson, "usageMetadata.candidatesTokenCount") ?? null,
                };
            }

            return {
                response_content: null,
                input_tokens: null,
                output_tokens: null,
            };
        }

        // other frameworks...
        default:
            return {
                response_content: null,
                input_tokens: null,
                output_tokens: null,
            };
    }
}

