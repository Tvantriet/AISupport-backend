import database from "../config/database.js";
import lodash from "lodash";

const config = database.connections[database.default];

export default {
	development: {
		client: config.client,
		connection: {
			host: config.host,
			port: config.port,
			database: config.database,
			user: config.username,
			password: config.password,
		},
		migrations: {
			tableName: "knex_migrations",
			extension: "ts",
			directory: "migrations",
			disableMigrationsListValidation: true,
			loadExtensions: [".ts"],
		},
		seeds: {
			extension: "ts",
			directory: "seeders",
		},
		pool: {
			min: 2,
			max: config.connectionLimit,
		},
	},
	testing: {
		client: config.client,
		connection: {
			host: process.env.DB_HOST_TEST,
			port: lodash.parseInt(process.env.DB_PORT_TEST),
			database: process.env.DB_DATABASE_TEST,
			user: process.env.DB_USERNAME_TEST,
			password: process.env.DB_PASSWORD_TEST,
		},
		migrations: {
			tableName: "knex_migrations",
			extension: "ts",
			directory: "migrations",
			disableMigrationsListValidation: true,
			loadExtensions: [".ts"],
		},
		seeds: {
			extension: "ts",
			directory: "seeders",
		},
		pool: {
			min: 2,
			max: config.connectionLimit,
		},
	},
	integration: {
		client: config.client,
		connection: {
			host: process.env.DB_HOST_INT,
			port: lodash.parseInt(process.env.DB_PORT_INT),
			database: process.env.DB_DATABASE_INT,
			user: process.env.DB_USERNAME_INT,
			password: process.env.DB_PASSWORD_INT,
		},
		migrations: {
			tableName: "knex_migrations",
			extension: "ts",
			directory: "migrations",
			disableMigrationsListValidation: true,
			loadExtensions: [".ts"],
		},
		seeds: {
			extension: "ts",
			directory: "seeders",
		},
		pool: {
			min: 2,
			max: config.connectionLimit,
		},
	},
	staging: {
		client: config.client,
		connection: {
			host: process.env.DB_HOST_STAGE,
			port: lodash.parseInt(process.env.DB_PORT_STAGE),
			database: process.env.DB_DATABASE_STAGE,
			user: process.env.DB_USERNAME_STAGE,
			password: process.env.DB_PASSWORD_STAGE,
		},
		migrations: {
			tableName: "knex_migrations",
			extension: "ts",
			directory: "migrations",
			disableMigrationsListValidation: true,
			loadExtensions: [".ts"],
		},
		seeds: {
			extension: "ts",
			directory: "seeders",
		},
		pool: {
			min: 2,
			max: config.connectionLimit,
		},
	},
	production: {
		client: config.client,
		connection: {
			host: process.env.DB_HOST_PROD,
			port: lodash.parseInt(process.env.DB_PORT_PROD),
			database: process.env.DB_DATABASE_PROD,
			user: process.env.DB_USERNAME_PROD,
			password: process.env.DB_PASSWORD_PROD,
		},
		migrations: {
			tableName: "knex_migrations",
			extension: "ts",
			directory: "migrations",
			disableMigrationsListValidation: true,
			loadExtensions: [".ts"],
		},
		seeds: {
			extension: "ts",
			directory: "seeders",
		},
		extra: {
			connectionLimit: config.connectionLimit,
		},
		pool: {
			min: 2,
			max: config.connectionLimit,
		},
	},
};
