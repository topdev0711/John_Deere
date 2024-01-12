const mongoClient = require('../../../src/data/mongoClient');
const mongodb = require('mongodb');
const { docDbConnection } = require('../../../conf').getConfig();
const fs = require('fs');
const ca = [fs.readFileSync("rds-combined-ca-bundle.pem")];

let mockClose =  jest.fn();
let mockIsConnected = jest.fn(() => true);
let mockDb = jest.fn(() => (
  {
    collection: mockCollection
  }
));

jest.mock('mongodb', () => {
  return {
    MongoClient: {
      connect: jest.fn(() => (
        {
          db: mockDb,
          close: mockClose,
          isConnected: mockIsConnected
        }
      ))
    }
  }
});

const mongoOptions = { 
  sslValidate: true,
  sslCA: ca,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  readConcern: "majority",
  poolSize: 100
};

describe('documentDao tests', () => {
  it('should connect and close from MongoDb', async () => {
    await mongoClient.connectDB(docDbConnection);

    expect(mongodb.MongoClient.connect).toHaveBeenCalledWith(docDbConnection, mongoOptions);
  });

  it('should handle a failed connection', () => {
    const error = "Error connecting to MongoDB";
    mongodb.MongoClient.connect.mockRejectedValueOnce(error);

    return expect(mongoClient.connectDB(docDbConnection)).rejects.toThrow(error);
  });

  it('should get client', async () => {
    await mongoClient.connectDB(docDbConnection);
    return expect(mongoClient.getClient()).toHaveProperty('db');
  });
})