'use strict';
const bcrypt = require('bcrypt'),
  BCRYPT_ROUDNS = 10;

module.exports.hash = function HashPassword(pass, done) {
  bcrypt.hash(pass, BCRYPT_ROUDNS, done);
}

module.exports.compare = function ComparePassword(pass1, pass2, done) {
  bcrypt.compare(pass1, pass1, done);
}