# node-security-voters

> ACL voters inspired by [Symfony voters](http://symfony.com/doc/current/security/voters.html)

[![npm version](https://badge.fury.io/js/logtown.svg)](https://www.npmjs.com/package/node-security-voters)
[![Code Climate](https://codeclimate.com/github/zemd/node-security-voters/badges/gpa.svg)](https://codeclimate.com/github/zemd/node-security-voters)
[![dependencies:?](https://img.shields.io/david/zemd/node-security-voters.svg)](https://david-dm.org/zemd/node-security-voters)
[![devDependencies:?](https://img.shields.io/david/dev/zemd/node-security-voters.svg?style=flat)](https://david-dm.org/zemd/node-security-voters)
[![Inline docs](http://inch-ci.org/github/zemd/node-security-voters.svg?branch=master)](http://inch-ci.org/github/logtown/logtown)

## Installation

```bash
npm install node-security-voters --save
```

or 

```bash
yarn add node-security-voters
```

## Usage

Voters are very similar to middleware mechanism, but different in implementation. In essence, voter is a simple function
that tells if some user is granted access to subject using permission(attribute). Voter might or might not be asynchronous.

First you need to add your voter
```javascrtip
const security = require('node-security-voters');
security.addVoter(function (attr, subject, user) {
  if (!user) {
    return 0;
  }
  if (user.hasPermission(attr, subj)) {
    return 1;
  }
  
  return -1;
});
```

Voters should return one of the access resolutions: GRANTED = 1, ABSTAIN = 0 or DENIED = -1. You might use constants from
this package from `security.ACCESS` map.

If you need to make asynchronous action during making decision you can return `Promise<number>` or get async callback
with `var done = this.async();` and after action completed run `done(null, resolution)`.

There is no restrictions on types of voter's arguments, thus you can pass any values you want. But keep in mind good practice
to use domain objects that you can detect, validate and extract values you need.

To check access use `isGranted` method:

```javascript
const security = require('node-security-voters');

const blog = new MyBlogModel();
const user = new MyUserModel();

security.isGranted('EDIT', blog, user, security.STRATEGIES.AFFIRMATIVE)
  .then(resolution => {
      if (resolution !== security.ACCESS.GRANTED) {
          throw new Error('ACCESS DENIED');
      }
      // secret stuff
  });

// or

security.isGranted('EDIT', blog, user, security.STRATEGIES.AFFIRMATIVE, function (err, resolution) {
   // same as above but in callback body 
});
```

As you seen `isGranted` method accepts optional parameter **strategy**. It means that during access calculation the module
will use one of the 3 options:

 1. AFFIRMATIVE - grant access as soon as there is one voter granting access
 2. CONSENSUS - grant access if there are more voters granting access than there are denying
 3. UNANIMOUS - only grant access if none of the voters has denied access

`AFFIRMATIVE` is used by default.

### Koa

node-security-voters goes with ready to use **koa2** middleware. It helps to load voters from specific place and run to check
access for specific path. Also it populates context with `ctx.isGranted` helper method.

```javascript
const Koa = require('koa');
const app = new Koa();
const passport = require('koa-passport');

const voters = require('node-security-voters');

app.use(passport.initialize());
app.use(passport.session());

// Add this middleware as far as your user model is ready, 
// for example, after passport middleware initialized and create user instance 
app.use(voters(path.join(__dirname, 'path/to/voters/glob/**/*.js')));
```

## Example voter

You can find example of voter for checking access of routes' path. Checkout folder `voters` in this package.

```javascript
const security = require('node-security-voters');
const accessMapVoter = require('node-security-voters/voters/access-map-voter');

security.addVoter(accessMapVoter({
  "^/restricted_area$": security.ACCESS.DENIED,
  "^/assets/.+\.(js|css|jpg|png)$": security.ACCESS.GRANTED,
  "^/secured$": ["ROLE_ADMIN", "ROLE_EDITOR"],
  "^/for_users_only$": "ROLE_USER",
  "^/lazy_check_area": user => {
   return security.ACCESS.GRANTED;
  },
  "^/$": security.ACCESS.GRANTED,
}));
```

## Related project

 - https://github.com/slawus/Voters.js
 - http://symfony.com/doc/current/security/voters.html
 - http://docs.spring.io/spring-security/site/docs/3.0.x/reference/authz-arch.html

## License

node-security-voters is released under the MIT license.

## Donate

[![](https://img.shields.io/badge/patreon-donate-yellow.svg)](https://www.patreon.com/red_rabbit)
[![](https://img.shields.io/badge/flattr-donate-yellow.svg)](https://flattr.com/profile/red_rabbit)

