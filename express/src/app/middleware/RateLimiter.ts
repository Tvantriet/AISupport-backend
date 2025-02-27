// import rateLimit from "express-rate-limit";
// import config from "../../config/app.js";
// import ApiResponses from "../utils/ApiResponses.js";
// import BlockedIpLog from "../models/BlockedIpLog.entity";
// import Ip from "../utils/Ip";

// /**
//  *
//  * @param windowMs
//  * @param maxRequests
//  */
// export function limiter(windowMs: number, maxRequests: number) {
// 	return rateLimit({
// 		windowMs, // {windowMs/60/1000} of minutes
// 		max: maxRequests, // Limit each IP to {max} requests per `window` (here, per {windowMs/60/1000} minutes)
// 		standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
// 		legacyHeaders: false, // Disable the `X-RateLimit-*` headers,
// 		async handler(req, res, next, options) {
// 			const ip: any = Ip.get(req);
// 			let blockedIpLog = await BlockedIpLog.findOne(ip);
// 			if (blockedIpLog) {
// 				blockedIpLog.count = blockedIpLog.count+1;
// 			}else{
// 				blockedIpLog = new BlockedIpLog();
// 				blockedIpLog.ip = ip;
// 			}
// 			await blockedIpLog.save();
// 			ApiResponses.errorResponse(res, options.message, {}, options.statusCode);
// 		}
// 	});
// }

// const rateLimiter = limiter(config.rateLimit.windowMs, config.rateLimit.max);
// export default rateLimiter;
