import {init, use, close} from '../testServer/index.js';
import { SLARateLimit } from '../../src/index.js';
import { run } from "apipecker";
import fs from 'fs';
import assert from 'assert';
import jwt from "jsonwebtoken";

export default () => {
    describe('\n   - Middleware function tests', () => {
        before(async () => {
            let cfg = JSON.parse(fs.readFileSync('tests/testServer/.oastoolsrc'));
            cfg.logger.level = "off";
            cfg.middleware.security.auth = {
                bearerjwt: (token) => jwt.verify(token.replace("Bearer ", ""), "testSecret", { issuer: "testIssuer"})
            };
            use(SLARateLimit, {slaFile: "tests/testServer/api/oas-sla.yaml", scheme: "bearerjwt"}, 2);
            await init(cfg);
        });

        after(() => {
            close();
        });
        
        it('Should delay responses and limit requests based on SLA', (done) => {
            const token = jwt.sign({plan: 'premium'}, 'testSecret', {issuer: 'testIssuer'});
            run({
                concurrentUsers: 1,
                iterations: 7,
                delay: 0,
                verbose: true,
                urlBuilder: () => 'http://localhost:8080/api/v1/bearerjwt',
                requestBuilder: () => { 
                    return { 
                        options: {
                            method: "GET",
                            headers: {"Authorization": `Bearer ${token}`}
                        }
                    }
                },
                resultsHandler: (results) => {
                    let parseRes = results.lotStats.flatMap(obj => obj.result.stats);
                    try {
                        assert.equal(parseRes[0].statusCode, 200);
                        assert.equal(parseRes[1].statusCode, 200);
                        assert.equal(parseRes[2].statusCode, 200);
                        assert.equal(parseRes[3].statusCode, 200);
                        assert.equal(parseRes[4].statusCode, 200);
                        assert.equal(parseRes[5].statusCode, 429);
                        assert.equal(parseRes[6].statusCode, 429);
                        assert.equal(parseRes[0].completeResponseTime < 333, true);
                        assert.equal(parseRes[1].completeResponseTime > 333, true);
                        assert.equal(parseRes[2].completeResponseTime > 333, true);
                        assert.equal(parseRes[3].completeResponseTime > 333, true);
                        assert.equal(parseRes[4].completeResponseTime > 333, true);
                        assert.equal(parseRes[5].completeResponseTime > 333, true);
                        assert.equal(parseRes[6].completeResponseTime > 333, true);
                        done();
                    } catch (err) {
                        done(err);
                    }
                }
            });
        });

        it('Should delay responses and limit requests based on SLA for parametrized endpoints', (done) => {
            const token = jwt.sign({plan: 'premium'}, 'testSecret', {issuer: 'testIssuer'});
            run({
                concurrentUsers: 1,
                iterations: 5,
                delay: 0,
                verbose: true,
                urlBuilder: () => 'http://localhost:8080/api/v1/bearerjwt/1',
                requestBuilder: () => { 
                    return { 
                        options: {
                            method: "GET",
                            headers: {"Authorization": `Bearer ${token}`}
                        }
                    }
                },
                resultsHandler: (results) => {
                    let parseRes = results.lotStats.flatMap(obj => obj.result.stats);
                    try {
                        assert.equal(parseRes[0].statusCode, 200);
                        assert.equal(parseRes[1].statusCode, 200);
                        assert.equal(parseRes[2].statusCode, 429);
                        assert.equal(parseRes[3].statusCode, 429);
                        assert.equal(parseRes[4].statusCode, 429);
                        assert.equal(parseRes[0].completeResponseTime < 500, true);
                        assert.equal(parseRes[1].completeResponseTime > 500, true);
                        assert.equal(parseRes[2].completeResponseTime > 500, true);
                        assert.equal(parseRes[3].completeResponseTime > 500, true);
                        assert.equal(parseRes[4].completeResponseTime > 500, true);
                        done();
                    } catch (err) {
                        done(err);
                    }
                }
            });
        });

        it('Should use the base plan when the specified one is not found', (done) => {
            const token = jwt.sign({plan: 'not_declared_plan'}, 'testSecret', {issuer: 'testIssuer'});
            run({
                concurrentUsers: 1,
                iterations: 4,
                delay: 0,
                verbose: true,
                urlBuilder: () => 'http://localhost:8080/api/v1/bearerjwt',
                requestBuilder: () => { 
                    return { 
                        options: {
                            method: "GET",
                            headers: {"Authorization": `Bearer ${token}`}
                        }
                    }
                },
                resultsHandler: (results) => {
                    let parseRes = results.lotStats.flatMap(obj => obj.result.stats);
                    try {
                        assert.equal(parseRes[0].statusCode, 200);
                        assert.equal(parseRes[1].statusCode, 200);
                        assert.equal(parseRes[2].statusCode, 429);
                        assert.equal(parseRes[3].statusCode, 429);
                        assert.equal(parseRes[0].completeResponseTime < 1000, true);
                        assert.equal(parseRes[1].completeResponseTime > 1000, true);
                        assert.equal(parseRes[2].completeResponseTime > 1000, true);
                        assert.equal(parseRes[3].completeResponseTime > 1000, true);
                        done();
                    } catch (err) {
                        done(err);
                    }
                }
            });
        });

        it('Should use only speed limiter when no quotas defined', (done) => {
            const token = jwt.sign({plan: 'noquotas'}, 'testSecret', {issuer: 'testIssuer'});
            run({
                concurrentUsers: 1,
                iterations: 4,
                delay: 0,
                verbose: true,
                urlBuilder: () => 'http://localhost:8080/api/v1/bearerjwt',
                requestBuilder: () => { 
                    return { 
                        options: {
                            method: "GET",
                            headers: {"Authorization": `Bearer ${token}`}
                        }
                    }
                },
                resultsHandler: (results) => {
                    let parseRes = results.lotStats.flatMap(obj => obj.result.stats);
                    try {
                        assert.equal(parseRes[0].statusCode, 200);
                        assert.equal(parseRes[1].statusCode, 200);
                        assert.equal(parseRes[2].statusCode, 200);
                        assert.equal(parseRes[3].statusCode, 200);
                        assert.equal(parseRes[0].completeResponseTime < 1000, true);
                        assert.equal(parseRes[1].completeResponseTime > 1000, true);
                        assert.equal(parseRes[2].completeResponseTime > 1000, true);
                        assert.equal(parseRes[3].completeResponseTime > 1000, true);
                        done();
                    } catch (err) {
                        done(err);
                    }
                }
            });
        });
    });
}