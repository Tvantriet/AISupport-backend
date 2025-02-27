import config from "../../config/mail.js";
import nodemailer from "nodemailer";
import * as fs from "fs";
import ejs from "ejs";
import path from "path";
import lodash from "lodash";

export class MailModule {
	private transporter: nodemailer.Transporter;
	private attachments: any[];

	constructor(mailer = "") {
		// Configure mail settings
		mailer = mailer ? mailer : config.default;
		this.transporter = nodemailer.createTransport(config.mailers[mailer]);
		this.attachments = [];
	}

	/**
	 *
	 * @param to
	 * @param subject
	 * @param view
	 * @param data
	 * @param files
	 */
	public async send({
		to,
		subject,
		view = "template",
		data,
	}: {
		to: string | string[];
		subject: string;
		view?: string;
		data: object;
	}) {
		const templatePath = config.template.path + view + "." + config.template.extension;
		const html = this.getMailTemplate(templatePath, data);

		// Send mail
		await this.transporter.sendMail({
			from: `${config.from.name} <${config.from.address}>`,
			to,
			subject,
			html,
			attachments: this.attachments,
		});
	}

	/**
	 * Read ejs file and convert to html
	 *
	 * @param view
	 * @param data
	 * @return {string}
	 */
	protected getMailTemplate(view: string, data: object) {
		const file = fs.readFileSync(path.join(process.cwd(), view), "ascii");
		return ejs.render(file, data);
	}

	/**
	 * Add upload files to attachments
	 *
	 * @param files
	 */
	addFiles(files: any) {
		files = files[Object.keys(files)[0]];
		if (!lodash.isArray(files)) {
			return [this.getFile(files)];
		}
		const attachments: { filename: string; content: any; encoding: any }[] = [];
		files.forEach((file: { filename: string; content: any; encoding: any }) => {
			attachments.push(this.getFile(file));
		});

		// TODO: Use the spread operator instead of '.apply()'
		// eslint-disable-next-line prefer-spread
		this.attachments.push.apply(this.attachments, attachments);
	}

	/**
	 *
	 * @param file
	 * @return {attachment}
	 */
	protected getFile(file: any) {
		return {
			filename: file.name,
			content: file.data,
			encoding: file.encoding,
		};
	}

	/**
	 * Add cid file to attachments
	 *
	 * @param filePath
	 * @param filename
	 * @param cid
	 */
	addCid(filePath: string, filename: string, cid: string) {
		this.attachments.push({
			filename,
			path: path.join(process.cwd(), "src/public/" + filePath),
			cid,
		});
	}
}

const mailModule = new MailModule();
export default mailModule;
