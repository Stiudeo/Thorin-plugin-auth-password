'use strict';
const hasher = require('../hasher');
/**
 * Created by Adrian on 12-Apr-16.
 * NOTE: ALL AUTHORIZATION PLUGINS AND MIDDLEWARES SHOULD TRIGGER
 * A "auth:login" event via the dispathcer.
 */
module.exports = function(thorin, storeObj, opt) {
  const MAX_PASSWORD_LENGTH = 72;
  const logger = thorin.logger(opt.logger),
    dispatcher = thorin.dispatcher;

  // TODO: Add a session limiter so that a user cannot brute force the login
  const idField = opt.identity.field,
    passField = opt.password.field;

  /*
   * Step ONE: add the auth.password authorization
   * */
  let inputData = {};
  // Add the identity field
  inputData[idField] = dispatcher
    .validate((opt.identity.type === 'email' ? 'EMAIL' : 'STRING'), {
      min: 2
    })
    .error(thorin.error('AUTH.PASSWORD.INVALID', 'Invalid or missing identity', 400));
  // Add the password field.
  inputData[passField] = dispatcher
    .validate("STRING", {
      max: MAX_PASSWORD_LENGTH // 72 is the max bcrypt input
    })
    .error(thorin.error('AUTH.PASSWORD.INVALID', 'Please enter your password'), 400);
  /*
   * Add the "auth.password" authorization. This will be used by an endpoint
   * to provide the user.
   * */
  dispatcher
    .addAuthorization('auth#password.login')
    .input(inputData)
    .use((intentObj, next) => {
      let identity = intentObj.input(idField).trim(),
        password = intentObj.input(passField);
      if(opt.identity.type === 'email') identity = identity.toLowerCase();
      if(opt.password.policy && password.length < opt.password.policy.min) {
        return next(thorin.error('AUTH.PASSWORD.INVALID', 'Password must be at least ' + opt.password.policy.min + ' characters.'))
      }
      let AccountModel = storeObj.model(opt.modelName),
        AccountStoreModel = storeObj.model(opt.modelName, true),
        qry = {
          where: {}
        };
      qry.where[idField] = identity;
      // Query for account by id.
      AccountModel.find(qry).then((accObj) => {
        if(!accObj) {
          /* IF we do not have an account, we still have to hash the password, to prevent timing attacks. */
          return hasher.hash(password, (err) => {
            return next(thorin.error('AUTH.PASSWORD.INVALID', 'Invalid ' + opt.identity.type + ' or password.', 403));
          });
        }
        let accPassword = accObj.get(passField);
        // Step one, hash the password
        hasher.compare(password, accPassword, (err, isMatch) => {
          if(err) {
            logger.warn(`Failed to hash password for identity ${identity}`);
            return next(thorin.error('AUTH.PASSWORD.INVALID', 'An error occurred. Please try again.', err, 500));
          }
          // Now, we query the db.
          if(!isMatch) {
            return next(thorin.error('AUTH.PASSWORD.INVALID', 'Invalid ' + opt.identity.type + ' or password.', 403));
          }
          // Check if we have a "is_active" field on the account. If so, we stop if it's not active.
          if(AccountStoreModel.fields['is_active'] && accObj.get('is_active') === false) {
            return next(thorin.error('AUTH.PASSWORD.DISABLED', 'This account has been disabled.', 403));
          }
          intentObj.data(opt.modelName, accObj);
          // At this point, check if we have the loginAt field.
          if(!opt.loginAt) return next();
          accObj.set(opt.loginAt.field, Date.now());
          accObj.save().then(() => {
            dispatcher.emit('auth:history', 'LOGIN', accObj, intentObj);
            next();
          }).catch((err) => {
            logger.error(`Failed to update login_at field while logging id ${identity}`, err);
            next(thorin.error('AUTH.PASSWORD.ERROR', 'An error occurred. Please try again', 500, err));
          });
        });
      }).catch((e) => {
        logger.error(`Encountered an error while logging id ${identity}`);
        next(thorin.error('AUTH.PASSWORD.ERROR', 'An error occurred. Please try again.', 500, e));
      });
    });

};