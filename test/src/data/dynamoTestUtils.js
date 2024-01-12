function createJsonFunction(key, aggregatedJsonFunction) {
  return () => ({[key]: aggregatedJsonFunction})
}

function createFunction(keys, response) {
  let dynamoFunction = () => response;
  keys.reverse().forEach(key => dynamoFunction = createJsonFunction(key, dynamoFunction));
  return dynamoFunction;
}

module.exports = {
  createFunction
};
