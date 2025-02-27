import crypto from "crypto";
import config from "../../config/app.js";

export default class Crypt {
	static readonly cipher: string = String(config.encryption.cipher);
	static readonly key: Buffer = Buffer.from(String(config.encryption.key).substring(7), "base64");
	static readonly sha: string = String(config.encryption.sha);

	/**
	 * Returns transformer object with encryption flow
	 * @returns {Object}
	 */
	public static encryptColumn() {
		return {
			to: (value: string) => (value ? this.encrypt(value) : null),
			from: (value: string) => this.decrypt(value),
		};
	}

	/**
	 * Create payload encrypted with master key.
	 * Payload contains: iv, value, mac
	 * @return {String} Base64 encoded payload
	 * @param value
	 */
	public static encrypt(value: string) {
		if (!value) {
			return value;
		}

		const iv = crypto.randomBytes(16);
		const base64Iv = iv.toString("base64");
		const cipher = crypto.createCipheriv(this.cipher, this.key, iv);

		let encrypted = cipher.update(value, "utf8", "base64");
		encrypted += cipher.final("base64");

		const mac = this.hash(encrypted, base64Iv);
		const payloadObject = {
			iv: base64Iv,
			value: encrypted,
			mac: mac,
		};

		const _payload = JSON.stringify(payloadObject);
		return Buffer.from(_payload).toString("base64");
	}

	/**
	 * Decrypts payload with master key
	 * @param {String} payload - base64 encoded json with iv, value, mac information
	 */
	public static decrypt(payload: string) {
		const _payload: any = this.getJsonPayload(payload);
		const iv = Buffer.from(_payload.iv, "base64");
		const decipher = crypto.createDecipheriv(this.cipher, this.key, iv);

		let decrypted = decipher.update(_payload.value, "base64", "utf8");
		decrypted += decipher.final("utf8");

		return decrypted;
	}

	/**
	 * Hash function.
	 * Combines initialization vector (iv) with data to be hashed (value).
	 * Uses master key to hash results
	 * By omitting IV you can also use it as salted hash function
	 * @param {String} value Data
	 * @param {String} iv Initialization vector
	 */
	static hash(value: string, iv?: string) {
		if (value === undefined || value === "") {
			throw new Error("Value is not defined!");
		}

		// Create hash
		const data = iv ? iv + value : value;
		return this.hashHmac(data, this.key);
	}

	/**
	 * Calculate MAC.
	 * Payload needs to be decoded to JSON with getJsonPayload(payload)
	 * @param {Object} payload with iv & value
	 * @param {String} key
	 */
	private static calculateMac(payload: any, key: any) {
		const hashedData = this.hash(payload.value, payload.iv);
		return this.hashHmac(hashedData, key);
	}

	/**
	 * Get JSON object from payload.
	 * Payload needs to be base64 encoded and must contains iv, value, mac attributes.
	 * MAC is validated
	 * @param {String} payload
	 * @return {Object} Data with iv, value, mac
	 */
	private static getJsonPayload(payload: string) {
		if (payload === undefined || payload === "") {
			throw new Error("Payload MUST NOT be empty!");
		}

		let _payload = null;
		try {
			_payload = JSON.parse(Buffer.from(payload, "base64").toString());
		} catch (e) {
			throw new Error("Payload cannot be parsed!");
		}

		if (!this.isValidPayload(_payload)) {
			throw new Error("Payload is not valid!");
		}

		if (!this.isValidMac(_payload)) {
			throw new Error("Mac is not valid!");
		}

		return _payload;
	}

	/**
	 * Crypto function to hash data with given key
	 * @param {String} data
	 * @param {String} key
	 */
	private static hashHmac(data: string, key: any) {
		const hmac = crypto.createHmac(this.sha, key);
		hmac.update(data);
		return hmac.digest("hex");
	}

	/**
	 * MAC validation function.
	 * Payload must be decoded to JSON
	 * @param {Object} payload
	 */
	private static isValidMac(payload: any) {
		const bytes = crypto.randomBytes(16);
		const calculatedMac = this.calculateMac(payload, bytes);

		const originalMac = this.hashHmac(payload.mac, bytes);
		return originalMac === calculatedMac;
	}

	/**
	 * Payload validation function.
	 * Payload must be decoded to JSON
	 * @param {Object} payload
	 */
	private static isValidPayload(payload: any) {
		// TODO: Do not access Object.prototype method 'hasOwnProperty' from target object
		// eslint-disable-next-line no-prototype-builtins
		return payload.hasOwnProperty("iv") && payload.hasOwnProperty("value") && payload.hasOwnProperty("mac");
	}
}
