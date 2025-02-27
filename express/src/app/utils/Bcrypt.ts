import bcrypt from "bcrypt";

export default class Bcrypt {
	/**
	 * Hash the given value.
	 *
	 * @param value
	 * @return {string}
	 */
	public static make(value: string) {
		return bcrypt.hashSync(value, 10);
	}

	/**
	 * Check the given plain value against a hash.
	 *
	 * @param value
	 * @param hashedValue
	 * @return {boolean}
	 */
	public static check(value: string, hashedValue: string) {
		return bcrypt.compareSync(value, hashedValue);
	}
}
