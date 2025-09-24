# About the Webex CC Console

> [!TIP]
> Tired of reading? Just visit the [Videos Section](#video-explanations) at the bottom of the document and start watching.

## What is the Purpose of this Tool?
The Webex CC Console should help you managing multiple demos so that you can easily adapt multiple parameters and customer CRM data with a simple website. For example, if you have multiple flows created to demonstrate use cases for different industries (healthcare, finance, etc.), you can easily switch between them without logging in to Control Hub. Moreover, you can define demo parameters which can be dynamically changed with the tool - e.g., closing a service queue and setting a dynamic emergency message which will be played to customers. Since this tool also includes the simulation of a small CRM database, you can easily add the details of your real customers there and deliver highly customized demos.

## Application Examples
The most obvious one is to save the link the static website which hosts the service so you can quickly change the most important parameters. Since it is a public URL, everyone who knows it can potentially use it - including non-technical people. You can even save the URL as a web application on a Cisco video endpoint (e.g., Board Pro) and have the tool easily available in your demo environment. 

A second use case is to leverage the tool as a "supervisor console" within agent desktop. E.g., if you have demos with dynamic parameters, you can simply integrate the URL of the Webex CC console in the agent desktop and let the supervisor change some dynamic parameters (see [Creating Fully Customized Demos](#creating-fully-customized-demos)).

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

The _control_ item has to be part of the collection and must only exist once. It contains the following fields:

```json
{
  "_id": {
    "$oid": "random ID, usually provided by MongoDB"
  },
  "activeDemo": "",
  "demoSettings": true, /* this is a mandatory field and is required to find out what document is the control item */
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

If you want to add some parameters to your demo to make it more dynamic, you can just add an array field called `parameters` to the demo object which contains the following mandatory fields:
* `name` - the name of the field, should be treated like a variable (e.g., "demoLanguage")
* `label` - the description of the field, preferrably in your local language (e.g., "Sprache")
* `type` - the type of the field, can either be `string` or `boolean`
* `value` - the value of the field, can be anything in case of string, but only `true` or `false` in case of `boolean`

Here is a complete example for a demo which lets you define the language of the demo and whether the contact center is closed:

```json
{
  "_id": {
    "$oid": "12345"
  },
  "name": "Multilanguage Demo",
  "description": "This demo allows you to demonstrate that we support multiple languages. Valid options for the <i>language</i> parameter are &quot;German&quot;, &quot;French&quot; and &quot;English&quot;. The <i>CC Closed?</i> parameter defines whether a call will enter the queue or will be sent to voicemail.",
  "parameters": [
    {
      "name": "demoLanguage",
      "label": "Preferred Language",
      "type": "string",
      "value": "French"
    },
    {
      "name": "ccClosed",
      "label": "CC Closed?",
      "type": "boolean",
      "value": false
    }
  ]
}
```

Similar to the parameters, you can define the fields for a CRM which is saved in a separate database and collection. Note that the definition of the CRM fields for a demo object is only necessary if you want to manage them through the Webex CC Console - you can still use MongoDB Compass to create and manage your own customer data and access it through Webex CC or Webex Connect as explained in the [next section](#crud-actions-for-mongodb).

The `database` object consists of three items:
1. `dbName` - points to the database of your MongoDB cluster
2. `collectionName` - points to the collection in the previously defined database
3. `fields` - object which describe all fields (or columns) of your CRM database

The `fields` object is very similar to the `parameters` array of a demo object, but with the major difference that there is no value and that each field is defined as an object with the name of the field as key:

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
  "parameters": [
    {
      "name": "demoLanguage",
      "label": "Preferred Language",
      "type": "string",
      "value": "French"
    },
    {
      "name": "ccClosed",
      "label": "CC Closed?",
      "type": "boolean",
      "value": false
    }
  ],
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

## Creating Fully Customized Demos

## Including Webex CC Console in Agent Desktop

# Video Explanations

* [Installation Part One](https://app.vidcast.io/share/ecd9fdf3-aeac-468e-8c93-95dd9f288a83)
* [Installation Part Two](https://app.vidcast.io/share/b98dc818-d6c4-4a1f-ac36-b8bc6e8e9793) 

