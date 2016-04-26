'use strict';
const bcrypt = require('bcryptjs'),
  BCRYPT_ROUDNS = 10;

module.exports.hash = function HashPassword(pass, done) {
  if(typeof done === 'function') {
    bcrypt.hash(pass, BCRYPT_ROUDNS, done);
  } else {
    return new Promise((resolve, reject) => {
      bcrypt.hash(pass, BCRYPT_ROUDNS, (e, hash) => {
        if(e) return reject(e);
        resolve(hash);
      });
    });
  }
}

module.exports.compare = function ComparePassword(pass1, pass2, done) {
  if(typeof done === 'function') {
    bcrypt.compare(pass1, pass1, done);
  } else {
    return new Promise((resolve, reject) => {
      bcrypt.compare(pass1, pass1, (e, isOk) => {
        if(e) return reject(e);
        resolve(isOk);
      });
    });
  }
}