'use strict';
const modelInit = require('./lib/initModels');
/**
 * Created by Adrian on 08-Apr-16.
 * IMPORTANT for setting up the plugin:
 * add --setup=plugin.auth-password
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
    },
    history: {                  // Do we want to hold a login history for each user? set to false to disable.
      modelName: null,          // the modelName
      tableName: null         // the actual table_name
    }
  }, opt);
  if(opt.history) {
    if(!opt.history.tableName) {
      opt.history.tableName = opt.modelName + '_history';
    }
    if(!opt.history.modelName) {
      opt.history.modelName = opt.modelName + 'History';
    }
  }
  let loader;
  // Step one: initiate the model.
  thorin.on(thorin.EVENT.INIT, 'store.' + opt.store, (storeObj) => {
    loader = modelInit(thorin, storeObj, opt);
    loader.init();
  });
  return {
    setup: (done) => {
      loader.setup();
      done();
    }
  }
};