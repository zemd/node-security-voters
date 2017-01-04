"use strict";

const voters = [];
const runAsync = require("run-async");
const Rx = require("rxjs/Rx");

const logger = require("logtown").getLogger("security-voters");

const ACCESS = Object.freeze({
  GRANTED: 1,
  ABSTAIN: 0,
  DENIED: -1
});

/**
 * @enum {string}
 */
const STRATEGIES = Object.freeze({
  AFFIRMATIVE: "AFFIRMATIVE", // grant access as soon as there is one voter granting access
  CONSENSUS: "CONSENSUS", // grant access if there are more voters granting access than there are denying
  UNANIMOUS: "UNANIMOUS" // only grant access if none of the voters has denied access
});

/**
 * @param {Function} voterFn
 */
exports.addVoter = voterFn => voters.push(voterFn);

/**
 * @param {(string|undefined)} attr
 * @param {*} subj object preferable type for this param
 * @param {*} user object preferable type for this param
 * @param {('AFFIRMATIVE'|'CONSENSUS'|'UNANIMOUS')} strategy
 * @param {isGrantedCallback} [cb]
 */
exports.isGranted = (attr, subj, user, strategy = STRATEGIES.AFFIRMATIVE, cb) => {
  logger.debug(`Attr: ${attr}, subj: ${subj}, user: ${user}, strategy: ${strategy}`);

  // voters$ is an array of observables
  let voters$ = Rx.Observable.from(
    voters.map(voter => Rx.Observable.defer(
      () => runAsync(voter)(attr, subj, user))
    )
  );

  let result;

  switch (strategy) {
    case STRATEGIES.CONSENSUS:
      result = voters$
        .toArray()
        .mergeMap(votersFn => Rx.Observable.forkJoin(votersFn))
        .map(res => res.reduce((acc, v) => acc + v, 0))
        .map(results => results > 0)
        .do(res => logger.debug(`CONSENSUS RESOLUTION: ${res}`));
      break;
    case STRATEGIES.UNANIMOUS:
      result = voters$
        .mergeMap(v => v) // run observable
        .find(val => val === ACCESS.DENIED)
        .map(res => typeof res === "undefined") // is_granted === true if res === undefined
        .do(res => logger.debug(`UNANIMOUS RESOLUTION: ${res}`));
      break;
    default:
    case STRATEGIES.AFFIRMATIVE:
      result = voters$
        .mergeMap(v => v) // run observable
        .find(val => val === ACCESS.GRANTED)
        .map(res => typeof res !== "undefined") // is_granted === true if res !== undefined
        .do(res => logger.debug(`AFFIRMATIVE RESOLUTION: ${res}`));
      break;
  }

  if (cb) {
    result.subscribe(access => cb(null, access), err => cb(err));
    return;
  }

  return result.toPromise();
};

exports.STRATEGIES = STRATEGIES;
exports.ACCESS = ACCESS;

/**
 * @callback isGrantedCallback
 * @param {?Error} error
 * @param {boolean} isGranted
 */
