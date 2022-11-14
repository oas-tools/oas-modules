import ratelimitTest from './suites/rate-limit.test.js';

describe('***************************\n  ** SLA RATE LIMIT TESING SUITE **\n  ***************************', () => {
    const nodeMajor = parseInt(process.version.split('.')[0].replace('v',''));
    
    after(() => {
        process.exit(0);
    });
    
    // Test suites
    if(nodeMajor >= 16) ratelimitTest();
});