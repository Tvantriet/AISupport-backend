import "reflect-metadata";
import { ColumnType, DataSource, DataSourceOptions } from "typeorm";
import { join } from "path";
import { dirName } from "../app/utils/MiscHelpers.js";
import database from "../config/database.js";

const parentDir = join(dirName(import.meta), "..");

const config = database.connections[database.default];

const connectionOpts: DataSourceOptions = {
	type: config.type,
	host: config.host,
	port: config.port,
	username: config.username,
	password: config.password,
	database: config.database,
	entities: [`${parentDir}/**/*.entity.{ts,js}`],
	synchronize: false,
	migrationsRun: false,
	extra: {
		connectionLimit: config.connectionLimit,
	},
	logger: undefined, // logger: new CustomLogger('all', ['query'])
};

export const AppDataSource = new DataSource(connectionOpts);

if (config.addVectorSupport) {
	AppDataSource.driver.supportedDataTypes.push("vector" as ColumnType);
	AppDataSource.driver.withLengthColumnTypes.push("vector" as ColumnType);
}

export const dbConnection = async () => {
	await AppDataSource.initialize();
};
