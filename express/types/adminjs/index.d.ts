import { PropertyOptions } from "adminjs";

declare module "adminjs" {
	interface PropertyOptions {
		/**
		 * Custom validation options for the property
		 */
		validation?: {
			/**
			 * Minimum allowed value
			 */
			min?: number;

			/**
			 * Maximum allowed value
			 */
			max?: number;

			/**
			 * Regular expression for the property value
			 */
			regex?: RegExp;

			/**
			 * Error message for the property value
			 */
			message?: string;

			/**
			 * Maximum length of the property value
			 */
			maxLength?: number;

			/**
			 * Custom validation function for the property value
			 */
			format?: (value: any) => any;

			/**
			 * Custom validation function for the property value
			 */
			customValidation?: (value: any, recordId?: string) => Promise<{ passed: boolean; message?: string }>;
		};

		// Add more property options here...
	}
}
