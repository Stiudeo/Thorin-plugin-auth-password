'use strict';
/**
 * Created by Adrian on 12-Apr-16.
 * Checks the password policy that applies.
 */
const UPPER_CASE_CHECK = /[A-Z]/g,
  SPECIAL_CHARS = `~!@#$%^&*()_+=-}|{][/.,\\'";\``.split(''),
  NUMBER_CHECK = '1234567890'.split('');
module.exports = function checkPasswordPolicy(thorin, opt, password) {
  let policy = opt.password.policy;
  // MIN was already checked.
  if(!policy) {
    return;
  }
  if(policy.upper && !UPPER_CASE_CHECK.test(password)) {
    return thorin.error('AUTH.PASSWORD', 'Password must contain at least one upper case characters');
  }
  if(policy.numbers) {
    let hasOne = false;
    for(let i=0; i < NUMBER_CHECK.length; i++) {
      if(password.indexOf(NUMBER_CHECK[i]) !== -1) {
        hasOne = true;
        break;
      }
    }
    if(!hasOne) {
      return thorin.error('AUTH.PASSWORD', 'Password must contain at least one number');
    }
  }
  if(policy.special) {
    let hasOne = false;
    for(let i=0; i < SPECIAL_CHARS.length; i++) {
      if(password.indexOf(SPECIAL_CHARS[i]) !== -1) {
        hasOne = true;
        break;
      }
    }
    if(!hasOne) {
      return thorin.error('AUTH.PASSWORD', 'Password must contain at least one special character');
    }
  }
  return;
};