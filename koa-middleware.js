"use strict";

const globby = require("globby");
const security = require("./index");
const isValidGlob = require("is-valid-glob");

const logger = require("logtown").getLogger("security-voters-middleware");

/**
 * @param {Function[]|string|string[]} voters
 * @param {boolean} checkRoutes
 * @returns {function(*, *)}
 */
module.exports = (voters, {checkRoutes = true} = {}) => {
  let votersFns = voters;
  if (!isValidGlob(voters) ||
    (Array.isArray(voters) && voters.filter(v => typeof v === "function").length !== voters.length)) {
    throw new Error(`Invalid voters array passed into middleware`);
  }

  if (isValidGlob(voters)) {
    logger.debug(`Security middleware initializing by adding voters from glob pattern: ${voters}`);
    votersFns = globby.sync(voters)
      .map(voterFile => require(voterFile));
    logger.debug(`Found and added ${votersFns.length} voters`);
  }

  votersFns.forEach(v => security.addVoter(v));

  return async(ctx, next) => {
    // populate ctx
    ctx.isGranted = (attr, subj, strategy, cb) => security.isGranted(attr, subj, ctx.state.user, strategy, cb);

    if (checkRoutes) {
      // check access
      logger.debug(`About to check grant access for '${ctx.request.originalUrl}'`);
      const granted = await security.isGranted(undefined, ctx.request.originalUrl, ctx.state.user);
      logger.debug(`The access IS ${granted ? "" : "NOT"} granted for the path '${ctx.request.originalUrl}' to user '${ctx.state.user}'`);
      if (!granted) {
        ctx.throw(403);
      }
    }
    await next();
  };
};
