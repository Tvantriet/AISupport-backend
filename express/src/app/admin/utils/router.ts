/* eslint-disable @typescript-eslint/ban-ts-comment */
import AdminJSExpress from "@adminjs/express";
import AdminJS from "adminjs";
import { Router } from "express";
import { TypeormStore } from "connect-typeorm";

import CmsUser from "../../models/CmsUser.entity.js";
import Session from "../../models/Session.entity.js";
import { AppDataSource } from "../../../database/typeorm-db.js";
import config from "../../../config/app.js";

/**
 * User authentication function.
 *
 * @param {string} email - The cmsuser email.
 * @param {string} password - The cmsuser password.
 * @returns {Promise<object|null>} An object containing cmsuser and admin property or null.
 */
export const authenticateUser = async (email: string, password: string) => {
	const cmsuser = await CmsUser.findOne({ where: { email } });

	if (cmsuser) {
		// Validate password
		const validPassword = cmsuser.isValidPassword(password);
		const role = await cmsuser.getCmsRole();
		if (validPassword) {
			return { ...cmsuser, role };
		}
	}
	return null;
};

/**
 * The sidebar menu object.
 *
 * @type {Object}
 * @property {Object} auth - The auth object.
 * @property {string} auth.name - The name of the auth object.
 * @property {string} auth.icon - The icon of the auth object.
 */
export const sidebarMenu = {
	auth: { name: "Users", icon: "Folder" },
	data: { name: "Data", icon: "Folder" },
};

/**
 * Builds an express router that requires authentication and session storage.
 *
 * @param {AdminJS} adminJs - The AdminJS instance.
 * @param {Router|null} [router=null] - The express router to use, or null to create a new one.
 * @returns {Router} The express router.
 */
export const expressAuthenticatedRouter = (adminJs: AdminJS, router: Router | null = null) => {
	const sessionRepository = AppDataSource.getRepository(Session);
	// Reauthentication required after 24h
	const defaultSessionLifetime = 1000 * 60 * 60 * 24;

	// Setup session-store
	const sessionStore = new TypeormStore({
		cleanupLimit: 2,
		limitSubquery: false,
		ttl: defaultSessionLifetime,
	}).connect(sessionRepository);

	if (!config.adminPanel.sessionSecret) throw new Error("Session secret not configured");

	return AdminJSExpress.buildAuthenticatedRouter(
		adminJs,
		{
			authenticate: authenticateUser,
			cookieName: "adminjs",
			cookiePassword: config.adminPanel.sessionSecret,
		},
		router,
		{
			// @ts-ignore
			store: sessionStore,
			resave: false,
			proxy: true,
			saveUninitialized: false,
			secret: config.adminPanel.sessionSecret,
			cookie: {
				httpOnly: true,
				secure: config.adminPanel.cookieSecureHeader,
				maxAge: defaultSessionLifetime,
			},
		},
	);
};
