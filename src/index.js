import $RefParser from "@apidevtools/json-schema-ref-parser";
import { getConfig } from "./utils";
import { OASBase } from "oas-devtools/middleware";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

let rateLimitCfg;
let slowDownCfg;

export class SLARateLimit extends OASBase {
  constructor(oasFile, middleware) {
    super(oasFile, middleware);
  }

  static async initialize(oasDoc, config) {
    const slaFile = await $RefParser.dereference(
      config.slaFile ?? `${process.cwd()}/api/oas-sla.yaml`
    );
    const plan = slaFile.plans[config.currentPlan ?? "base"];

    rateLimitCfg = plan.quotas ? getConfig(plan, config, "quotas") : null;
    slowDownCfg = plan.rates ? getConfig(plan, config, "rates") : null;

    return new SLARateLimit(oasDoc);
  }

  register(app) {
    // Register for endpoints with rates and quotas defined
    if (slowDownCfg) {
      Object.entries(slowDownCfg).forEach(([endpoint, slowDownConf]) => {
        let middleware;
        const speedLimiter = slowDown(slowDownConf);
        if (rateLimitCfg?.[endpoint]?.operation === slowDownConf.operation) {
          const limiter = rateLimit(rateLimitCfg[endpoint]);
          middleware = (req, res, next) =>
            speedLimiter(req, res, () => limiter(req, res, next));
        } else {
          middleware = speedLimiter;
        }
        app[slowDownConf.operation](endpoint, middleware);
      });
    }

    // Register for endpoints with only quotas defined
    if (rateLimitCfg) {
      Object.entries(rateLimitCfg)
        .filter(
          ([endpoint, rateLimitConf]) =>
            !slowDownCfg?.[endpoint]?.operation === rateLimitConf.operation
        )
        .forEach(([endpoint, rateLimitConf]) => {
          const limiter = rateLimit(rateLimitConf);
          app[rateLimitConf.operation](endpoint, (req, res, next) =>
            limiter(req, res, next)
          );
        });
    }
  }
}
