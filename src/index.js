import $RefParser from "@apidevtools/json-schema-ref-parser";
import { getConfig } from "./utils/index.js";
import { OASBase } from "@oas-tools/commons";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

export class SLARateLimit extends OASBase {
  #rateLimitCfg;

  #slowDownCfg;

  constructor(oasFile, rateLimitCfg, slowDownCfg) {
    super(oasFile);
    this.#rateLimitCfg = rateLimitCfg;
    this.#slowDownCfg = slowDownCfg;
  }

  static async initialize(oasDoc, config) {
    const slaFile = await $RefParser.dereference(
      config.slaFile ?? `${process.cwd()}/api/oas-sla.yaml`
    );
    const plan = slaFile.plans[config.currentPlan ?? "base"];

    const rateLimitCfg = plan.quotas ? getConfig(plan, config, "quotas") : null;
    const slowDownCfg = plan.rates ? getConfig(plan, config, "rates") : null;

    return new SLARateLimit(oasDoc, rateLimitCfg, slowDownCfg);
  }

  register(app) {
    // Register for endpoints with rates and quotas defined
    if (this.#slowDownCfg) {
      Object.entries(this.#slowDownCfg).forEach(([endpoint, slowDownConf]) => {
        let middleware;
        const speedLimiter = slowDown(slowDownConf);
        if (this.#rateLimitCfg?.[endpoint]?.operation === slowDownConf.operation) {
          const limiter = rateLimit(this.#rateLimitCfg[endpoint]);
          middleware = (req, res, next) =>
            speedLimiter(req, res, () => limiter(req, res, next));
        } else {
          middleware = speedLimiter;
        }
        app[slowDownConf.operation](endpoint, middleware);
      });
    }

    // Register for endpoints with only quotas defined
    if (this.#rateLimitCfg) {
      Object.entries(this.#rateLimitCfg)
        .filter(
          ([endpoint, rateLimitConf]) =>
            this.#slowDownCfg?.[endpoint]?.operation !== rateLimitConf.operation
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
