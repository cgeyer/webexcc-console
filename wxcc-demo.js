const express = require('express');
const {findDocuments, updateDocument, createDocument, deleteDocument} = require('./db/mongoDB');
const dbRouter = require('./db/dbrouter');
const ejs = require('ejs');

const app = express();


app.use(express.static('static'));
app.use('/@momentum-design', express.static('./node_modules/@momentum-design'));
app.use(express.json());
app.use(express.urlencoded());

/* expose REST API for DB actions */
app.use('/db', dbRouter);

/* use ejs as redering engine */
app.set('view engine', 'ejs');

/* list all available demos on HTML page */
app.get('/demo.html', async (req, res) => {

  let {dbName} = req.query;

  if (dbName === undefined) {
    dbName = "demo";
  }

  let demoSettings = await findDocuments(dbName, "demos", query = {"demoSettings" : {$exists: true}});

  let demoResults = await findDocuments(dbName, "demos", query = {"demoSettings" : {$exists: false}})

  res.render('demo', {demoSettings: demoSettings[0], demos: demoResults});
});


app.listen(process.env.PORT, process.env.HOST, () => {
  /* console.log(`Server running at %s:%s`, process.env.HOST, process.env.PORT);*/
  console.log(process.env.PORT);
  console.log(process.env.HOST);
});