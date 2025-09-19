const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

async function findDocuments(dbName, collectionName, query={}) {

  const dbAdmin = process.argv[2];
  const dbPassword = process.argv[3];
  const mongoDbUrl = process.argv[4];

  const dbUrl = "mongodb+srv://" + dbAdmin + ":" + dbPassword + "@" + mongoDbUrl + "/?retryWrites=true&w=majority&appName=MongoDB";

  const client = new MongoClient(dbUrl, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {

    var returnResults = new Array();

    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    const results = collection.find(query);
    returnResults = await results.toArray();
    
    return returnResults;

    
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}



async function updateDocument(dbName, collectionName, query={}, updateValues={}) {

  const dbAdmin = process.argv[2];
  const dbPassword = process.argv[3];
  const mongoDbUrl = process.argv[4];

  const dbUrl = "mongodb+srv://" + dbAdmin + ":" + dbPassword + "@" + mongoDbUrl + "/?retryWrites=true&w=majority&appName=MongoDB";

  const client = new MongoClient(dbUrl, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });


  try {

    var returnResult;
    var queryStruct;

    await client.connect();

    const database = client.db(dbName);

    const collection = database.collection(collectionName);

    /* distinguish use case object ID vs general filter */
    if (query.hasOwnProperty('_id')) {
    	queryStruct = {
    		"_id" : new ObjectId(query._id)
    	}
    } else {
    	queryStruct = query;
    }

    updateStruct = {
    	$set : updateValues
    };

    returnResults = await collection.updateOne(queryStruct, updateStruct);

    return returnResults;

    
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}


async function createDocument(dbName, collectionName, values) {

  const dbAdmin = process.argv[2];
  const dbPassword = process.argv[3];
  const mongoDbUrl = process.argv[4];

  const dbUrl = "mongodb+srv://" + dbAdmin + ":" + dbPassword + "@" + mongoDbUrl + "/?retryWrites=true&w=majority&appName=MongoDB";

  const client = new MongoClient(dbUrl, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });


  try {

    var returnResult;

    await client.connect();

    const database = client.db(dbName);

    const collection = database.collection(collectionName);

    returnResults = await collection.insertOne(values);

    return returnResults;

    
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}



async function deleteDocument(dbName, collectionName, query={}) {

  const dbAdmin = process.argv[2];
  const dbPassword = process.argv[3];
  const mongoDbUrl = process.argv[4];

  const dbUrl = "mongodb+srv://" + dbAdmin + ":" + dbPassword + "@" + mongoDbUrl + "/?retryWrites=true&w=majority&appName=MongoDB";

  const client = new MongoClient(dbUrl, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });


  try {

    var returnResult;
    var queryStruct;

    await client.connect();

    const database = client.db(dbName);

    const collection = database.collection(collectionName);

    /* distinguish use case object ID vs general filter */
    if (query.hasOwnProperty('_id')) {
      queryStruct = {
        "_id" : new ObjectId(query._id)
      }
    } else {
      queryStruct = query;
    }

    //console.log(queryStruct);

    returnResults = await collection.deleteOne(queryStruct);

    return returnResults;

    
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

exports.findDocuments = findDocuments;
exports.updateDocument = updateDocument;
exports.createDocument = createDocument;
exports.deleteDocument = deleteDocument;