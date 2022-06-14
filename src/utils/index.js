import _ from "lodash";

export function getConfig(plan, config, scopeType) {
  return Object.entries(plan[scopeType]).reduce((acc, [endp, opObject]) => {
    acc[endp] = {};
    Object.entries(opObject).forEach(([op, scope]) => {
      const scopeSla = scope[config.requestIdentifier ?? "requests"];
      const period = scopeSla[0].period;
      acc[endp].operation = op;
      acc[endp].max = scopeSla[0].max ?? 0;
      switch (period) {
        case "second":
          acc[endp].windowMs = 1000;
          break;
        case "minute":
          acc[endp].windowMs = 60 * 1000;
          break;
        case "hour":
          acc[endp].windowMs = 60 * 60 * 1000;
          break;
        case "day":
          acc[endp].windowMs = 24 * 60 * 60 * 1000;
          break;
        case "month":
          acc[endp].windowMs = 30 * 24 * 60 * 60 * 1000;
          break;
        case "year":
          acc[endp].windowMs = 365 * 24 * 60 * 60 * 1000;
          break;
      }
      if (scopeType === "rates") {
        acc[endp].delayMs = acc[endp].windowMs / acc[endp].max;
        acc[endp].windowMs = 60000;
      }
    });
    acc[endp] = _.merge(
      scopeType === "quotas" ? config.rateLimit : config.slowDown,
      acc[endp]
    );
    return acc;
  }, {});
}
