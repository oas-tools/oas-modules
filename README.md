# SLA RATE LIMIT

<div align="center">

[![NPM](https://nodei.co/npm/@oas-tools/sla-rate-limit.png?compact=true)](https://nodei.co/npm/@oas-tools/sla-rate-limit)

![npm](https://img.shields.io/npm/v/@oas-tools/sla-rate-limit)
![node-current](https://img.shields.io/node/v/@oas-tools/sla-rate-limit)
![npm](https://img.shields.io/npm/dw/@oas-tools/sla-rate-limit)
[![Node.js CI](https://github.com/oas-tools/sla-rate-limit/actions/workflows/nodejs.yaml/badge.svg)](https://github.com/oas-tools/sla-rate-limit/actions/workflows/nodejs.yaml)
[![Known Vulnerabilities](https://snyk.io/test/github/oas-tools/sla-rate-limit/main/badge.svg)](https://snyk.io/test/github/oas-tools/sla-rate-limit)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-green.svg)](https://conventionalcommits.org)
</div>

## Contents
- [SLA Rate Limit](#sla-rate-limit-1)
- [Setup](#setup)
  * [Installation](#installation)
  * [Configuration](#configuration)
- [SLA Document](#sla-document)
  * [Plans](#plans)
  * [Rates](#rates)
  * [Quotas](#quotas)

## SLA Rate Limit
SLA Rate Limit is an npm package containing a rate limitter middleware that can be integrated inside [OAS Tools Core Library](https://github.com/oas-tools/oas-tools) in order to limit or input some delay to server requests based on the [SLA4OAI](https://sla4oai.specs.governify.io/) Standard.

## Setup

### Installation
In order to start using SLA Rate Limit just install it through your preferred package manager, in case of NPM:

```sh
npm install @oas-tools/sla-rate-limit
```

Once installed, import SLARateLimit middleware and call OAS Tools' `use()` function before initialization:

```javascript
import http from "http";
import express from "express";
import { use, initialize } from "@oas-tools/core";
import { SLARateLimit } from "@oas-tools/sla-rate-limit";

const app = express();

use(SLARateLimit, {/* Config object */}, 0);
initialize(app).then(() => {
  http.createServer(app).listen(serverPort, () => {
    /* callback */
  });
})
```

> Notice the third parameter used in the `use` function. Since the rate limitting action should be performed before processing any request, the SLA Rate Limit middleware is inserted in the position `0` of the express chain.

### Configuration
The configuration is set through the second parameter of the `use` function. The table below describes the possible configuration options currently supported by the middleware:

| **Param**         	| **Type** 	|                                    **Description**                                   	| **Default**      	|
|-------------------	|:--------:	|---------------------------------------------------------------------------------------|------------------	|
| slaFile           	|  String  	| absolute or relative URI to the SLA file                                             	| api/oas-sla.yaml 	|
| requestIdentifier 	|  String  	| Name used in the SLA to identify the requests metric                                 	| requests         	|
| currentPlan       	|  String  	| The SLA plan that is being used                                                      	| base             	|
| rateLimit         	|  Object  	| [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) config params 	| {}               	|
| speedLimit        	|  Object  	| [express-slow-down](https://www.npmjs.com/package/express-slow-down) config params   	| {}               	|

## SLA document
This rate limit middleware requires a service level agreement file, in which the declaration for rates and quotas are found. This file should be located by default at `api/oas-sla.yaml`, but this option can be overriden through configuration, as explained above.

The SLA document must follow the [SLA4OAI](https://sla4oai.specs.governify.io/) specification in order to declare dynamic and static windows for requests in a standard way. The example below defines a dynamic window of 1 request per second and a static window of 3 requests per minute for different endpoints:

```yaml
sla: 1.0.0
context:
  id: rate-limit-sample
  type: plans
  api:
    $ref: ./oas-doc.yaml
  provider: ISAGroup
metrics:
  requests:
  type: "int64"
  description: "Number of requests"
plans:
  base:
    rates:
      /api/v1/resources/1:
        get:
          requests:
          - max: 3
            period: second
    quotas:
      /api/v1/resources:
        get:
          requests:
          - max: 3
            period: minute
```

This way, when making multiple requests to `/api/v1/resources/1`, the requests will be delayed in order to meet the rate criteria, whereas when making more requests than specified in the quotas object, the server response code will be `429` since the quota limit has been exceeded.

### Plans
As shown in the example in the previous section, the SLA document must contain `plans` in which the rates and quotas are defined. The SLA Rate Limit middleware receives the plan that will be used in configuration (by default is `base`, as explained in [configuration section](#configuration)). This way, multiple plans containing different rates can be declared, making the server _suscribe_ to one or another based on configuration (restaring the server is required when changing a plan).

### Rates
Rates are managed by the [express-slow-down](https://www.npmjs.com/package/express-slow-down) middleware. This middleware will input delay on the requests in order to meet the dynamic window specified under the rates object in the SLA Document.
Rates can be defined along quotas for the same endpoints. This situation is handled by the SLA Rate Limit middleware through chaining [express-slow-down](https://www.npmjs.com/package/express-slow-down) and [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) middlewares before registering them for the corresponding endpoint inside the express chain.

### Quotas
Quotas, on the other hand, are managed by the [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) middleware. This middleware will make the server respond a `429 Too Many Requests` when the quota is surprassed within the specified static window.
