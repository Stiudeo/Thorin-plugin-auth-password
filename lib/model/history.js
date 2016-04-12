'use strict';
/**
 * Created by Adrian on 11-Apr-16.
 */
module.exports = function(thorin, opt, AccountModel) {

  function initModel(modelObj, Seq) {

    modelObj
      .field('id', Seq.PRIMARY)
      .field('type', Seq.STRING(20))      // the history type. Types: LOGIN, PASSWORD_CHANGE, etc.
      .field('user_agent', Seq.STRING, {
        defaultValue: null
      })
      .field('ip', Seq.STRING(20));

    modelObj.belongsTo(AccountModel.code);
  }

  return initModel;
};