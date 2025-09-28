import { Context } from "hono";
import { ApiKeyService } from "../services/apiKey.service";
import { api_response } from "../lib/utils/parser";
import {
	errorMessageIncludes,
	getErrorMessage,
	getErrorStack,
} from "../lib/utils/error";

export class ApiKeyController {
	public static readonly createApiKey = async (c: Context) => {
		try {
			// Input validation
			let requestBody;
			try {
				requestBody = await c.req.json();
			} catch (parseError) {
				console.error("Invalid JSON in createApiKey request:", parseError);
				return c.json(
					api_response({
						message: "Invalid JSON format in request body",
						is_error: true,
					}),
					400
				);
			}

			const { api_key_name } = requestBody;

			// Validate required fields
			if (!api_key_name || typeof api_key_name !== "string") {
				return c.json(
					api_response({
						message: "api_key_name is required and must be a non-empty string",
						is_error: true,
					}),
					400
				);
			}

			if (api_key_name.trim().length === 0) {
				return c.json(
					api_response({
						message: "api_key_name cannot be empty",
						is_error: true,
					}),
					400
				);
			}

			if (api_key_name.length > 100) {
				return c.json(
					api_response({
						message: "api_key_name must be 100 characters or less",
						is_error: true,
					}),
					400
				);
			}

			// Get user from context
			const user = await c.get("user");
			if (!user || !user.id) {
				console.error("User not found in context for createApiKey");
				return c.json(
					api_response({
						message: "User authentication required",
						is_error: true,
					}),
					401
				);
			}

			const apiKey = await ApiKeyService.createApiKey(
				user.id,
				api_key_name.trim()
			);
			return c.json(
				api_response({ message: "API Key created successfully", data: apiKey })
			);
		} catch (error) {
			const errorMessage = getErrorMessage(error);
			const errorStack = getErrorStack(error);

			console.error("Error in createApiKey:", {
				error: errorMessage,
				stack: errorStack,
				timestamp: new Date().toISOString(),
			});

			// Handle specific error types
			if (
				errorMessageIncludes(error, "wallet not found") ||
				errorMessageIncludes(error, "user stake")
			) {
				return c.json(
					api_response({
						message: errorMessage,
						is_error: true,
					}),
					404
				);
			}

			if (
				errorMessageIncludes(error, "insufficient balance") ||
				errorMessageIncludes(error, "stake must be greater than 0")
			) {
				return c.json(
					api_response({
						message: errorMessage,
						is_error: true,
					}),
					402 // Payment Required
				);
			}

			// Generic server error
			return c.json(
				api_response({
					message: "Failed to create API Key. Please try again later.",
					is_error: true,
				}),
				500
			);
		}
	};

	public static readonly updateApiKey = async (c: Context) => {
		try {
			// Input validation
			let requestBody;
			try {
				requestBody = await c.req.json();
			} catch (parseError) {
				console.error("Invalid JSON in updateApiKey request:", parseError);
				return c.json(
					api_response({
						message: "Invalid JSON format in request body",
						is_error: true,
					}),
					400
				);
			}

			const { api_key_id } = requestBody;

			// Validate required fields
			if (!api_key_id || typeof api_key_id !== "string") {
				return c.json(
					api_response({
						message: "api_key_id is required and must be a non-empty string",
						is_error: true,
					}),
					400
				);
			}

			if (api_key_id.trim().length === 0) {
				return c.json(
					api_response({
						message: "api_key_id cannot be empty",
						is_error: true,
					}),
					400
				);
			}

			// Get user from context
			const user = await c.get("user");
			if (!user || !user.id) {
				console.error("User not found in context for updateApiKey");
				return c.json(
					api_response({
						message: "User authentication required",
						is_error: true,
					}),
					401
				);
			}

			const apiKey = await ApiKeyService.updateApiKey(
				api_key_id.trim(),
				user.id
			);
			return c.json(
				api_response({ message: "API Key updated successfully", data: apiKey })
			);
		} catch (error) {
			const errorMessage = getErrorMessage(error);
			const errorStack = getErrorStack(error);

			console.error("Error in updateApiKey:", {
				error: errorMessage,
				stack: errorStack,
				timestamp: new Date().toISOString(),
			});

			// Handle specific error types
			if (
				errorMessageIncludes(error, "wallet not found") ||
				errorMessageIncludes(error, "user stake")
			) {
				return c.json(
					api_response({
						message: errorMessage,
						is_error: true,
					}),
					404
				);
			}

			if (
				errorMessageIncludes(error, "insufficient balance") ||
				errorMessageIncludes(error, "stake must be greater than 0")
			) {
				return c.json(
					api_response({
						message: errorMessage,
						is_error: true,
					}),
					402 // Payment Required
				);
			}

			if (
				errorMessageIncludes(error, "not found") ||
				errorMessageIncludes(error, "does not exist")
			) {
				return c.json(
					api_response({
						message: "API Key not found",
						is_error: true,
					}),
					404
				);
			}

			if (
				errorMessageIncludes(error, "unauthorized") ||
				errorMessageIncludes(error, "permission")
			) {
				return c.json(
					api_response({
						message: "Unauthorized to update this API Key",
						is_error: true,
					}),
					403
				);
			}

			// Generic server error
			return c.json(
				api_response({
					message: "Failed to update API Key. Please try again later.",
					is_error: true,
				}),
				500
			);
		}
	};

	public static readonly deleteApiKey = async (c: Context) => {
		try {
			// Input validation
			let requestBody;
			try {
				requestBody = await c.req.json();
			} catch (parseError) {
				console.error("Invalid JSON in deleteApiKey request:", parseError);
				return c.json(
					api_response({
						message: "Invalid JSON format in request body",
						is_error: true,
					}),
					400
				);
			}

			const { api_key_id } = requestBody;

			// Validate required fields
			if (!api_key_id || typeof api_key_id !== "string") {
				return c.json(
					api_response({
						message: "api_key_id is required and must be a non-empty string",
						is_error: true,
					}),
					400
				);
			}

			if (api_key_id.trim().length === 0) {
				return c.json(
					api_response({
						message: "api_key_id cannot be empty",
						is_error: true,
					}),
					400
				);
			}

			const apiKey = await ApiKeyService.deleteApiKey(api_key_id.trim());
			return c.json(
				api_response({ message: "API Key deleted successfully", data: apiKey })
			);
		} catch (error) {
			const errorMessage = getErrorMessage(error);
			const errorStack = getErrorStack(error);

			console.error("Error in deleteApiKey:", {
				error: errorMessage,
				stack: errorStack,
				timestamp: new Date().toISOString(),
			});

			// Handle specific error types
			if (
				errorMessageIncludes(error, "not found") ||
				errorMessageIncludes(error, "does not exist")
			) {
				return c.json(
					api_response({
						message: "API Key not found",
						is_error: true,
					}),
					404
				);
			}

			if (
				errorMessageIncludes(error, "unauthorized") ||
				errorMessageIncludes(error, "permission")
			) {
				return c.json(
					api_response({
						message: "Unauthorized to delete this API Key",
						is_error: true,
					}),
					403
				);
			}

			if (
				errorMessageIncludes(error, "already deleted") ||
				errorMessageIncludes(error, "inactive")
			) {
				return c.json(
					api_response({
						message: "API Key is already deleted or inactive",
						is_error: true,
					}),
					410 // Gone
				);
			}

			// Generic server error
			return c.json(
				api_response({
					message: "Failed to delete API Key. Please try again later.",
					is_error: true,
				}),
				500
			);
		}
	};

	public static readonly getAllApiKeys = async (c: Context) => {
		try {
			// Get user from context
			const user = await c.get("user");
			if (!user || !user.id) {
				console.error("User not found in context for getAllApiKeys");
				return c.json(
					api_response({
						message: "User authentication required",
						is_error: true,
					}),
					401
				);
			}

			const apiKeys = await ApiKeyService.getAllApiKeys(user.id);
			return c.json(
				api_response({
					message: "API Keys retrieved successfully",
					data: apiKeys,
				})
			);
		} catch (error) {
			const errorMessage = getErrorMessage(error);
			const errorStack = getErrorStack(error);

			console.error("Error in getAllApiKeys:", {
				error: errorMessage,
				stack: errorStack,
				timestamp: new Date().toISOString(),
			});

			// Handle specific error types
			if (
				errorMessageIncludes(error, "wallet not found") ||
				errorMessageIncludes(error, "user stake")
			) {
				return c.json(
					api_response({
						message: errorMessage,
						is_error: true,
					}),
					404
				);
			}

			// Generic server error
			return c.json(
				api_response({
					message: "Failed to retrieve API Keys. Please try again later.",
					is_error: true,
				}),
				500
			);
		}
	};
}
