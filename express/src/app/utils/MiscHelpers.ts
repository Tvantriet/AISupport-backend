import { fileURLToPath } from "url";
import { dirname } from "path";

export async function sleep(durationMs: number): Promise<void> {
	// eslint-disable-next-line no-promise-executor-return
	return new Promise((resolve) => setTimeout(resolve, durationMs));
}

export function truncateString(string: string, charLength: number) {
	if (!string) return "";

	return string?.length >= charLength ? `${string.slice(0, charLength)}...` : string;
}

export function getLabel(value: string | Record<string, string>) {
	if (value && typeof value === "object" && value.constructor === Object) {
		const objValue = Object.values(value)[0];
		return objValue ?? "";
	}
	return value as string;
}

export const betweenRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

export function dirName(meta: any): string {
	const __filename = fileURLToPath(meta.url);

	return dirname(__filename);
}
