# SLA-RATE-LIMIT
Rate limit server requests based on the [SLA4OAI](https://sla4oai.specs.governify.io/) Standard.

## Config
| **Param**         	| **Type** 	|                                    **Description**                                   	| **Default**      	|
|-------------------	|:--------:	|---------------------------------------------------------------------------------------|------------------	|
| slaFile           	|  String  	| absolute or relative URI to the SLA file                                             	| api/oas-sla.yaml 	|
| requestIdentifier 	|  String  	| Name used in the SLA to identify the requests metric                                 	| requests         	|
| currentPlan       	|  String  	| The SLA plan that is being used                                                      	| base             	|
| rateLimit         	|  Object  	| [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) config params 	| {}               	|
| speedLimit        	|  Object  	| [express-slow-down](https://www.npmjs.com/package/express-slow-down) config params   	| {}               	|