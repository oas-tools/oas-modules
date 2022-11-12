import { getConfig } from "../utils/index.js";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

export default class metaStore {

    constructor(slaFile, config) {
        this.config = config;
        this.slaFile = slaFile;
        this.instances = {};
    }

    add(key) {
        const [_ip, plan, method, path] = key.split("-");
        const planObj = this.slaFile.plans[plan];
        const rateLimitCfg = planObj.quotas ? getConfig(planObj, this.config, "quotas")?.[`${method}-${path}`] : null;
        const slowDownCfg = planObj.rates ? getConfig(planObj, this.config, "rates")?.[`${method}-${path}`] : null;
        
        this.instances[key] = {speedLimiter: slowDown(slowDownCfg ?? {delayMs: 0}), rateLimiter: rateLimit(rateLimitCfg ?? {max: 0})};
        return this.instances[key]; // return inserted value
    }

    get(key) {
        return this.instances[key];
    }
}