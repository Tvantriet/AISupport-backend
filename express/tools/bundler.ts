import { bundle } from "@adminjs/bundler";
import path from "path";
import shell from "shelljs";
import config from "../src/config/app.js";
import { componentLoader } from "../src/app/admin/utils/components.bundler.js";
import componentsBundler from "../node_modules/adminjs/lib/backend/bundler/components.bundler.js";
import { InputOptions, OutputOptions } from "rollup";

/**
 * npm run admin:bundle invokes this script.
 * This file is used to bundle AdminJS files. It is used at compile time
 * to generate the frontend component bundles that are used in AdminJS.
 */
void (async () => {
	if (!config.adminPanel.enabled) return;
	console.log('bundle components...')
	await bundle({
		componentLoader,
		destinationDir: ".adminjs",
	});
	console.log('components bundled')

	console.log('Minify component.bundle.js asset folder...')
	const entryPath = path.join(".adminjs", "components.bundle.js");
	const outPath = path.join(".adminjs", "components.bundle.js");

	const input: InputOptions = {
		input: entryPath,
		watch: false,
	}
	const output: OutputOptions = {
		name: "AdminJSCustom",
		file: outPath,
		minifyInternalExports: true,
	}
	componentsBundler.createConfiguration(input, output);
	await componentsBundler.build();
	await componentsBundler.getOutput();
	console.log('Minified component.bundle.js asset folder')

	// Move content to bundle.js in asset folder
	shell.mv("-f", ".adminjs/components.bundle.js", ".adminjs/bundle.js");
})();
