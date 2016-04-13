'use strict';
/**
 * Created by Adrian on 11-Apr-16.
 */
module.exports = function(thorin, storeObj, opt) {

  const loader = {};
  const logger = thorin.logger(opt.logger),
    Seq = storeObj.getSequelize();

  let shouldSyncModel = false;

  /*
  * initialize the models.
  * */
  loader.init = function() {
    let AccountModel = storeObj.model(opt.modelName);
    if (!AccountModel) {
      logger.fatal('SQL store does not have auth model: ' + opt.modelName);
      return false;
    }

    // Check if we have to attach the identity field.
    if (!AccountModel.fields[opt.identity.field]) {
      shouldSyncModel = true;
      let fieldOpt = {
        allowNull: false
      };
      if (opt.identity.type === 'email') {
        fieldOpt.validate = {
          isEmail: true
        };
      }
      fieldOpt = thorin.util.extend(fieldOpt, opt.identity.options);
      AccountModel.field(opt.identity.field, Seq.STRING(130), fieldOpt)
      AccountModel.index(opt.identity.field);
    }

    // Check if we have to attach the password field.
    if (!AccountModel.fields[opt.password.field]) {
      shouldSyncModel = true;
      let fieldOpt = {
        private: true,
        filter: false,
        allowNull: true,     // null passwords will require a password set on first login.
        defaultValue: null
      };
      fieldOpt = thorin.util.extend(fieldOpt, opt.password.options)
      AccountModel.field(opt.password.field, Seq.STRING, fieldOpt);
    }
    // Check if we have to add the login_at field.
    if (opt.loginAt && !AccountModel.fields[opt.loginAt.field]) {
      shouldSyncModel = true;
      let fieldOpt = {
        private: true,
        defaultValue: null,
        allowNull: true
      };
      fieldOpt = thorin.util.extend(fieldOpt, opt.loginAt.options);
      AccountModel.field(opt.loginAt.field, Seq.DATE, fieldOpt);
    }

  };

  /*
  * Setup the DB
  * */
  loader.setup = function() {
    logger.info('Setting up db models once store %s is running', storeObj.name);
    thorin.on(thorin.EVENT.RUN, 'store.' + storeObj.name, () => {
      let syncs = [];
      // sync the account model.
      if (shouldSyncModel) {
        syncs.push(() => {
          return storeObj.sync(opt.modelName);
        });
      }
      thorin.series(syncs, (err) => {
        if(err) {
          logger.error('Failed to sync db models.', err);
        }
      });
    });
  };
  return loader;
};