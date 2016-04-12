'use strict';
const bcrypt = require('bcryptjs');
/**
 * Created by Adrian on 12-Apr-16.
 * The "auth.password.change" authorization middleware.
 * The password change authorization will allow the automatic change of passwords
 * including the history of it.
 */
module.exports = function(thorin, storeObj, opt) {
  const checkPolicy = require('../checkPolicy');
  const MAX_PASSWORD_LENGTH = 72;
  const logger = thorin.logger(opt.logger),
    dispatcher = thorin.dispatcher;

  const passField = opt.password.field;

  let inputData = {};
  // Add the "password" field
  inputData[passField] = dispatcher.validate("STRING", {
    max: MAX_PASSWORD_LENGTH
  }).error('AUTH.PASSWORD', 'Please enter your old password', 400);
  // Add the "password_new" field.
  inputData[passField + '_new'] = dispatcher.validate("STRING", {
    max: MAX_PASSWORD_LENGTH
  }).error('AUTH.PASSWORD', 'Please enter your new password', 400);
  // Add the "password_check" field.
  inputData[passField + '_check'] = dispatcher.validate("STRING", {
    max: MAX_PASSWORD_LENGTH
  }).error('AUTH.PASSWORD', 'Passwords do not match', 400);

  /*
   * Add the actual authorization middleware.
   * */
  dispatcher
    .addAuthorization("auth.password.change")
    .input(inputData)
    .use((intentObj, next) => {
      let accountObj = intentObj.data(opt.modelName);
      if (!accountObj) {
        logger.error(`Password change middleware does not contain the account object in intentObj.data(${opt.modelName})`);
        return next(thorin.error('AUTH.PASSWORD', 'Please login to continue', 403), thorin.error('AUTH.PASSWORD', 'Missing account model instance in intent data'));
      }
      let oldPass = intentObj.input(passField),
        newPass = intentObj.input(passField + '_new'),
        checkPass = intentObj.input(passField + '_check');
      if (opt.password.policy && newPass.length < opt.password.policy.min) {
        return next(thorin.error('AUTH.PASSWORD', 'Password must be at least ' + opt.password.policy.min + ' characters.'))
      }
      if (newPass !== checkPass) {
        return next(thorin.error('AUTH.PASSWORD', 'Passwords do not match.'));
      }
      let checkErr = checkPolicy(thorin, opt, newPass);
      if(checkErr) {
        return next(checkErr);
      }
      // Step one, check the old password.
      bcrypt.compare(oldPass, accountObj.get(passField), (err, isMatch) => {
        if(err) {
          logger.warn(`Failed to hash password for pass change authorization`);
          return next(thorin.error('AUTH.PASSWORD', 'An error occurred. Please try again.', err, 500));
        }
        if(!isMatch) {
          return next(thorin.error('AUTH.PASSWORD', 'Invalid password.', 403));
        }
        // at this point, we generate the new hash.
        bcrypt.hash(newPass, 10, (err, newHash) => {
          if(err) {
            logger.error('Failed to generate new password hash for pass change.');
            return thorin.error('AUTH.PASSWORD', 'An error occurred. Please try again', 500, err);
          }
          accountObj.set(passField, newHash);
          accountObj.save().then(() => {
            next();
            dispatcher.emit('auth:history', 'PASSWORD_CHANGE', accountObj, intentObj);
          }).catch((err) => {
            logger.error('Failed to update account with new password.', err);
            return thorin.error('AUTH.PASSWORD', 'An error occurred. Please try again.', 500, err);
          });
        });
      });
    });


};