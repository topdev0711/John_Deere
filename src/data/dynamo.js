const dynamo = require('dynamodb');
const {getConfig} = require('../../conf');
const {dynamoConfig} = getConfig();

dynamo.AWS.config.update(dynamoConfig);

if(!Array.prototype.collectItems){
  Object.defineProperty(Array.prototype, 'collectItems', {
    value: function() {
      return this.reduce((acc, x) => acc.concat(x.Items.map(y => y.get())), []);
    }
  });
}

module.exports = dynamo;
