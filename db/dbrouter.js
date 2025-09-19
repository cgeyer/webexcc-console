const express = require('express');
const {findDocuments, updateDocument, createDocument, deleteDocument} = require('./mongoDB');

const router = express.Router();

router.post('/find', async (req, res) => {
  result = await findDocuments(req.body.dbName, req.body.collectionName, req.body.query);
  //console.log(result);
  res.send(result);
});

router.post('/update', async (req, res) => {
  result = await updateDocument(req.body.dbName, req.body.collectionName, req.body.query, req.body.updateValues);
  //console.log(result);
  res.send(result);
});

router.post('/create', async (req, res) => {
  result = await createDocument(req.body.dbName, req.body.collectionName, req.body.values);
  //console.log(result);
  res.send(result);
});

router.post('/delete', async (req, res) => {
  result = await deleteDocument(req.body.dbName, req.body.collectionName, req.body.query);
  //console.log(result);
  res.send(result);
});

module.exports = router;