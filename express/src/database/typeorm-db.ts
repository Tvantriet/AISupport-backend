import "reflect-metadata";
import { ColumnType, DataSource, DataSourceOptions } from "typeorm";
import { join } from "path";
import { dirName } from "../app/utils/MiscHelpers.js";
import database from "../config/database.js";
import { Document } from "../app/models/Document.entity.js";
import { Product } from "../app/models/Product.entity.js";
import { Category } from "../app/models/Category.entity.js";
import { Point } from "../app/models/Point.entity.js";
import dotenv from "dotenv";

dotenv.config();

const parentDir = join(dirName(import.meta), "..");

const config = database.connections[database.default];

let connectionOpts: DataSourceOptions;
const connectionString: string = process.env.DATABASE_URL
console.log(connectionString)
// Use connection string if available
if (connectionString) {
	console.log("Using connection string... [typeorm-db]");
	connectionOpts = {
		type: "postgres",
		url: connectionString,
		entities: [Document, Product, Category, Point],
		synchronize: false,
		migrationsRun: false,
		logging: true, // Enable to see SQL queries
		ssl: {
			rejectUnauthorized: true
		},
		extra: {
			connectionLimit: config.connectionLimit,
		},
		logger: undefined, // logger: new CustomLogger('all', ['query'])
	};
} else {
	// Fall back to individual connection parameters
	console.log("Falling back to individual connection parameters... [typeorm-db]");
	connectionOpts = {
		type: config.type,
		host: config.host,
		port: config.port,
		username: config.username,
		password: config.password,
		database: config.database,
		entities: [Document, Product, Category, Point],
		synchronize: false,
		migrationsRun: false,
		extra: {
			connectionLimit: config.connectionLimit,
		},
		logger: undefined, // logger: new CustomLogger('all', ['query'])
	};
}

export const AppDataSource = new DataSource(connectionOpts);

AppDataSource.driver.supportedDataTypes.push("vector" as ColumnType);
AppDataSource.driver.withLengthColumnTypes.push("vector" as ColumnType);

export const dbConnection = async () => {
	console.log("Initializing database connection...");
	await AppDataSource.initialize();
	await AppDataSource.query(`
		CREATE INDEX IF NOT EXISTS point_embedding_hnsw_idx 
		ON points 
		USING hnsw (embedding vector_l2_ops)
		WITH (m = 16, ef_construction = 64);
	`);
};
