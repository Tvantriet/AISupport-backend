/* eslint-disable @typescript-eslint/ban-ts-comment */
import dotenv from "dotenv";
dotenv.config();
import winston from "winston";
import { LoggingWinston } from "@google-cloud/logging-winston";

const levels = {
	emergency: 0,
	alert: 1,
	critical: 2,
	error: 3,
	warning: 4,
	notice: 5,
	info: 6,
	debug: 7,
};

// Set colors
const colors = {
	emergency: "red",
	alert: "red",
	critical: "red",
	error: "red",
	warning: "yellow",
	notice: "magenta",
	info: "cyan",
	debug: "white",
};
winston.addColors(colors);

// Format logging message
const format = winston.format.combine(
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
	winston.format.printf((info: any) => `${info.timestamp} ${info.level}: ${info.message}`),
);

// Print in console, and log file or cloud depending on env
const transports: any[] = [];

// FILE logging
if (process.env.LOG_TO_FILE === "1") {
	transports.push(
		new winston.transports.File({
			filename: "logs/error.log",
			// @ts-ignore
			level: "error",
		}),
	);

	transports.push(
		new winston.transports.File({
			filename: "logs/all.log",
		}),
	);
}

// GCP Logging
if (process.env.LOG_TO_GCP === "1") {
	transports.push(
		new LoggingWinston({
			serviceContext: {
				service: process.env.GCP_REPORTING_NAME ? process.env.GCP_REPORTING_NAME : process.env.APP_NAME,
				version: "1.0.0",
			},
			// @ts-ignore

			projectId: process.env.GCP_LOG_PROJECT ? process.env.GCP_LOG_PROJECT : undefined,
			keyFilename: process.env.GCP_LOG_KEYFILE ? process.env.GCP_LOG_KEYFILE : undefined,
			levels,
		}),
	);
}
// CONSOLE logging
else {
	transports.push(
		new winston.transports.Console({
			// @ts-ignore
			format: winston.format.combine(winston.format.colorize({ all: true })),
		}),
	);
}

// Initialize Logger
const WinstonLogger = winston.createLogger({
	level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "warning",
	levels,
	format,
	transports,
});

export default WinstonLogger;
