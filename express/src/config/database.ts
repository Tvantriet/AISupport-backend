import dotenv from "dotenv";
import * as process from "process";
import lodash from "lodash";

dotenv.config({ path: "../../.env" });

export default {
	/*
    |--------------------------------------------------------------------------
    | Default Database Connection Name
    |--------------------------------------------------------------------------
    |
    | Here you may specify which of the database connections below you wish
    | to use as your default connection for all database work. Of course
    | you may use many connections at once using the Database library.
    |
    */
	default: process.env.DB_CONNECTION ?? "mysql",

	/*
    |--------------------------------------------------------------------------
    | Database enabled
    |--------------------------------------------------------------------------
    |
    | Here you may specify if database needs to be enabled
    |
    */
	enabled: process.env.DB_ENABLED === "1",

	/*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    |
    | Here are each of the database connections setup for your application.
    | Of course, examples of configuring each database platform that is
    | supported by Laravel is shown below to make development simple.
    |
    |
    | All database work in Laravel is done through the PHP PDO facilities
    | so make sure you have the driver for your particular database of
    | choice installed on your machine before you begin development.
    |
    */
	connections: {
		mysql: {
			client: "mysql2",
			type: "mysql",
			host: process.env.DB_HOST ?? "127.0.0.1",
			port: process.env.DB_PORT ? lodash.parseInt(process.env.DB_PORT) : 3306,
			database: process.env.DB_DATABASE ?? "forge",
			username: process.env.DB_USERNAME ?? "forge",
			password: process.env.DB_PASSWORD ?? "",
			connectionLimit: process.env.DB_CONNECTION_LIMIT ? lodash.parseInt(process.env.DB_CONNECTION_LIMIT) : 100,
			addVectorSupport: process.env.DB_ADD_VECTOR_SUPPORT === "1",
		},
		postgres: {
			client: "pg",
			type: "postgres",
			host: process.env.DB_HOST ?? "127.0.0.1",
			port: process.env.DB_PORT ? lodash.parseInt(process.env.DB_PORT) : 5432,
			database: process.env.DB_DATABASE ?? "forge",
			username: process.env.DB_USERNAME ?? "forge",
			password: process.env.DB_PASSWORD ?? "",
			connectionLimit: process.env.DB_CONNECTION_LIMIT ? lodash.parseInt(process.env.DB_CONNECTION_LIMIT) : 100,
			addVectorSupport: process.env.DB_ADD_VECTOR_SUPPORT === "1",
		},
	},
};
