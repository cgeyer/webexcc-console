# About the Webex CC Console

> [!TIP]
> Tired of reading? Just visit the [Videos Section](#video-explanations) at the bottom of the document and start watching.

## What is the Purpose of this Tool?
When dealing with custom demos in Webex CC, it is often cumbersome to switch between different scenarios. It usually requires the admin of the sandbox environment to select to the proper flow which is assigned to the main phone number. Moreover, customers often want to see some standard features like a database / CRM integration live which is often only possible APIs. The main goal of the Webex CC Console is to improve the management and implementation of your Webex CC demos. You can easily switch between different flows, adapt demo parameters such as dynamic announcement texts, and manipulate CRM data - all from a simple website without the need for the end user to be familiar with the technical details of Webex CC.

<img width="1693" height="980" alt="Screenshot of Webex CC Console" src="https://github.com/user-attachments/assets/38b511ab-f93d-4ac6-a17e-4ff2199856c6" />

## Application Examples
As mentioned in the previous section, one of the main goals of the Webex CC console is to switch between different flows / scenarios. Moreover, you can define optional parameters for each demo which can be changed through the website. A good use case for that is a dynamic emergency announcement which is defined as parameter for a demo. Since there is no technical knowledge required, it can be used by anyone and you can even share it with a customer during a session.

The Webex CC Console also includes a [REST API wrapper for MongoDB](#crud-actions-for-mongodb) with the four main database functions (create, update, find and delete documents). Thus, you can leverage the tool for any kind of database interactions from different solutions including Webex Contact Center and Webex Connect.

A third use case is to leverage the tool as a "supervisor console" within the agent desktop. E.g., if you have demos with dynamic parameters, you can simply integrate the URL of the Webex CC console in the agent desktop and let the supervisor change some dynamic parameters (see [Creating Fully Customized Demos](#creating-fully-customized-demos)).

## Architecture at a Glance
The Webex CC Console is built using four main components:
1. [MongoDB](#prepare-mongodb) which serves as database in the background.
2. Node.js as web service.
3. The [@momentum-design components](https://momentum-design.github.io/momentum-design/en/components/) library which is an open-source project by Cisco to facilitate creating web applications which are compatible with Webex.
4. alwaysdata to facilitate (free) hosting of the complete tool on a publicly available URL.

You do not need to fully understand JavaScript, HTML or Node.js, but should be familiar with JSON and REST APIs if you want to customize this tool and use it in your own environment.

# Installation Guide
> [!NOTE]
> This description is based on MongoDB and alwaysdata. It's not necessary to use alwaysdata as provider, but it is a free and simple to use hosting service which supports node.js natively. Please consult the documentation of your hosting provider if you are going with a different platform.

## Prepare MongoDB
Visit https://account.mongodb.com/account/login and create a new account if you do not have one. Create a new cluster, select the free plan, provide a name and choose a hosting location of your choice. Add your current IP address to allow access to your database by navigating to Security / Network Access. Also add 188.72.70.0/24 and 185.31.40.0/22 to allow alwaysdata to connect to your cluster. Adapt the IP address ranges accordingly if you are using a different provider.

In the MongoDB web admin, navigate to Security / Database Access and create a new user. Choose a username and save the auto-generated password. Select `Read and write to any database` in the _built-in roles_ section.

Connect to MongoDB using the Compass app - navigate to Database / Clusters and click on _connect_. Choose _Compass_ as connection method, download the client if necessary and copy the connection string (e.g., `mongodb+srv://<db_username>:<db_password>@cluster0.tzooqiz.mongodb.net/`). Replace the username and password with the ones created in the previous step. Also take note of the domain of your MongoDB (e.g., `cluster0.tzooqiz.mongodb.net`) since we will require that information later. Once connected, create a new database called _demo_ and a new collection called _demos_. Import the `demo.demos.json` file to your _demos_ collection by clicking to the _+ Add data_ button. You should now see five documents in total in the _demos_ collection you just created. 

Congratulations, we are done with all the basic steps in MongoDB and can continue!

## Setting up alwaysdata as Hosting Provider
Visit https://www.alwaysdata.com/en/register/ and create a new account. After the validation of your email address, select the _Free_ plan from the product dropdown, create a username and password. That account will be used for remote access such as SSH. The username will also determine the domain name of your service, i.e., `<username>.alwaysdata.net` for webhosting. Save the password - navigate to Remote Access / SSH and either use your favourite SSH client or simply use the web option presented on top. Authentication works using the username and password you created earlier.

Once connected via SSH clone this repository by executing the command `git clone https://github.com/cgeyer/webexcc-console.git`. Now change to the created directory by entering `cd webexcc-console` and install all required node.js packages by executing `npm i` (may take a while).

Switch back to the alwaysdata web admin portal and navigate to Web / Sites. You should see one listed website there which is hosted using PHP per default. Click on the gear icon and change the following configuration:
* **Type:** Node.js
* **Command:** `node ~/webexcc-console/wxcc-demo.js <dbuser> <dbpassword> <mongodburl>` (replace all parameters with the data you saved in the previous steps)
* **Working Directory:** `webexcc-console`
* **Environment:** `IP=fd00::6:5d5a PORT=8100`

You can leave the remaining parameters at the default values and click _Submit_. Now open the site in a new tab and add `demo.html` to the path - the complete URL should look like `https://<username>.alwaysdata.net/demo.html`. This will be the main landing page for your Webex CC Console. If everything has been properly configured, you should be able to see four demos overall with one of them active. Try to add a new CRM entry for one of the demos and check if you see any updates in the MongoDB compass app - there should be new documents in a newly created collection if everything worked fine.

Congratulations, we are now done with installing all necessary components and can now set up a demo flow in Webex CC to integrate with MongoDB!

## Integrating Webex CC
Log in to your Webex Control Hub and go to the Webex CC administration page. We are assuming that all basic settings for Webex CC have already been provided and you have a working phone number assigned to an entry point as minimum requirement. Now create a new flow by navigating to Customer Experience / Flows / Manage Flows. Click on _Import Flows_ and upload `DemoSwitcher.json`. 

Open the flow _DemoSwitcher_ in Flow Designer, switch to edit mode and adapt the URL in the second node (_GetActiveDemo_) to point to your alwaysdata domain (e.g., `https://<username>.alwaysdata.net/db/find`). Note that this demo flow includes a call to another flow in case the _energyAIAgent_ demo is set to active. Please either enter a valid flow for that node or simply remove it and let the path from the _DemoSwitcher_ node point to the _AnnounceDemo_ node. Save all changes and publish the flow.

Make sure that your entry point is leveraging the flow you have just imported and make a test call. Try to switch between the different demos using the Webex CC Console (URL explained in previous section) and check whether the announcement is adapting accordingly. If that is the case, everything has been configured correctly. 

Congratulations, we are now done with all basic steps and you can start adapting your flows and create your own demos!

# Working with the Webex CC Console

## Understanding the Demo JSON Structure

MongoDB consists of so called databases and collections and saves all items as JSON structures with a unique ID. A database is equivalent to a database in the SQL world whereas a collection is quite similar to a table - with the major difference that theoretically every item in a collection can have different attributes (JSON keys) or columns in the SQL world. That makes MongoDB a very attractive solution for quick PoCs and demos.

The main collection of the Webex CC Console is called _demos_ and was created in the [first step](#prepare-mongodb) of the installation. If you want to completely customize the environment so the Webex CC Console reflects the demos you have created, you can remove or edit all items via the MongoDB Compass app. There are two type of documents:
* The _control_ item which saves which demo is currently active.
* The _demo_ item which saves all details about a demo.

The _control_ item has to be part of the collection and must only exist once. It contains the following mandatory fields (note that the `demoSettings` field always needs to be `true`):

```json
{
  "_id": {
    "$oid": "random ID, usually provided by MongoDB"
  },
  "activeDemo": "",
  "demoSettings": true,
  "dbName": "the name of the MongoDB database which contains the 'demo' collection"
}
```

The _demo_ items contains two different parts:
1. The general definition and attributes of a demo such as the name, a description (optional) and parameters (optional). 
2. The optional definition of a CRM / customer database which you can use in your demos for identifying customers.

Here is an example of a minimal demo:

```json
{
  "_id": {
    "$oid": "random ID, usually provided by MongoDB"
  },
  "name": "name of your demo - will be displayed on the Website and will be saved in the control item - must be unique"
}
```

Of course, it is recommended to add a description to your demo which explains the purpose of your demo and can also include some instructions how to use it. Since it will be included in the website, you can even use HTML code for formatting purposes:

```json
{
  "_id": {
    "$oid": "12345"
  },
  "name": "My First Demo",
  "description": "This demo is <b>mindblowing</b>!"
}
```

If you want to add some parameters to your demo to make it more dynamic, you can just add a JSON object called `parameters` which may contain multiple parameters, each with the following structure:
* key - the unique name / identifier of the field
* `label` - the description of the field, preferrably in your local language (e.g., "Sprache")
* `type` - the type of the field, can either be `string` or `boolean`
* `value` - the value of the field, can be anything in case of string, but only `true` or `false` in case of `boolean`

Here is a working example for a demo which lets you define the language of the demo and whether the contact center is closed:

```json
{
  "_id": {
    "$oid": "12345"
  },
  "name": "Multilanguage Demo",
  "description": "This demo allows you to demonstrate that we support multiple languages. Valid options for the <i>language</i> parameter are &quot;German&quot;, &quot;French&quot; and &quot;English&quot;. The <i>CC Closed?</i> parameter defines whether a call will enter the queue or will be sent to voicemail.",
  "parameters": {
    "demoLanguage": {
      "label": "Preferred Language",
      "type": "string",
      "value": "French"
    },
    "ccClosed": {
      "label": "CC Closed?",
      "type": "boolean",
      "value": false
    }
  }
}
```

Similar to the parameters, you can define the fields for a CRM which is saved in a separate database and collection. Note that the definition of the CRM fields for a demo object is only necessary if you want to manage them through the Webex CC Console - you can still use MongoDB Compass to create and manage your own customer data and access it through Webex CC or Webex Connect as explained in the [next section](#crud-actions-for-mongodb). Note that you do not need to create any database or collection for the CRM database in MongoDB to start using it - the Webex CC Console allows you to insert documents based on the definition and you can edit entries later at any time.

The `database` object consists of three items:
1. `dbName` - points to the database of your MongoDB cluster
2. `collectionName` - points to the collection in the previously defined database
3. `fields` - object which describe all fields (or columns) of your CRM database

The `fields` object is very similar to the `parameters` objects explained above, but with the major difference that there is no `value` parameter:

```json
"fields": {
  "firstField": {
    "label": "description 1",
    "type": "string"
  },
  "secondField": {
    "label": "description 2",
    "type": "boolean"
  }
}
```

Here is a complete example of a demo object with an associated CRM database containing three fields - name, phone number and email address:

```json
{
  "_id": {
    "$oid": "12345"
  },
  "name": "Multilanguage Demo",
  "description": "This demo allows you to demonstrate that we support multiple languages. Valid options for the <i>language</i> parameter are &quot;German&quot;, &quot;French&quot; and &quot;English&quot;. The <i>CC Closed?</i> parameter defines whether a call will enter the queue or will be sent to voicemail.",
  "parameters": {
    "demoLanguage": {
      "label": "Preferred Language",
      "type": "string",
      "value": "French"
    },
    "ccClosed": {
      "label": "CC Closed?",
      "type": "boolean",
      "value": false
    }
  },
  "database": {
    "dbName": "demo",
    "collectionName": "mlanguage-crm",
    "fields": {
      "customerName": {
        "type": "string",
        "label": "Customer Full Name"
      },
      "phoneNumber": {
        "type": "string",
        "label": "Customer Phone Number"
      },
      "email": {
        "type": "string",
        "label": "Customer Email"
      }
    }
  }
}
```

## CRUD Actions for MongoDB

The Webex CC Console also includes a wrapper for the four most common database transactions and maps them to the respective MongoDB functions. All of them can be easily accessed by using a `POST` request on the `db` path (i.e., `https://<username>.alwaysdata.net/db`) and append the supported function. The paths are defined in the `dbrouter.js` file in the `db` folder of the project. The implementation of the database actions are all implemeted in the `MongoDB.js` file in the same folder. Thus, you can easily extended the Webex CC Console by adding more functions supported by MongoDB. Please also refer to the official documentation of the [MongoDB node.js drivers](https://www.mongodb.com/docs/drivers/node/current/) for further information.

### Create Document / `db/create`

Creates a new single document (maps to the [insertOne()](https://www.mongodb.com/docs/drivers/node/current/crud/insert/) function of MongoDB). Will create a new database and / or collection if the specified ones do not exist. Returns the JSON object defined by the MongoDB `insertOne()` function.

Expected parameters:
* `dbName`: the name of the database where the new document will be added.
* `collectionName`: the name of the collection within the previously defined database where the new document will be added.
* `values`: a JSON object with any kind of supported data in key / value format. Does not need to have an `_id` key - that is usually automatically created by MongoDB.

Example for the `POST` request body (creates a basic JSON object with a number):
```
{
  "dbName":"database",
  "collectionName":"collection",
  "values" : {
    "test" : 1 
  }
}
```

### Find Document / `db/find`

Finds documents (maps to the [find()](https://www.mongodb.com/docs/drivers/node/current/crud/query/retrieve/) function of MongoDB, but doesn't implement projections) based on the provided search parameters. The result object will always be an array, even if there is no (will return an empty array) or just a single document found (will return an array with a single item).

Expected parameters:
* `dbName`: the name of the database where to search for the document.
* `collectionName`: the name of the collection within the previously defined database where to search for the document.
* `query`: a JSON object which allows you to test for values. Also supports dynamic queries as defined by the [MongoDB API](https://www.mongodb.com/docs/drivers/node/current/crud/query/query-document/) (e.g., `$lt` for testing numbers to be less than a specified value). When using dynamic tests with query parameters, make sure that they are put in quotes (e.g., `"$lt" : 5`).

Example for the `POST` request body (searches the document created in the previous step by looking for all documents which have a value of 1 or greater for the "test" key):
```
{
  "dbName":"database",
  "collectionName":"collection",
  "query" : {
    "test" : {
      "$gte" : 1 
    }
  }
}
```

### Update Document / `db/update`

Updates documents (maps to the [updateOne()](https://www.mongodb.com/docs/drivers/node/current/crud/update/modify/) function of MongoDB using the `$set` operator), but doesn't create a new object if no document with the specified query parameters is found. Returns the JSON object defined by the MongoDB `updatedOne()` function.

Expected parameters:
* `dbName`: the name of the database where to search for the document.
* `collectionName`: the name of the collection within the previously defined database where to search for the document.
* `query`: a JSON object which allows you to test for values. If the query contains the `_id` key, all other provided search parameters will be ignored.
* `updateValues`: a JSON object with the new values for the specified key. Will create a new key - value pair within the found object if the specified key does not exist.

Example for the `POST` request body (updates the document created in a previous step and setting the "test" value to 2):
```
{
  "dbName":"database",
  "collectionName":"collection",
  "query" : {
    "test" : {
      "$gte" : 1 
    }
  },
  "updateValues" : {
    "test" : 2
  }
}
```

### Delete Document / `db/delete`

Deletes a document (maps to the [deleteOne()](https://www.mongodb.com/docs/drivers/node/current/crud/delete/)) which is matching the provided search parameters. It will not remove the collection or the database when the provided search is deleting the last document of the collection and / or database. Returns the JSON object defined by the MongoDB `deleteOne()` function.
Expected parameters:
* `dbName`: the name of the database where to search for the document.
* `collectionName`: the name of the collection within the previously defined database where to search for the document.
* `query`: a JSON object which allows you to test for values. If the query contains the `_id` key, all other provided search parameters will be ignored.

Example for the `POST` request body (deletes the document created in a previous step):
```
{
  "dbName":"database",
  "collectionName":"collection",
  "query" : {
    "test" : {
      "$gte" : 1 
    }
  }
}
```


## Creating Fully Customized Demos

## Including Webex CC Console in Agent Desktop

# Video Explanations

* [Installation Part One](https://app.vidcast.io/share/ecd9fdf3-aeac-468e-8c93-95dd9f288a83)
* [Installation Part Two](https://app.vidcast.io/share/b98dc818-d6c4-4a1f-ac36-b8bc6e8e9793) 

