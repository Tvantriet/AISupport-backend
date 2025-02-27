import sharp from "sharp";
import lodash from "lodash";
import Filesystems from "./FilesystemsModule.js";

export class ImageModule {
	// quality between 1 and 100
	private readonly quality = 80;
	public readonly allowedMimeTypes: string[];

	constructor(allowedMimeTypes: string[]) {
		this.allowedMimeTypes = allowedMimeTypes;
	}

	/**
	 *
	 * @param bufferOfImage
	 * @return {Promise<{width: number | undefined, height: number | undefined}>}
	 */
	public async getImageDimensions(bufferOfImage: Buffer) {
		const image = sharp(bufferOfImage, { failOnError: true });
		const metadata = await image.metadata();
		return {
			width: metadata.width,
			height: metadata.height,
		};
	}

	/**
	 *
	 * @param fileName
	 * @return {{success: boolean} | {success: boolean, errorMessage: string}}
	 */
	public isImage(fileName: string) {
		const mimeType = Filesystems.getMimeType(fileName);
		if (this.allowedMimeTypes.includes(mimeType)) {
			return {
				success: true,
			};
		}
		return {
			success: false,
			errorMessage:
				"Invalid file extension " +
				mimeType +
				". Only " +
				lodash.join(this.allowedMimeTypes, ", ") +
				" are allowed",
		};
	}

	/**
	 * Resizes image but does not impact resolution
	 *
	 * @param bufferOfImage
	 * @param width
	 * @param height
	 * @return {Promise<Buffer>}
	 */
	public async resizeImage(bufferOfImage: Buffer, width: number, height: number) {
		return await sharp(bufferOfImage)
			.resize({
				fit: sharp.fit.inside,
				width,
				height,
			})
			.webp({ lossless: true, quality: this.quality })
			.toBuffer();
	}

	/**
	 *
	 * @param bufferOfImage
	 * @param width
	 * @param height
	 * @param left
	 * @param top
	 * @return {Promise<Buffer>}
	 */
	public async cropImage(bufferOfImage: Buffer, width: number, height: number, left: number, top: number) {
		await sharp(bufferOfImage)
			.extract({ width, height, left, top })
			.webp({ lossless: true, quality: this.quality })
			.toBuffer();
	}

	/**
	 *
	 * @param bufferOfImage
	 * @return {Promise<Buffer>}
	 */
	public async convertToPng(bufferOfImage: Buffer) {
		return sharp(bufferOfImage).png().toBuffer();
	}

	/**
	 *
	 * @param bufferOfImage
	 * @return {Promise<Buffer>}
	 */
	public async convertToJpg(bufferOfImage: Buffer) {
		return sharp(bufferOfImage).jpeg().toBuffer();
	}
}

const imageModule = new ImageModule(["jpg", "png", "gif"]);
export default imageModule;
