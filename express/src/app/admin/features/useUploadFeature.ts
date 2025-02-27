/* eslint-disable no-param-reassign */
import { ActionRequest, ActionResponse, buildFeature, FeatureType, ActionContext } from "adminjs";
import { FilesystemsModule } from "../../modules/FilesystemsModule.js";
import { isPOSTMethod } from "../utils/admin.utils.js";
import config from "../../../config/app.js";

type PropertyDestination = {
	property: string;
};

/**
 * This feature allows for uploads to google cloud,
 * records are processed flattened be sure to make properties flattened paths aswell.
 * example: ['media', 'sponsor.deeply.nested.image']
 *
 * @param {PropertyDestination | PropertyDestination[]} props - The destination property or an array of them.
 * @returns {FeatureType} - The upload feature object.
 */
export const useUploadFeature = (props: PropertyDestination | PropertyDestination[]): FeatureType => {
	const filesystemsModule = new FilesystemsModule(config.googleCloud.bucket);

	/**
	 * Uploads a file to the Google Cloud Storage and updates the record with the file URL.
	 *
	 * @param {Buffer} buffer - The file buffer.
	 * @param {string} fileName - The file name.
	 * @param {string} fileType - The file type.
	 * @param {string} destination - The destination property name.
	 */
	const uploadToCloudStorage = async (buffer: Buffer, fileName: string, fileType: string, destination: string) => {
		const upload = await filesystemsModule.uploadGoogleCloudFileCms(buffer, fileName, fileType, destination, true);
		return { url: upload?.url, name: upload?.fileName };
	};

	const after = async (response: ActionResponse, request: ActionRequest, context: ActionContext) => {
		if (context.record && isPOSTMethod(request)) {
			const { record, uploadedFiles } = context;

			if (!record.isValid() && uploadedFiles) {
				// If invalid we delete newly uploaded files from bucket
				await filesystemsModule.deleteGoogleCloudFiles(uploadedFiles);
			}
		}
		return response;
	};

	const before = async (request: ActionRequest, context: Record<string, unknown>) => {
		if (request.payload && isPOSTMethod(request)) {
			const { payload } = request;
			const files: string[] = [];
			if (props) {
				const properties = Array.isArray(props) ? props : [props];

				await Promise.all(
					properties.map(async ({ property }) => {
						if (!payload[property]?.match(/data:(.+);base64,(.*)$/)) return;
						// Parse file data and upload to bucket
						const [fileName, fileData, base64Data] = payload[property].split(";");
						const buffer = Buffer.from(base64Data.replace("base64,", ""), "base64"); // FileBuffer
						const fileType = fileData.replace("data:", ""); // Example: image/jpeg

						const { url, name } = await uploadToCloudStorage(buffer, fileName, fileType, "cms/uploads");
						payload[property] = url;
						files.push(name);
					}),
				);
			}
			context.uploadedFiles = files;
		}
		return request;
	};

	return buildFeature({
		actions: {
			new: { before: [before], after: [after] },
			edit: { before: [before], after: [after] },
			delete: { isAccessible: false },
			bulkDelete: { isAccessible: false },
		},
	});
};
