/* eslint-disable @typescript-eslint/no-explicit-any */
import { Bucket, GetSignedUrlConfig, Storage } from "@google-cloud/storage";
import fs from "fs";
import lodash from "lodash";
import { Response } from "express";
import { OutgoingHttpHeaders } from "http2";
import Crypt from "../utils/Crypt.js";
import appConfig from "../../config/app.js";
import Logger from "../utils/Logger.js";
import getErrorMessage from "../utils/ErrorMessage.js";
import { DateTime } from "luxon";

type SignedUrlAcl =
	| "private"
	| "bucket-owner-read"
	| "bucket-owner-full-control"
	| "project-private"
	| "authenticated-read"
	| "public-read"
	| "public-read-write";
type SignedUrlAction = "read" | "write" | "delete" | "resumable";
interface GetSignedUrlRes {
	url: string;
	headers: OutgoingHttpHeaders | undefined;
}

export class FilesystemsModule {
	private readonly gcBucket!: Bucket;

	constructor(bucketName = "") {
		// eslint-disable-next-line no-param-reassign
		bucketName = bucketName || String(appConfig.googleCloud.bucket);
		const storage = new Storage({ keyFilename: appConfig.googleCloud.keyFileGcs });

		if (bucketName.length > 0) this.gcBucket = storage.bucket(bucketName);
	}

	/**
	 * Returns signed url and additional headers belonging to that url.
	 * @param filename
	 * @param mimetype
	 * @param action 'read' | 'write' | 'delete' | 'resumable'
	 * @param expires in ms
	 * @param acl 'private' | 'bucket-owner-read' | 'bucket-owner-full-control' | 'project-private'| 'authenticated-read' | 'public-read' | 'public-read-write'
	 * @param setResponseDisposition set to true to 'force download'
	 */
	public async getSignedUrl(
		filename: string,
		mimetype: string,
		action: SignedUrlAction,
		expires: number,
		acl: SignedUrlAcl,
		setResponseDisposition: boolean,
		// fileSize: number
	): Promise<GetSignedUrlRes> {
		const config: GetSignedUrlConfig = {
			version: "v4",
			action,
			expires: DateTime.utc().plus({ milliseconds: expires }).toFormat("yyyy-LL-dd HH:mm:ss"),
		};

		if (action != "read") {
			config.contentType = mimetype;
			config.extensionHeaders = {
				"x-goog-acl": acl,
				// 'x-upload-content-length': `${fileSize}`,
			};
		}

		if (setResponseDisposition) config.responseDisposition = "attachment";

		try {
			const res = await this.gcBucket.file(filename).getSignedUrl(config);
			const headers = config.extensionHeaders;
			return { url: res[0], headers };
		} catch (error: any) {
			Logger.error(getErrorMessage(error));
			throw new Error(`Problem with generating signedUrl for ${filename}`);
		}
	}

	/**
	 * Upload file
	 *
	 * @param storage
	 * @param file
	 * @param destinationPath
	 * @param isPublic
	 * @param uniqueId
	 */
	public async uploadFile(storage: string, file: any, destinationPath: string, isPublic = true, uniqueId = "") {
		const fileName = `${uniqueId}${lodash.replace(file.name, " ", "_")}`;
		// Check which store method to use
		switch (storage) {
			case "local":
				return this.uploadLocalFile(file, fileName, destinationPath);
			case "public":
				return this.uploadPublicFile(file, fileName, destinationPath);
			case "gcs":
				if (!this.gcBucket) throw new Error("Cloud Storage bucket not specified");
				return this.uploadGoogleCloudFile(file, fileName, file.type, destinationPath, isPublic);
			default:
				return this.uploadLocalFile(file, fileName, destinationPath);
		}
	}

	/**
	 * Get local file out of storage
	 *
	 * @param res
	 * @param url
	 */
	public getLocalFile(res: Response, url: string) {
		const filePath = `${process.cwd()}/src/storage/${url}`;
		if (!fs.existsSync(filePath)) {
			return {
				success: false,
			};
		}
		return {
			success: true,
			file: fs.readFileSync(filePath),
		};
	}

	/**
	 * Get mimetype of a filename
	 *
	 * @param fileName
	 * @return {string}
	 */
	public getMimeType(fileName: string) {
		return fileName.substring(fileName.lastIndexOf(".") + 1);
	}

	/**
	 * upload file to storage folder
	 *
	 * @param file
	 * @param fileName
	 * @param destinationPath
	 * @private
	 * @return {{message: string, url: string}}
	 */
	private uploadLocalFile(file: any, fileName: string, destinationPath: string): { message: string; url: string } {
		const dir = `${process.cwd()}/src/storage/${destinationPath}`;
		const filePath = `${dir}/${fileName}`;
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
		// Upload file
		fs.writeFileSync(filePath, file.data);
		return {
			message: `Uploaded the file successfully: ${fileName}`,
			url: `${destinationPath}/${fileName}`,
		};
	}

	/**
	 * upload file to public folder
	 *
	 * @param file
	 * @param fileName
	 * @param destinationPath
	 * @private
	 */
	private uploadPublicFile(file: any, fileName: string, destinationPath: string) {
		if (!appConfig.url) throw new Error("APP_URL not specified");

		const dir = `${process.cwd()}/src/public/${destinationPath}`;
		const filePath = `${dir}/${fileName}`;
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
		// Upload file
		fs.writeFileSync(filePath, file.data);
		return {
			message: `Uploaded the file successfully: ${fileName}`,
			url: `${appConfig.url}/${destinationPath}/${fileName}`,
		};
	}

	/**
	 * upload file to Google Cloud Storage
	 *
	 * @param file
	 * @param fileName
	 * @param fileType
	 * @param destinationPath
	 * @param isPublic
	 */
	public async uploadGoogleCloudFile(
		file: Buffer,
		fileName: string,
		fileType: string,
		destinationPath: string,
		isPublic: boolean,
	) {
		// Name file
		const fileLocation = this.gcBucket.file(`${destinationPath}/${Crypt.hash(fileName)}`);

		// Upload file
		const uploadProgress = new Promise<void>((resolve, reject) => {
			const streamUpload = fileLocation
				.createWriteStream({
					resumable: false,
					gzip: true,
					public: isPublic,
					metadata: {
						contentType: fileType,
						cacheControl: `${isPublic ? "public" : "private"}, max-age=31536000`,
					},
				})
				.on("error", (err) => {
					reject(err);
				})
				.on("finish", () => {
					resolve();
				});

			streamUpload.end(file);
		});
		await uploadProgress;

		return {
			message: `Uploaded the file successfully: ${fileName}`,
			url: fileLocation?.publicUrl(),
			fileName: `${destinationPath}/${Crypt.hash(fileName)}`,
		};
	}

	/**
	 * upload file to Google Cloud Storage
	 *
	 * @param file
	 * @param fileName
	 * @param fileType
	 * @param destinationPath
	 * @param isPublic
	 */
	public async uploadGoogleCloudFileCms(
		file: Buffer,
		fileName: string,
		fileType: string,
		destinationPath: string,
		isPublic: boolean,
	) {
		// Name file
		const fileLocation = this.gcBucket.file(`${destinationPath}/${Crypt.hash(fileName)}`);

		// Upload file
		const uploadProgress = new Promise<void>((resolve, reject) => {
			const streamUpload = fileLocation
				.createWriteStream({
					resumable: false,
					gzip: true,
					public: isPublic,
					metadata: {
						contentType: fileType,
						cacheControl: `${isPublic ? "public" : "private"}, max-age=31536000`,
					},
				})
				.on("error", (err) => {
					reject(err);
				})
				.on("finish", () => {
					resolve();
				});

			streamUpload.end(file);
		});
		await uploadProgress;

		return {
			message: `Uploaded the file successfully: ${fileName}`,
			url: fileLocation?.publicUrl(),
			fileName: `${destinationPath}/${Crypt.hash(fileName)}`,
		};
	}

	/**
	 * Grab paginated file urls from google cloud bucket
	 *
	 * @param nextPageToken
	 * @param maxResults
	 * @returns
	 */
	public async getGoogleCloudFiles(nextPageToken?: string, maxResults?: number): Promise<any> {
		if (!this.gcBucket) return null;

		const [files, responseMetadata, next] = await this.gcBucket.getFiles({
			maxResults: maxResults ?? 20,
			pageToken: nextPageToken,
		});

		const fileData = files.map((file) => ({ url: file.publicUrl(), metadata: file.metadata }));
		return { fileData, responseMetadata: { ...responseMetadata, nextPageToken: next.nextPageToken } };
	}

	/**
	 * Delete files by filename from google cloud bucket
	 *
	 * @param {string[]}fileNames
	 * @returns
	 */
	public async deleteGoogleCloudFiles(fileNames: string[]) {
		const promises: Promise<any>[] = [];
		fileNames.forEach((file) => {
			promises.push(this.gcBucket.file(file).delete());
		});
		await Promise.all(promises);
		Logger.info(`Deleted files successfully: ${fileNames}`);
	}
}

const filesystemsModule = new FilesystemsModule();
export default filesystemsModule;
