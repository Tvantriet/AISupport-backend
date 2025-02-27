import dotenv from "dotenv";

dotenv.config();

const config: any = {
	/*
    |--------------------------------------------------------------------------
    | Default Mailer
    |--------------------------------------------------------------------------
    |
    | This option controls the default mailer that is used to send any mail
    | messages sent by your application. Alternative mailers may be setup
    | and used as needed; however, this mailer will be used by default.
    |
    */

	default: process.env.MAIL_MAILER ? process.env.MAIL_MAILER : "smtp",

	/*
    |--------------------------------------------------------------------------
    | Mailer Configurations
    |--------------------------------------------------------------------------
    |
    | Here you may configure all of the mailers used by your application plus
    | their respective settings. Several examples have been configured for
    | you and you are free to add your own as your application requires.
    |
    | Laravel supports a variety of mail "transport" drivers to be used while
    | sending an e-mail. You will specify which one you are using for your
    | mailers below. You are free to add additional mailers as required.
    |
    | Supported: "smtp", "sendmail", "mailgun", "ses",
    |            "postmark", "array"
    |
    */

	mailers: {
		smtp: {
			host: process.env.MAIL_HOST,
			port: process.env.MAIL_PORT,
			auth: {
				user: process.env.MAIL_USERNAME,
				pass: process.env.MAIL_PASSWORD,
			},
			secure: false,
			requireTLS: true,
		},
	},

	/*
    |--------------------------------------------------------------------------
    | Global "From" Address
    |--------------------------------------------------------------------------
    |
    | You may wish for all e-mails sent by your application to be sent from
    | the same address. Here, you may specify a name and address that is
    | used globally for all e-mails that are sent by your application.
    |
    */

	from: {
		address: process.env.MAIL_FROM_ADDRESS,
		name: process.env.MAIL_FROM_NAME,
	},

	/*
    |--------------------------------------------------------------------------
    | MailModule Template
    |--------------------------------------------------------------------------
    |
    | If you want to change the email template, you can customize the design
    | of the emails. Or, you may simply stick with the default
    |
    */

	template: {
		path: "src/views/mail/",
		extension: "ejs",
	},
};
export default config;
