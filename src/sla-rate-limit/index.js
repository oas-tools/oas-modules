import { OASBase } from "oas-devtools/middleware";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

export class SLARateLimit extends OASBase {
    constructor(oasFile, middleware) {
        super(oasFile, middleware);
    }

    static initialize(oasDoc, config) {
        const limiter = rateLimit(config.rateLimit);
        const speedLimiter = slowDown(config.speedLimit);

        return new SLARateLimit(oasDoc, (req, res, next) => {
            speedLimiter(req, res, () => {
                limiter(req, res, next);
            });
        });
    }
}