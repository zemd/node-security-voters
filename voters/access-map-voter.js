"use strict";

const ACCESS = require("../index").ACCESS;
const logger = require("logtown").getLogger("access-map-voter");

// TODO(zemd): make subj of instance RoutePath or something more accurate
module.exports = (accessMap = {}) => {
  return (attr, subj, user) => {
    if (typeof attr !== "undefined" /*|| !(subj instanceof RoutePath)*/) {
      return ACCESS.ABSTAIN;
    }

    logger.debug(`Checking path '${subj}'...`);

    const patterns = Object.keys(accessMap);

    for (let i = 0; i < patterns.length; i += 1) {
      const pattern = patterns[i];
      logger.debug(`Checking pattern: ${pattern}`);

      if (new RegExp(pattern).test(subj)) {
        let accessLevel = accessMap[pattern];

        // 1 rule is one of the access resolution values
        if ([ACCESS.DENIED, ACCESS.ABSTAIN, ACCESS.GRANTED].indexOf(accessLevel) > -1) {
          logger.debug(`Found pattern rule '${pattern}' that match to '${subj}' with access level '${accessLevel}'`);
          return accessLevel;
        }

        // 2 rule is set of roles
        if (Array.isArray(accessLevel) || typeof accessLevel === "string") {
          let allowedRoles = [].concat.apply([], accessLevel);
          if (typeof user === "undefined") {
            return ACCESS.DENIED; // user must be logged in to check his roles
          }

          if (Array.isArray(user.get("roles"))
            && user.get("roles").some(r => allowedRoles.indexOf(r) > -1)) {
            return ACCESS.GRANTED;
          }

          return ACCESS.DENIED;
        }

        // 3 rule is function
        if (typeof accessLevel === "function") {
          return accessLevel.call(null, user);
        }

        // 4 rule is unsupported
        // if accessLevel of unsupported type then simply skip this check
      }
    }

    logger.debug(`Access map does not contain any rules for path '${subj}'. Default(${ACCESS.ABSTAIN}) access level applied.`);
    // by default user is allowed to follow all pages
    return ACCESS.ABSTAIN;
  }
};
