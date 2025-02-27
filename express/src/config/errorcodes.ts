const config = {
	// Authentication errors
	forbidden: {
		errorCode: "FORBIDDEN",
		message: "The user lacks permissions to perform this action",
		status: 403,
	},
	authorizationInvalid: {
		errorCode: "AUTHORIZATION_INVALID",
		message: "Authorization is invalid for this operation.",
		status: 401,
	},
	authorizationExpired: {
		errorCode: "AUTHORIZATION_EXPIRED",
		message: "Authorization has expired.",
		status: 403,
	},
	blocked: {
		errorCode: "BLOCKED",
		message: "The user's account is blocked.",
		status: 403,
	},
	// Content errors
	notFound: {
		errorCode: "NOT_FOUND",
		message: "The requested content is not available or does not exist",
		status: 404,
	},
	unavailable: {
		errorCode: "UNAVAILABLE",
		message: "The requested content is not available or does not exist",
		status: 404,
	},
	badRequest: {
		errorCode: "BAD_REQUEST",
		message: "The request is malformed or missing required parameters.",
		status: 400,
	},
	// Server errors
	serverError: {
		errorCode: "INTERNAL_SERVER_ERROR",
		message: "An internal server error occurred while processing your request.",
		status: 500,
	},
};

export default config;
