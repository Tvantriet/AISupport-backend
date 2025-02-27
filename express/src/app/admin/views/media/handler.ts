import { PageHandler } from "adminjs";
import filesystemsModule from "../../../modules/FilesystemsModule.js";

export type FileData = {
	url: string;
	metadata: {
		kind: string;
		id: string;
		selfLink: string;
		mediaLink: string;
		name: string;
		bucket: string;
		generation: string;
		metageneration: string;
		contentType?: string;
		storageClass: string;
		size: string;
		md5Hash: string;
		contentEncoding: string;
		cacheControl: string;
		crc32c: string;
		etag: string;
		timeCreated: string;
		updated: string;
		timeStorageClassUpdated: string;
	};
};

export type MetaData = {
	maxResults?: number | null;
	pageToken?: string | null;
	nextPageToken?: string | null;
	filesToDelete?: string[] | null;
};

export const mediaPageHandler: PageHandler = async (request): Promise<FileData[] | Record<string, string>> => {
	const { nextPageToken, maxResults, filesToDelete } = request.query as MetaData;

	if (filesToDelete) {
		await filesystemsModule.deleteGoogleCloudFiles(filesToDelete);
	}

	if (maxResults) {
		const mediaData = await filesystemsModule.getGoogleCloudFiles(
			nextPageToken ?? undefined,
			parseInt(maxResults.toString(), 10),
		);

		// eslint-disable-next-line consistent-return
		return mediaData as FileData[];
	}

	return { message: "success" };
};
