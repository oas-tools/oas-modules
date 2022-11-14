'use strict'

module.exports.getRequest = function getRequest(req, res, next) {
  res.send("Test controller for SLA Rate Limit");
};