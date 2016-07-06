'use strict';
const initModels = require('./lib/initModels'),
  checkPolicy = require('./lib/checkPolicy'),
  hasher = require('./lib/hasher');

/**
 * Created by Adrian on 08-Apr-16.
 * IMPORTANT for setting up the plugin:
 * add --setup=plugin.auth-password
 *
 * The plugin will:
 *  1. Register the "auth#password.login" authorization in the dispatcher,
 *    so it can be used in other places. This authorization middleware will
 *    place the opt.modelName (eg: account) in the intent, using the .data(modelName, accObj)
 *    and call the next function that is in line.
 *  2. Register the "auth#password.change" authorization in the dispatcher,
 *    so it can be used to enable password changing.
 */
const IDENTITY_TYPES = ['id', 'username', 'email'];
module.exports = function(thorin, opt, pluginName) {
  opt = thorin.util.extend({
    logger: pluginName || 'auth-password',
    modelName: 'account',      // the target SQL model to attach the password field to.
    store: 'sql',             // the Thorin SQL Store name to attach the model.
    identity: {
      field: 'user',      // the identity field to use for the ID.
      type: 'username',        // the type of that field.
      options: {}           // additional field options or validations
    },
    password: {
      field: "password",      // the password field to attach to the model.
      policy: {               // password policy to apply.
        min: 8,               // force minimum password length
        upper: false,         // force upper case fields
        numbers: false,       // force number usage?
        special: false       // force use of special characters such as ~!@#$
      },
      options: {}             // additional field options or validations.
    },
    loginAt: {              // Set to false if you do not want a login_at field.
      field: "login_at",
      options: {}               // should we add a last login field.
    }
  }, opt);
  let loader;
  // Step one: initiate the model.
  thorin.on(thorin.EVENT.INIT, 'store.' + opt.store, (storeObj) => {
    loader = initModels(thorin, storeObj, opt);
    loader.init();
    // Load all authorizations and middleware.
    thorin.loadPath(__dirname + '/lib/authorization', thorin, storeObj, opt);
    thorin.loadPath(__dirname + '/lib/middleware', thorin, storeObj, opt);
  });
  const pluginObj = {
    setup: (done) => {
      loader.setup();
      done();
    }
  };

  /* This will apply the password validation policy and return an error if not met. */
  pluginObj.checkPolicy = function CheckPasswordPolicy(password) {
    return checkPolicy(thorin, opt, password);
  };

  /* Expose our hashPassword() function */
  pluginObj.hashPassword = hasher.hash;
  /* Expose our comparePassword() function */
  pluginObj.comparePassword = hasher.compare;

  pluginObj.options = opt;

  return pluginObj;
};
module.exports.publicName = 'auth-password';