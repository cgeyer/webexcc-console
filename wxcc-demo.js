const express = require('express');
const cors = require('cors');
const {findDocuments, updateDocument, createDocument, deleteDocument} = require('./db/mongoDB');
const dbRouter = require('./db/dbrouter');
const ejs = require('ejs');

const app = express();


// CORS configuration
app.use(cors({
  origin: 'https://desktop.wxcc-us1.cisco.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
  let {supervisorMode} = req.query;

  if (dbName === undefined) {
    dbName = "demo";
  }

  let demoSettings = await findDocuments(dbName, "demos", query = {"demoSettings" : {$exists: true}});

  let demoResults;

  let title = "Webex Contact Center Demos";

  if (supervisorMode !== undefined && supervisorMode == "on") {
    title = "Supervisor Controls"
    demoResults = await findDocuments(dbName, "demos", query = {"name" : demoSettings[0].activeDemo});
    supervisorMode = true;
  } else {
    demoResults = await findDocuments(dbName, "demos", query = {"demoSettings" : {$exists: false}});
    supervisorMode = false;
  }

  res.render('demo', {demoSettings: demoSettings[0], demos: demoResults, title: title, supervisorMode: supervisorMode});
});


app.listen(process.env.PORT, process.env.HOST, () => {
  /* console.log(`Server running at %s:%s`, process.env.HOST, process.env.PORT);*/
  console.log(process.env.PORT);
  console.log(process.env.HOST);
});