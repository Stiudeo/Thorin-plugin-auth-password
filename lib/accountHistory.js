'use strict';
/**
 * Created by Adrian on 12-Apr-16.
 */

module.exports = function(thorin, storeObj, opt) {
  const logger = thorin.logger(opt.logger);
  const relationField = storeObj.decamelize(opt.modelName + 'Id'),
    AccountStoreModel = storeObj.model(opt.modelName, true),
    AccountPrimaryKey = AccountStoreModel.getPrimary();
  /* These are history actions. */
  const history = {};

  /*
   * Creates a new history entry from the intent, with the given type.
   * Arguments:
   *   accountObj - the account that performed an action.
   *   type - the type of history entry.
   *   data -> an intentObj with client information, OR the actual fields of the history model.
   * */
  history.create = function CreateItem(accountObj, type, data) {
    let HistoryModel = storeObj.model(opt.history.modelName);
    let itemObj = HistoryModel.build({
      type: type
    });
    itemObj.set(relationField, accountObj.get(AccountPrimaryKey.name));
    if(data instanceof thorin.Intent) {
      itemObj.set('ip', data.client('ip'));
      itemObj.set('user_agent', data.client('headers')['user-agent']);
    } else if(typeof data === 'object' && data) {
      Object.keys(data).forEach((key) => {
        itemObj.set(key, data[key]);
      });
    }
    return itemObj.save();
  };

  return history;
};