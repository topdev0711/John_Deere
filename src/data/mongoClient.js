const mongo = require('mongodb');
const fs = require('fs');
const ca = [fs.readFileSync("rds-combined-ca-bundle.pem")];
let log = require('edl-node-log-wrapper');

const setLogger = logger => log = logger;
const dbService = { db: undefined };
const getClient = () => dbService.db;
const MongoClient = mongo.MongoClient;
const mongoOptions = {
  sslValidate: true,
  sslCA: ca,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  readConcern: "majority",
  poolSize: 100
};

async function connectDB(docDbConnection) {
    log.info("Connecting to Mongo");
    try {
      dbService.db = await MongoClient.connect(docDbConnection, mongoOptions);
      log.info("Connected to MongoDB");
    }
    catch(err) {
      log.error('Error connecting to MongoDB with error: ', err);
      throw Error('Error connecting to MongoDB');
    }
}

module.exports = { setLogger, getClient, connectDB }
