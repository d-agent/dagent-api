import { Context } from "hono"
import { getCookie } from "hono/cookie"
import { AgentService } from "../services/agent.service"
import { api_response } from "../lib/utils/parser"
import { errorMessageIncludes, getErrorMessage, getErrorStack } from "../lib/utils/error"

export class AgentController {
    public static readonly primary = async (c: Context) => {
        try {
            // Input validation
            let requestBody;
            try {
                requestBody = await c.req.json();
            } catch (parseError) {
                console.error("Invalid JSON in primary agent request:", parseError);
                return c.json(
                    api_response({ 
                        message: "Invalid JSON format in request body", 
                        is_error: true 
                    }),
                    400
                );
            }

            const { requirement_json, message } = requestBody;

            // Validate required fields
            if (!message || typeof message !== 'string') {
                return c.json(
                    api_response({ 
                        message: "message is required and must be a non-empty string", 
                        is_error: true 
                    }),
                    400
                );
            }

            if (message.trim().length === 0) {
                return c.json(
                    api_response({ 
                        message: "message cannot be empty", 
                        is_error: true 
                    }),
                    400
                );
            }

            if (message.length > 10000) {
                return c.json(
                    api_response({ 
                        message: "message must be 10000 characters or less", 
                        is_error: true 
                    }),
                    400
                );
            }

            // Validate requirement_json if provided
            if (requirement_json && typeof requirement_json !== 'object') {
                return c.json(
                    api_response({ 
                        message: "requirement_json must be a valid object", 
                        is_error: true 
                    }),
                    400
                );
            }

            // Get agent ID from cookie
            const agentId = getCookie(c, 'agent_id');
            
            const agentResponse = await AgentService.primary(c, requirement_json, agentId, message.trim());
            return c.json(api_response({ message: "Agent response", data: agentResponse }));
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            const errorStack = getErrorStack(error);
            
            console.error("Error in primary agent method:", {
                error: errorMessage,
                stack: errorStack,
                timestamp: new Date().toISOString()
            });

            // Handle specific error types
            if (errorMessageIncludes(error, "Agent URL or provider not found") || errorMessageIncludes(error, "Agent not found")) {
                return c.json(
                    api_response({ 
                        message: "Agent not found or not properly configured", 
                        is_error: true 
                    }),
                    404
                );
            }

            if (errorMessageIncludes(error, "insufficient balance") || errorMessageIncludes(error, "payment")) {
                return c.json(
                    api_response({ 
                        message: errorMessage, 
                        is_error: true 
                    }),
                    402 // Payment Required
                );
            }

            if (errorMessageIncludes(error, "unauthorized") || errorMessageIncludes(error, "authentication")) {
                return c.json(
                    api_response({ 
                        message: "Authentication required to access agent", 
                        is_error: true 
                    }),
                    401
                );
            }

            if (errorMessageIncludes(error, "rate limit") || errorMessageIncludes(error, "too many requests")) {
                return c.json(
                    api_response({ 
                        message: "Rate limit exceeded. Please try again later.", 
                        is_error: true 
                    }),
                    429
                );
            }

            if (errorMessageIncludes(error, "timeout") || errorMessageIncludes(error, "connection")) {
                return c.json(
                    api_response({ 
                        message: "Agent service temporarily unavailable. Please try again later.", 
                        is_error: true 
                    }),
                    503
                );
            }

            // Generic server error
            return c.json(
                api_response({ 
                    message: "Failed to process agent request. Please try again later.", 
                    is_error: true 
                }),
                500
            );
        }
    }

    public static readonly createAgent = async (c: Context) => {
        try {
            // Input validation
            let requestBody;
            try {
                requestBody = await c.req.json();
            } catch (parseError) {
                console.error("Invalid JSON in createAgent request:", parseError);
                return c.json(
                    api_response({ 
                        message: "Invalid JSON format in request body", 
                        is_error: true 
                    }),
                    400
                );
            }

            const { 
                name, 
                description, 
                agentCost, 
                deployedUrl, 
                llmProvider, 
                skills, 
                is_multiAgentSystem, 
                default_agent_name, 
                framework_used, 
                can_stream 
            } = requestBody;

            // Validate required fields
            const requiredStringFields = {
                name: { value: name, maxLength: 100 },
                description: { value: description, maxLength: 1000 },
                agentCost: { value: agentCost, maxLength: 50 },
                deployedUrl: { value: deployedUrl, maxLength: 500 },
                llmProvider: { value: llmProvider, maxLength: 100 }
            };

            for (const [fieldName, config] of Object.entries(requiredStringFields)) {
                const { value, maxLength } = config;
                if (!value || typeof value !== 'string') {
                    return c.json(
                        api_response({ 
                            message: `${fieldName} is required and must be a non-empty string`, 
                            is_error: true 
                        }),
                        400
                    );
                }
                
                if (value.trim().length === 0) {
                    return c.json(
                        api_response({ 
                            message: `${fieldName} cannot be empty`, 
                            is_error: true 
                        }),
                        400
                    );
                }
                
                if (value.length > maxLength) {
                    return c.json(
                        api_response({ 
                            message: `${fieldName} must be ${maxLength} characters or less`, 
                            is_error: true 
                        }),
                        400
                    );
                }
            }

            // Validate URL format
            try {
                new URL(deployedUrl);
            } catch {
                return c.json(
                    api_response({ 
                        message: "deployedUrl must be a valid URL", 
                        is_error: true 
                    }),
                    400
                );
            }

            // Validate skills array
            if (!Array.isArray(skills)) {
                return c.json(
                    api_response({ 
                        message: "skills must be an array", 
                        is_error: true 
                    }),
                    400
                );
            }

            if (skills.length === 0) {
                return c.json(
                    api_response({ 
                        message: "skills array cannot be empty", 
                        is_error: true 
                    }),
                    400
                );
            }

            if (!skills.every(skill => typeof skill === 'string' && skill.trim().length > 0)) {
                return c.json(
                    api_response({ 
                        message: "all skills must be non-empty strings", 
                        is_error: true 
                    }),
                    400
                );
            }

            // Validate boolean fields
            if (typeof is_multiAgentSystem !== 'boolean') {
                return c.json(
                    api_response({ 
                        message: "is_multiAgentSystem must be a boolean", 
                        is_error: true 
                    }),
                    400
                );
            }

            if (typeof can_stream !== 'boolean') {
                return c.json(
                    api_response({ 
                        message: "can_stream must be a boolean", 
                        is_error: true 
                    }),
                    400
                );
            }

            // Validate numeric fields
            const numericCost = parseFloat(agentCost);
            if (isNaN(numericCost) || numericCost < 0) {
                return c.json(
                    api_response({ 
                        message: "agentCost must be a valid non-negative number", 
                        is_error: true 
                    }),
                    400
                );
            }

            // Get user from context
            const user = await c.get('user');
            if (!user || !user.id) {
                console.error("User not found in context for createAgent");
                return c.json(
                    api_response({ 
                        message: "User authentication required", 
                        is_error: true 
                    }),
                    401
                );
            }

            const agent = await AgentService.createAgent(user.id, { 
                name: name.trim(), 
                description: description.trim(), 
                agentCost, 
                deployedUrl: deployedUrl.trim(), 
                llmProvider: llmProvider.trim(), 
                skills: skills.map(skill => skill.trim()), 
                is_multiAgentSystem, 
                default_agent_name: default_agent_name?.trim() || '', 
                framework_used: framework_used?.trim() || '', 
                can_stream 
            });
            
            return c.json(api_response({ message: "Agent created successfully", data: agent }));
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            const errorStack = getErrorStack(error);
            
            console.error("Error in createAgent:", {
                error: errorMessage,
                stack: errorStack,
                timestamp: new Date().toISOString()
            });

            // Handle specific error types
            if (errorMessageIncludes(error, "duplicate") || errorMessageIncludes(error, "already exists")) {
                return c.json(
                    api_response({ 
                        message: "Agent with this name or URL already exists", 
                        is_error: true 
                    }),
                    409 // Conflict
                );
            }

            if (errorMessageIncludes(error, "wallet not found") || errorMessageIncludes(error, "user stake")) {
                return c.json(
                    api_response({ 
                        message: errorMessage, 
                        is_error: true 
                    }),
                    404
                );
            }

            if (errorMessageIncludes(error, "insufficient balance") || errorMessageIncludes(error, "stake must be greater than 0")) {
                return c.json(
                    api_response({ 
                        message: errorMessage, 
                        is_error: true 
                    }),
                    402 // Payment Required
                );
            }

            if (errorMessageIncludes(error, "embedding") || errorMessageIncludes(error, "generation failed")) {
                return c.json(
                    api_response({ 
                        message: "Failed to generate agent embedding. Please try again later.", 
                        is_error: true 
                    }),
                    503
                );
            }

            if (errorMessageIncludes(error, "contract") || errorMessageIncludes(error, "blockchain")) {
                return c.json(
                    api_response({ 
                        message: "Failed to register agent on blockchain. Please try again later.", 
                        is_error: true 
                    }),
                    503
                );
            }

            // Generic server error
            return c.json(
                api_response({ 
                    message: "Failed to create agent. Please try again later.", 
                    is_error: true 
                }),
                500
            );
        }
    }

    public static readonly getAllAgents = async (c: Context) => {
        try {
            // Get user from context (optional for public agents)
            const user = await c.get('user');
            const user_id = user?.id;
            
            const agents = await AgentService.getAllAgents(user_id);
            return c.json(api_response({ message: "Agents retrieved successfully", data: agents }));
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            const errorStack = getErrorStack(error);
            
            console.error("Error in getAllAgents:", {
                error: errorMessage,
                stack: errorStack,
                timestamp: new Date().toISOString()
            });

            // Generic server error
            return c.json(
                api_response({ 
                    message: "Failed to retrieve agents. Please try again later.", 
                    is_error: true 
                }),
                500
            );
        }
    };

    public static readonly getAgent = async (c: Context) => {
        try {
            const agent_id = c.req.param('id');
            
            if (!agent_id || typeof agent_id !== 'string' || agent_id.trim().length === 0) {
                return c.json(
                    api_response({ 
                        message: "agent_id is required and must be a non-empty string", 
                        is_error: true 
                    }),
                    400
                );
            }
            
            const agent = await AgentService.getAgent(agent_id.trim());
            return c.json(api_response({ message: "Agent retrieved successfully", data: agent }));
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            const errorStack = getErrorStack(error);
            
            console.error("Error in getAgent:", {
                error: errorMessage,
                stack: errorStack,
                timestamp: new Date().toISOString()
            });

            // Handle specific error types
            if (errorMessageIncludes(error, "not found")) {
                return c.json(
                    api_response({ 
                        message: "Agent not found", 
                        is_error: true 
                    }),
                    404
                );
            }

            // Generic server error
            return c.json(
                api_response({ 
                    message: "Failed to retrieve agent. Please try again later.", 
                    is_error: true 
                }),
                500
            );
        }
    };

    public static readonly updateAgent = async (c: Context) => {
        try {
            const agent_id = c.req.param('id');
            
            if (!agent_id || typeof agent_id !== 'string' || agent_id.trim().length === 0) {
                return c.json(
                    api_response({ 
                        message: "agent_id is required and must be a non-empty string", 
                        is_error: true 
                    }),
                    400
                );
            }

            // Input validation
            let requestBody;
            try {
                requestBody = await c.req.json();
            } catch (parseError) {
                console.error("Invalid JSON in updateAgent request:", parseError);
                return c.json(
                    api_response({ 
                        message: "Invalid JSON format in request body", 
                        is_error: true 
                    }),
                    400
                );
            }

            const { 
                name, 
                description, 
                agentCost, 
                deployedUrl, 
                llmProvider, 
                isActive, 
                isPublic 
            } = requestBody;

            // Validate optional fields if provided
            const updateData: any = {};
            
            if (name !== undefined) {
                if (typeof name !== 'string' || name.trim().length === 0) {
                    return c.json(
                        api_response({ 
                            message: "name must be a non-empty string", 
                            is_error: true 
                        }),
                        400
                    );
                }
                if (name.length > 100) {
                    return c.json(
                        api_response({ 
                            message: "name must be 100 characters or less", 
                            is_error: true 
                        }),
                        400
                    );
                }
                updateData.name = name.trim();
            }

            if (description !== undefined) {
                if (typeof description !== 'string' || description.trim().length === 0) {
                    return c.json(
                        api_response({ 
                            message: "description must be a non-empty string", 
                            is_error: true 
                        }),
                        400
                    );
                }
                if (description.length > 1000) {
                    return c.json(
                        api_response({ 
                            message: "description must be 1000 characters or less", 
                            is_error: true 
                        }),
                        400
                    );
                }
                updateData.description = description.trim();
            }

            if (agentCost !== undefined) {
                if (typeof agentCost !== 'string') {
                    return c.json(
                        api_response({ 
                            message: "agentCost must be a string", 
                            is_error: true 
                        }),
                        400
                    );
                }
                const numericCost = parseFloat(agentCost);
                if (isNaN(numericCost) || numericCost < 0) {
                    return c.json(
                        api_response({ 
                            message: "agentCost must be a valid non-negative number", 
                            is_error: true 
                        }),
                        400
                    );
                }
                updateData.agentCost = agentCost;
            }

            if (deployedUrl !== undefined) {
                if (typeof deployedUrl !== 'string' || deployedUrl.trim().length === 0) {
                    return c.json(
                        api_response({ 
                            message: "deployedUrl must be a non-empty string", 
                            is_error: true 
                        }),
                        400
                    );
                }
                try {
                    new URL(deployedUrl);
                } catch {
                    return c.json(
                        api_response({ 
                            message: "deployedUrl must be a valid URL", 
                            is_error: true 
                        }),
                        400
                    );
                }
                updateData.deployedUrl = deployedUrl.trim();
            }

            if (llmProvider !== undefined) {
                if (typeof llmProvider !== 'string' || llmProvider.trim().length === 0) {
                    return c.json(
                        api_response({ 
                            message: "llmProvider must be a non-empty string", 
                            is_error: true 
                        }),
                        400
                    );
                }
                updateData.llmProvider = llmProvider.trim();
            }

            if (isActive !== undefined) {
                if (typeof isActive !== 'boolean') {
                    return c.json(
                        api_response({ 
                            message: "isActive must be a boolean", 
                            is_error: true 
                        }),
                        400
                    );
                }
                updateData.isActive = isActive;
            }

            if (isPublic !== undefined) {
                if (typeof isPublic !== 'boolean') {
                    return c.json(
                        api_response({ 
                            message: "isPublic must be a boolean", 
                            is_error: true 
                        }),
                        400
                    );
                }
                updateData.isPublic = isPublic;
            }

            // Check if at least one field is being updated
            if (Object.keys(updateData).length === 0) {
                return c.json(
                    api_response({ 
                        message: "At least one field must be provided for update", 
                        is_error: true 
                    }),
                    400
                );
            }

            // Get user from context
            const user = await c.get('user');
            if (!user || !user.id) {
                console.error("User not found in context for updateAgent");
                return c.json(
                    api_response({ 
                        message: "User authentication required", 
                        is_error: true 
                    }),
                    401
                );
            }
            
            const agent = await AgentService.updateAgent(agent_id.trim(), user.id, updateData);
            return c.json(api_response({ message: "Agent updated successfully", data: agent }));
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            const errorStack = getErrorStack(error);
            
            console.error("Error in updateAgent:", {
                error: errorMessage,
                stack: errorStack,
                timestamp: new Date().toISOString()
            });

            // Handle specific error types
            if (errorMessageIncludes(error, "not found")) {
                return c.json(
                    api_response({ 
                        message: "Agent not found", 
                        is_error: true 
                    }),
                    404
                );
            }

            if (errorMessageIncludes(error, "unauthorized")) {
                return c.json(
                    api_response({ 
                        message: "Unauthorized to update this agent", 
                        is_error: true 
                    }),
                    403
                );
            }

            if (errorMessageIncludes(error, "embedding")) {
                return c.json(
                    api_response({ 
                        message: "Failed to update agent embedding. Please try again later.", 
                        is_error: true 
                    }),
                    503
                );
            }

            // Generic server error
            return c.json(
                api_response({ 
                    message: "Failed to update agent. Please try again later.", 
                    is_error: true 
                }),
                500
            );
        }
    };

    public static readonly deleteAgent = async (c: Context) => {
        try {
            const agent_id = c.req.param('id');
            
            if (!agent_id || typeof agent_id !== 'string' || agent_id.trim().length === 0) {
                return c.json(
                    api_response({ 
                        message: "agent_id is required and must be a non-empty string", 
                        is_error: true 
                    }),
                    400
                );
            }

            // Get user from context
            const user = await c.get('user');
            if (!user || !user.id) {
                console.error("User not found in context for deleteAgent");
                return c.json(
                    api_response({ 
                        message: "User authentication required", 
                        is_error: true 
                    }),
                    401
                );
            }
            
            const agent = await AgentService.deleteAgent(agent_id.trim(), user.id);
            return c.json(api_response({ message: "Agent deleted successfully", data: agent }));
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            const errorStack = getErrorStack(error);
            
            console.error("Error in deleteAgent:", {
                error: errorMessage,
                stack: errorStack,
                timestamp: new Date().toISOString()
            });

            // Handle specific error types
            if (errorMessageIncludes(error, "not found")) {
                return c.json(
                    api_response({ 
                        message: "Agent not found", 
                        is_error: true 
                    }),
                    404
                );
            }

            if (errorMessageIncludes(error, "unauthorized")) {
                return c.json(
                    api_response({ 
                        message: "Unauthorized to delete this agent", 
                        is_error: true 
                    }),
                    403
                );
            }

            // Generic server error
            return c.json(
                api_response({ 
                    message: "Failed to delete agent. Please try again later.", 
                    is_error: true 
                }),
                500
            );
        }
    };
}