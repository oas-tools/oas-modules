import _ from "lodash";

export function getConfig(plan, config, scopeType) {
  return Object.entries(plan[scopeType]).reduce((acc, [endp, opObject]) => {
    acc = {};
    Object.entries(opObject).forEach(([op, scope]) => {
      const endpoint = `${op.toUpperCase()}-${expressPath(endp)}`;
      const scopeSla = scope[config.requestIdentifier ?? "requests"];
      const period = scopeSla[0].period;
      acc[endpoint] = {};
      acc[endpoint].max = scopeSla[0].max ?? 1;
      switch (period) {
        case "second":
          acc[endpoint].windowMs = 1000;
          break;
        case "minute":
          acc[endpoint].windowMs = 60 * 1000;
          break;
        case "hour":
          acc[endpoint].windowMs = 60 * 60 * 1000;
          break;
        case "day":
          acc[endpoint].windowMs = 24 * 60 * 60 * 1000;
          break;
        case "month":
          acc[endpoint].windowMs = 30 * 24 * 60 * 60 * 1000;
          break;
        case "year":
          acc[endpoint].windowMs = 365 * 24 * 60 * 60 * 1000;
          break;
      }
      if (scopeType === "rates") {
        acc[endpoint].delayMs = acc[endpoint].windowMs / acc[endpoint].max;
        acc[endpoint].maxDelayMs = acc[endpoint].delayMs;
      }
    });
    return acc;
  }, {});
}

function expressPath(path){
  return path.replace(/{/g, ':').replace(/}/g, '');
}