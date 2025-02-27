import dotenv from "dotenv";
import Logger from "../app/utils/Logger.js";

dotenv.config();

let corsAllowedOrigins: string[] = [];

// On dev/local allow all
if (process.env.APP_ENV === "local" || process.env.APP_ENV === "development") corsAllowedOrigins = ["*"];
else {
	// Add from ENV if set
	if (process.env.CORS_ALLOWED_ORIGINS) corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS.split(",");
}

export default {
	/*
       |--------------------------------------------------------------------------
       | Cors Settings
       |--------------------------------------------------------------------------
       */

	cors(req: any, callback: any) {
		const corsOptions = {
			origin: false,
			methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
			allowedHeaders: undefined,
			exposedHeaders: undefined,
			credentials: true,
			maxAge: undefined,
			preflightContinue: undefined,
			optionsSuccessStatus: 204,
		};

		const origin = req.header("Origin");

		Logger.debug(`Checking origin '${origin}' against '${JSON.stringify(corsAllowedOrigins)}'`);

		// Origin not set at all? Allow the request as it's not coming from a browser.
		if (!origin) {
			Logger.debug(`Allowing origin '${origin}' as it is not set - likely a server-to-server call`);
			corsOptions.origin = true;
			callback(null, corsOptions);
			return;
		}

		// Allowing all origins? (Should be on dev only!)
		if (corsAllowedOrigins && corsAllowedOrigins.length && corsAllowedOrigins[0] === "*") {
			Logger.debug(`Allowing origin '${origin}' as configured array contains a star`);
			corsOptions.origin = true;
			callback(null, corsOptions);
			return;
		}

		// Allowing configured origin?
		if (corsAllowedOrigins.indexOf(origin) !== -1) {
			Logger.debug(`Allowing origin '${origin}' as it was found in configured array`);
			corsOptions.origin = true;
			callback(null, corsOptions);
			return;
		}

		// On non-prod also allow localhost and private IP's
		if (process.env.APP_ENV !== "production") {
			Logger.debug(`Checking origin '${origin}' for nonprod env`);

			// Helper function to check if an IP is a private IP
			const isPrivateIP = function (ip: string) {
				const parts = ip.split(".");

				Logger.debug(`Checking if string '${ip}' is a private IP`);

				if (!parts || !parts.length || parts.length !== 4) return false;

				return (
					parts[0] === "10" ||
					(parts[0] === "172" && parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31) ||
					(parts[0] === "192" && parts[1] === "168")
				);
			};

			// Allow both HTTP and HTTPS protocols
			for (const prefix1 of ["http://", "https://"]) {
				if (origin.startsWith(prefix1)) {
					// Strip the protocol from the start of the string
					let hostOnly = origin.substring(prefix1.length);

					// Strip the port from the end of the string, if any
					const colonIndex = hostOnly.indexOf(":");
					if (colonIndex !== -1) hostOnly = hostOnly.substring(0, colonIndex);

					Logger.debug(`Checking if string '${hostOnly}' is localhost or a private IP`);

					// Check if localhost or a private ip
					if (hostOnly === "localhost" || isPrivateIP(hostOnly)) {
						Logger.debug(`Allowing origin '${origin}' as it was localhost or a private IP`);
						corsOptions.origin = true;
						callback(null, corsOptions);
						return;
					}
				}
			}
		}

		Logger.debug(`Denying origin '${origin}'`);
		corsOptions.origin = false;
		callback(null, corsOptions);
	},

	/*
      |--------------------------------------------------------------------------
      | Helmet Settings
      |--------------------------------------------------------------------------
      */

	helmet: {
		contentSecurityPolicy: {
			useDefaults: true,
			directives: {
				scriptSrc: ["'self'", "'unsafe-inline'"], // TODO ==> make nonce
				imgSrc: ["'self'", "blob:", "https://storage.googleapis.com/"],
				mediaSrc: ["'self'", "blob:", "https://storage.googleapis.com/"],
			},
		},
		crossOriginEmbedderPolicy: false,
		crossOriginOpenerPolicy: true,
		crossOriginResourcePolicy: true,
		expectCt: true,
		referrerPolicy: true,
		hsts: true,
		noSniff: true,
		originAgentCluster: true,
		dnsPrefetchControl: true,
		ieNoOpen: true,
		frameguard: true,
		permittedCrossDomainPolicies: true,
		hidePoweredBy: true,
		xssFilter: true,
	},

	/*
    |--------------------------------------------------------------------------
    | Authorization
    |--------------------------------------------------------------------------
    |
    | Configure authorization for application.
    | For example api secret or basic authentication
    |
    */

	secret: process.env.SERVER_SECRET,
	jwtSecret: process.env.JWT_SECRET,
	basicAuth: {
		username: process.env.BASIC_AUTH_USERNAME,
		password: process.env.BASIC_AUTH_PASSWORD,
	},

	/*
      |--------------------------------------------------------------------------
      | Firebase Settings
      |--------------------------------------------------------------------------
      */

	firebase: {
		method: "custom",
		requireMailValidation: true,
	},
};
