import lodash from "lodash";
import WinstonLogger from "./WinstonLogger.js";
import cls from "../utils/CLS.js";

export default class Logger {
	private static finishMeta(meta: any = {}) {
		const clsFields = cls.logFields ?? {};

		if (Object.entries(clsFields).length === 0 && Object.entries(meta).length === 0) return undefined;

		const ret = { ...(clsFields ?? {}) };

		lodash.merge(ret, meta);

		return ret;
	}

	public static alert(msg: string | any, meta: any = {}) {
		WinstonLogger.alert(msg, Logger.finishMeta(meta));
	}
	public static error(msg: string | any, meta: any = {}) {
		WinstonLogger.error(msg, Logger.finishMeta(meta));
	}
	public static warning(msg: string | any, meta: any = {}) {
		WinstonLogger.warning(msg, Logger.finishMeta(meta));
	}
	public static notice(msg: string | any, meta: any = {}) {
		WinstonLogger.notice(msg, Logger.finishMeta(meta));
	}
	public static info(msg: string | any, meta: any = {}) {
		WinstonLogger.info(msg, Logger.finishMeta(meta));
	}
	public static debug(msg: string | any, meta: any = {}) {
		WinstonLogger.debug(msg, Logger.finishMeta(meta));
	}
}
