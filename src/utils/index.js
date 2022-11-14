export function getConfig(plan, config, scopeType) {
  return Object.entries(plan[scopeType]).reduce((acc, [endp, opObject]) => {
    const cfg = {};
    Object.entries(opObject).forEach(([op, scope]) => {
      const endpoint = `${op.toUpperCase()}-${expressPath(endp)}`;
      const scopeSla = scope[config.requestIdentifier ?? "requests"];
      const period = scopeSla[0].period;
      cfg[endpoint] = {};
      cfg[endpoint].max = scopeSla[0].max ?? 1;
      switch (period) {
        case "second":
          cfg[endpoint].windowMs = 1000;
          break;
        case "minute":
          cfg[endpoint].windowMs = 60 * 1000;
          break;
        case "hour":
          cfg[endpoint].windowMs = 60 * 60 * 1000;
          break;
        case "day":
          cfg[endpoint].windowMs = 24 * 60 * 60 * 1000;
          break;
        case "month":
          cfg[endpoint].windowMs = 30 * 24 * 60 * 60 * 1000;
          break;
        case "year":
          cfg[endpoint].windowMs = 365 * 24 * 60 * 60 * 1000;
          break;
      }
      if (scopeType === "rates") {
        cfg[endpoint].delayMs = cfg[endpoint].windowMs / cfg[endpoint].max;
        cfg[endpoint].maxDelayMs = cfg[endpoint].delayMs;
      }
    });
    return {...acc, ...cfg};
  }, {});
}

function expressPath(path){
  return path.replace(/{/g, ':').replace(/}/g, '');
}
