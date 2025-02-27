import axios, { AxiosPromise, AxiosResponse, Method } from "axios";
import lodash from "lodash";
import Logger from "../utils/Logger.js";
import getErrorMessage from "./ErrorMessage.js";
import { sleep } from "./MiscHelpers.js";

export default class Axios {
	/**
	 * Call API endpoint
	 *
	 * @param endpoint
	 * @param method
	 * @param data
	 * @param config
	 * @return mixed
	 */
	public static async noAuth(
		endpoint: string,
		method: Method,
		data: any = {},
		config: any = {
			headers: {
				"Content-Type": "application/json",
			},
		},
	) {
		lodash.merge(config, {
			method,
		});
		this.addData(method, data, config);

		Logger.info(`Axios call endpoint ${endpoint}`);

		return axios(endpoint, config);
	}

	/**
	 * Use basic authentication on endpoint
	 *
	 * @param endpoint
	 * @param method
	 * @param username
	 * @param password
	 * @param data
	 * @param config
	 * @return mixed
	 */
	public static async basic(
		endpoint: string,
		method: Method,
		username: string,
		password: string,
		data: any = {},
		config: any = {
			headers: {
				"Content-Type": "application/json",
			},
		},
	) {
		lodash.merge(config, {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			auth: {
				username: username,
				password: password,
			},
		});
		this.addData(method, data, config);

		Logger.info(`Axios call endpoint ${endpoint}`);

		return axios(endpoint, config);
	}

	/**
	 * Use bearer authentication on endpoint
	 *
	 * @param endpoint
	 * @param method
	 * @param token
	 * @param data
	 * @param config
	 * @return mixed
	 */
	public static async bearer(
		endpoint: string,
		method: Method,
		token: string,
		data: any = {},
		config: any = {
			headers: {
				"Content-Type": "application/json",
			},
		},
	) {
		lodash.merge(config, {
			method,
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		this.addData(method, data, config);

		Logger.info(`Axios call endpoint ${endpoint}`);

		return axios(endpoint, config);
	}

	/**
	 * Use bearer authentication on endpoint
	 *
	 * @param endpoint
	 * @param method
	 * @param token
	 * @param data
	 * @param config
	 * @return mixed
	 */
	public static async token(
		endpoint: string,
		method: Method,
		token: string,
		data: any = {},
		config: any = {
			headers: {
				"Content-Type": "application/json",
			},
		},
	) {
		lodash.merge(config, {
			method,
			headers: {
				Authorization: token,
			},
		});
		this.addData(method, data, config);

		Logger.info(`Axios call endpoint ${endpoint}`);

		return axios(endpoint, config);
	}

	/**
	 * Retry mechanism that uses interval for the time between requests, expo for the exponential grow of the interval
	 * and frequency for the times it needs to be retried.
	 * @param interval
	 * @param frequency
	 * @param expo
	 * @param axiosRequest
	 * @returns {Promise<AxiosResponse | undefined>}
	 */
	public static async retry(
		interval: number,
		frequency: number,
		expo: number,
		axiosRequest: () => AxiosPromise,
	): Promise<AxiosResponse | undefined> {
		let result;
		let attempt = 0;
		let err;
		while (!result && attempt < frequency) {
			try {
				// Do request
				result = await axiosRequest();
			} catch (e) {
				err = e;
				const waitTime = interval * expo ** attempt;
				Logger.warning(`Request failed, message: ${getErrorMessage(e)} will retry after ${waitTime} ms...`);
				await sleep(waitTime);
				attempt++;
			}
		}
		if (!result && err) throw new Error(`${getErrorMessage(err)}`);
		return result;
	}

	private static addData(method: Method, data: any, config: any) {
		if (!["get", "GET"].includes(method)) {
			lodash.merge(config, {
				data,
			});
		}
	}
}
