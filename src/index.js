import $RefParser from "@apidevtools/json-schema-ref-parser";
import { logger, OASBase } from "@oas-tools/commons";
import metaStore from "./utils/store.js";

export class SLARateLimit extends OASBase {

  constructor(oasFile, middleware) {
    super(oasFile, middleware);
  }

  static async initialize(oasDoc, config) {
    const slaFile = await $RefParser.dereference(
      config.slaFile ?? `${process.cwd()}/api/oas-sla.yaml`
    );
    
    const store = new metaStore(slaFile, config);
    
    const middleware = (req, res, next) => {
      let plan = res.locals.oas?.security?.[config.scheme]?.plan;
      if (!slaFile.plans[plan]) {
        logger.warn(`plan ${plan} is not defined in the SLA.`);
        plan = Object.keys(slaFile.plans)[0];
      }
      logger.info(`Using "${plan}" plan`);

      const endpoint = `${req.method}-${req.path}`;
      const key = `${req.ip}-${plan}-${endpoint}`;
      
      let limiters = store.get(key);
      if (!limiters) limiters = store.add(key);

      const {speedLimiter, rateLimiter} = limiters;
      speedLimiter(req, res, () => rateLimiter(req, res, next));
    }

    return new SLARateLimit(oasDoc, middleware);
  }
}
