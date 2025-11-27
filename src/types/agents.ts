// schema changes
export interface IURI {
	uri: string;
}

export interface IApp extends IURI {
	app_name: string;
}

export interface ICreateSessionParams extends IApp {
	userId: number;
	sessionId: string;
}

export interface IListSessionsParams extends IApp {
	userId: number;
}

// Response types
export interface IResponseListApps {
	apps: string[];
}

export interface IVideoMetadata {
	fps: number;
	endOffset: string;
	startOffset: string;
}

export interface IInlineData {
	displayName: string;
	data: string;
	mimeType: string;
}

export interface IFileData {
	displayName: string;
	fileUri: string;
	mimeType: string;
}

export interface IFunctionCall {
	id: string;
	args: {
		additionalProp1?: any;
	};
	name: string;
}

export interface ICodeExecutionResult {
	outcome: string;
	output: string;
}

export interface IExecutableCode {
	code: string;
	language: string;
}

export interface IFunctionResponse {
	willContinue: boolean;
	scheduling: string;
	id: string;
	name: string;
	response: {
		additionalProp1?: any;
	};
}

export interface IContentPart {
	videoMetadata?: IVideoMetadata;
	thought?: boolean;
	inlineData?: IInlineData;
	fileData?: IFileData;
	thoughtSignature?: string;
	functionCall?: IFunctionCall;
	codeExecutionResult?: ICodeExecutionResult;
	executableCode?: IExecutableCode;
	functionResponse?: IFunctionResponse;
	text?: string;
}

export interface IContent {
	parts: IContentPart[];
	role: string;
}

export interface IGroundingMetadata {
	googleMapsWidgetContextToken: string;
	groundingChunks: Array<any>;
	groundingSupports: Array<any>;
	retrievalMetadata: any;
	retrievalQueries: string[];
	searchEntryPoint: any;
	webSearchQueries: string[];
}

export interface ISessionEvent {
	content: IContent;
	groundingMetadata?: IGroundingMetadata;
	partial?: boolean;
	turnComplete?: boolean;
	finishReason?: string;
	errorCode?: string;
	errorMessage?: string;
	interrupted?: boolean;
	customMetadata?: {
		additionalProp1?: any;
	};
	usageMetadata?: any;
	liveSessionResumptionUpdate?: any;
	inputTranscription?: any;
	outputTranscription?: any;
	invocationId?: string;
	author?: string;
	actions?: any;
	longRunningToolIds?: string[];
	branch?: string;
	id?: string;
	timestamp?: number;
}

export interface ISession {
	id: string;
	appName: string;
	userId: string;
	state: {
		additionalProp1?: any;
	};
	events: ISessionEvent[];
	lastUpdateTime: number;
}

export interface IResponseCreateSession extends ISession {}
