import crypto from "crypto";

export default class Hash {
	/**
	 * Hash the given value.
	 *
	 * @param value
	 * @param options
	 * @return {string}
	 */
	static make(value: string, options: { ignoreCase?: boolean } = {}): string {
		let v = value;
		if (options.ignoreCase) v = value.toLowerCase();
		return crypto.createHash("sha256").update(v).digest("hex");
	}
}
