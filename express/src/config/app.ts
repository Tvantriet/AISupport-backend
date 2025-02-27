import dotenv from "dotenv";

dotenv.config();

const redisDb = parseInt(process.env.REDIS_DB ? process.env.REDIS_DB : "nan", 10);
if (process.env.REDIS_ENABLED === "1") {
	if (isNaN(redisDb) || redisDb < 0 || redisDb > 15)
		throw new Error("Misconfigured REDIS_DB: must be between 0 and 15");
}

export default {
	/*
    |--------------------------------------------------------------------------
    | Application Environment
    |--------------------------------------------------------------------------
    |
    | This value determines the "environment" your application is currently
    | running in. This may determine how you prefer to configure various
    | services the application utilizes. Set this in your ".env" file.
    |
    */

	env: process.env.APP_ENV,

	/*
       |--------------------------------------------------------------------------
       | Application URL
       |--------------------------------------------------------------------------
       */

	url: process.env.APP_URL ? process.env.APP_URL : "",

	/*
        |--------------------------------------------------------------------------
        | Application Timezone
        |--------------------------------------------------------------------------
        |
        | Here you may specify the default timezone for your application, which
        | will be used by the PHP date and date-time functions. We have gone
        | ahead and set this to a sensible default for you out of the box.
        |
        */

	timezone: "Europe/Amsterdam",

	/*
    |--------------------------------------------------------------------------
    | Application Locale Configuration
    |--------------------------------------------------------------------------
    |
    | The application locale determines the default locale that will be used
    | by the translation service provider. You are free to set this value
    | to any of the locales which will be supported by the application.
    |
    */

	locale: "en",

	/*
    |--------------------------------------------------------------------------
    | Routes configuration
    |--------------------------------------------------------------------------
    |
    | Determines which routes to load, e.g. api, cms and/or cron
    |
    */

	loadRoutes: process.env.LOAD_ROUTES,

	/*
    |--------------------------------------------------------------------------
    | Encryption Key
    |--------------------------------------------------------------------------
    |
    | This key is used by the Crypt service and should be set
    | to a random, 32 character string, otherwise these encrypted strings
    | will not be safe. Please do this before deploying an application!
    |
    */

	encryption: {
		key: process.env.APP_KEY,
		cipher: "AES-256-CBC",
		sha: "sha256",
	},

	/*
    |--------------------------------------------------------------------------
    | Cache configuration
    |--------------------------------------------------------------------------
    |
    | Configure the Redis cache
    |
    */

	redis: {
		url: process.env.REDIS_URL,
		enabled: process.env.REDIS_ENABLED === "1",
		useForCache: process.env.REDIS_ENABLED === "1" && process.env.USE_REDIS_FOR_CACHE === "1",
		db: redisDb,
	},

	/*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Settings for rate limiting middleware
    |
    */

	rateLimit: {
		windowMs: 15 * 60 * 1000,
		max: 100,
	},

	/*
    |--------------------------------------------------------------------------
    | Views Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may specify the views configuration,
    | like the view engine.
    |
    */

	views: {
		engine: "ejs",
	},

	/*
    |--------------------------------------------------------------------------
    | Paths Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may specify the paths to the controllers, models
    | or other folders. Is used for commands.
    |
    */

	paths: {
		controllersPath: "/src/app/Controllers/",
		modelsPath: "/src/app/Models/",
		routesPath: "/src/app/routes/",
	},

	/*
       |--------------------------------------------------------------------------
       | Google cloud Settings
       |--------------------------------------------------------------------------
       */

	googleCloud: {
		bucket: process.env.GCLOUD_BUCKET,
		keyFileGcs: process.env.GCLOUD_BUCKET_KEY_FILE,
	},

	/*
    |--------------------------------------------------------------------------
    | Cms setup
    |--------------------------------------------------------------------------
    */

	adminPanel: {
		enabled: process.env.ADMIN_PANEL_ENABLED === "1",
		sessionSecret: process.env.ADMINJS_SESSION_SECRET ?? "",
		cookieSecureHeader: process.env.APP_ENV !== "development",
		supportedTranslations: process.env.ADMIN_JS_SUPPORTED_TRANSLATIONS ?? ["english"], // TODO ==> take out when ready
		visualReturnErrorTypes: ["QueryFailedError"],
	},

	/*
    |--------------------------------------------------------------------------
    | Other
    |--------------------------------------------------------------------------
    */
};
