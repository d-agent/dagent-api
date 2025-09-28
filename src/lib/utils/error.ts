// Utility function to safely extract error message from unknown error type
export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unknown error occurred';
};

// Utility function to safely extract error stack from unknown error type
export const getErrorStack = (error: unknown): string | undefined => {
	if (error instanceof Error) {
		return error.stack;
	}
	return undefined;
};

// Utility function to check if error message includes specific text
export const errorMessageIncludes = (error: unknown, text: string): boolean => {
	const message = getErrorMessage(error);
	return message.toLowerCase().includes(text.toLowerCase());
};
