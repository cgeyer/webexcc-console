var newTempDemo = "";
var currentCRMElement = undefined;
var tempCRMElement = undefined;

function themeSwitcher(theme) {

  let newTheme = "mds-theme-stable-darkWebex";
  document.getElementsByTagName("mdc-themeprovider")[0].setAttribute("themeclass", theme);
  if (theme == "mds-theme-stable-darkWebex") {
    newTheme = "mds-theme-stable-lightWebex";
    document.getElementById("root").style = "background: url('@momentum-design/brand-visuals/dist/png/operation-pop-background-dark.png'); background-size: cover;";

  } else {
    document.getElementById("root").style = "background: url('@momentum-design/brand-visuals/dist/png/operation-pop-background-light.png'); background-size: cover;";
  }
  document.getElementById("theme-toggle").setAttribute("onChange", "themeSwitcher('" + newTheme + "')")
}

function confirmActiveDemo(newDemoName) {

  document.getElementById('enable-dialog-body').innerHTML = `<p>Do you really want to change the active demo from <b>${demoSettings.activeDemo}</b> to <b>${newDemoName}</b>?</p>`;

  document.getElementById('enable-dialog').visible = "true";

  newTempDemo = newDemoName;
}

async function changeActiveDemo() {

  document.getElementById('cancel-button').disabled = "true";
  document.getElementById('confirm-button').disabled = "true";
  document.getElementById('enable-dialog-body').innerHTML = '<mdc-spinner size="midsize" variant="standalone"></mdc-spinner>';
  
  fetchBody = {
    dbName : demoSettings.dbName,
    collectionName : "demos",
    query : {
      demoSettings : true
    },
    updateValues : {
      activeDemo : newTempDemo
    }
  };

  let response = await fetch("/db/update", {
    method: "POST",
    body: JSON.stringify(fetchBody),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  });

  let jsonResponse = await response.json();

  if (jsonResponse.modifiedCount == 1) {
  
    let oldDemoName = demoSettings.activeDemo;

    let newDemo = document.getElementById(newTempDemo + '-enable');
    newDemo.color = "mint";
    newDemo.label = "Active";
    newDemo.removeAttribute("onClick");

    let oldDemo = document.getElementById(oldDemoName + '-enable');
    oldDemo.color = "orange";
    oldDemo.label = "Enable";
    oldDemo.setAttribute("onClick", `confirmActiveDemo('${oldDemoName}')`);

    document.getElementById('activeDemoName').innerHTML = newTempDemo;

    demoSettings.activeDemo = newTempDemo;

    document.getElementById('enable-dialog-body').innerHTML = `<p>Successfully changed active demo from <b>${oldDemoName}</b> to <b>${newTempDemo}</b>.</p>`;

    
  } else {

    document.getElementById('enable-dialog-body').innerHTML = "<p>Couldn't update active demo, please try again.</p>";
    
  }

  document.getElementById('cancel-button').slot = "";
  document.getElementById('confirm-button').slot = "";
  document.getElementById('ok-button').slot = "footer-button-primary"; 
  
}

function hideDialog(dialogName) {

  document.getElementById(dialogName + '-dialog').visible = "";

  if (dialogName == "enable") {

    document.getElementById('ok-button').slot = "";
    document.getElementById('confirm-button').slot = "footer-button-primary";
    document.getElementById('cancel-button').slot = "footer-button-secondary";

    if (document.getElementById('cancel-button').hasAttribute("disabled")) {
      document.getElementById('cancel-button').removeAttribute("disabled");  
    }
    
    if (document.getElementById('confirm-button').hasAttribute("disabled")) {
      document.getElementById('confirm-button').removeAttribute("disabled");
    }

  } else if (dialogName == "delete") {
    document.getElementById('delete-dialog-body').innerHTML = "<p>Do you really want to delete the current element?</p>"
  }
  
}

function confirmDeleteCRMElement(demoId, dataId) {

  document.getElementById('delete-button').setAttribute("onClick", "deleteCRMElement('" + demoId + "','" + dataId + "')");
  document.getElementById('delete-dialog').visible = "true";

}

async function deleteCRMElement(demoId, dataId) {

  let dbName, collectionName, demoIdx, dataIdx;

  /* identify right database & collection, save index to demo and data entry */ 
  for (let i = 0; i < demos.length; i++) {
    if (demos[i]._id == demoId) {
      dbName = demos[i].database.dbName;
      collectionName = demos[i].database.collectionName;
      demoIdx = i;
      for (let j = 0; j < demos[i].database.data.length; j++) {
        if (demos[i].database.data[j]._id == dataId) {
          dataIdx = j;
          break  
        }        
      }
      break;
    }
  }

  fetchBody = {
    dbName : dbName,
    collectionName : collectionName,
    query : {
      _id : dataId
    }
  };

  /* update dialog */
  document.getElementById('delete-dialog-body').innerHTML = '<mdc-spinner size="midsize" variant="standalone"></mdc-spinner>';

  let response = await fetch("/db/delete", {
    method: "POST",
    body: JSON.stringify(fetchBody),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  });

  let jsonResponse = await response.json();

  /* if document was deleted, remove entry from crm collection */
  if (jsonResponse.deletedCount) {

    removeCRMElementFromAllDemos(dbName, collectionName, dataId, dataIdx);

  }

  hideDialog('delete');
}

function removeCRMElementFromAllDemos(dbName, collectionName, dataId, dataIdx) {

  // console.log(`removeCRMElementFromAllDemos(${dbName}, ${collectionName}, ${dataId}, ${dataIdx})`)

  for (let i = 0; i < demos.length; i++) {
    /* if current demo has database property */
    if (demos[i].hasOwnProperty("database")) {
      /* ... and is using the same database and collection */
      if (demos[i].database.dbName == dbName && demos[i].database.collectionName == collectionName && demos[i].database.hasOwnProperty("data")) {
        let demoId = demos[i]._id;
        /* remove current element from current data array */
        demos[i].database.data.copyWithin(dataIdx, dataIdx + 1, demos[i].database.data.length);
        demos[i].database.data.pop();

        /* remove current element from HTML struct */
        document.getElementById(demoId + "-" + dataId + "-crmdivider").remove();
        document.getElementById(demoId + "-" + dataId + "-crmrow").remove();
      }

    }
  }

}

function updateCRMElementForAllDemos() {
  let dbName = currentCRMElement.dbName, collectionName = currentCRMElement.collectionName, 
  dataId = currentCRMElement.dataId, dataIdx = currentCRMElement.dataIdx, data = currentCRMElement.data;

  let crmHTMLElement;

  for (let i = 0; i < demos.length; i++) {
    /* if current demo has database property */
    if (demos[i].hasOwnProperty("database")) {
      /* ... and is using the same database and collection and has already loaded the data */
      if (demos[i].database.dbName == dbName && demos[i].database.collectionName == collectionName && demos[i].database.hasOwnProperty("data")) {

        /* update variable with current crm entry */
        Object.assign(demos[i].database.data[dataIdx],data);

        /* update HTML struct */
        for (let field in data) {
          if (field == "_id") {
            continue;
          }
          crmHTMLElement = document.getElementById(demos[i]._id + "-" + dataId + "-" + field);
          
          /* make sure toggles are set properly */ 
          if (currentCRMElement.fields[field].type == "string") {
            crmHTMLElement.value = data[field];  
          } else if (currentCRMElement.fields[field].type == "boolean") {
            if (data[field]) {
              crmHTMLElement.setAttribute("checked", "")
            } else if (crmHTMLElement.hasAttribute("checked")) {
              crmHTMLElement.removeAttribute("checked");
            }
          }

        }

      }
    }
  }

}


async function updateCRMElement() {

  let data = currentCRMElement.data, demoId = currentCRMElement.demoId, dataId = currentCRMElement.dataId, fields = currentCRMElement.fields;
  let crmHTMLElement, fetchBody, updateValues;


  fetchBody = {
    dbName : currentCRMElement.dbName,
    collectionName : currentCRMElement.collectionName,
  };

  updateValues = {};

  /* save all fields to updateValue array */
  for (let field in data) {
    if (field == "_id") {
      fetchBody.query = {
        _id : dataId
      };
      continue;
    }
    
    crmHTMLElement = document.getElementById(demoId + "-" + dataId + "-" + field);
    crmHTMLElement.setAttribute("disabled", "");
    /* distinguish between string and boolean */
    if (fields[field].type == "boolean") {
      updateValues[field] = crmHTMLElement.hasAttribute("checked");
    } else if (fields[field].type == "string") {
      updateValues[field] = crmHTMLElement.value;
    }
  
  }

  fetchBody.updateValues = updateValues;

  document.getElementById(currentCRMElement.demoId + "-" + currentCRMElement.dataId + "-confirmgroup").style.display = "none";
  document.getElementById(currentCRMElement.demoId + "-" + currentCRMElement.dataId + "-spinner").style.display = "inherit";

  let response = await fetch("/db/update", {
    method: "POST",
    body: JSON.stringify(fetchBody),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  });

  let jsonResponse = await response.json();

  currentCRMElement.data = updateValues;

  updateCRMElementForAllDemos();
  
  document.getElementById(currentCRMElement.demoId + "-" + currentCRMElement.dataId + "-spinner").style.display = "none";
  document.getElementById(currentCRMElement.demoId + "-" + currentCRMElement.dataId + "-editgroup").style.display = "inherit";
  document.getElementById(currentCRMElement.demoId + "-" + currentCRMElement.dataId + "-spinner").style.display = "none";
  
  /* remove pointer to an active crm element which is edited */
  currentCRMElement = undefined;

}


function editCRMElement(demoId, dataId) {

  let data, dbName, collectionName, fields, dataIdx;

  /* only allow single element to be edited at the same time */ 
  if (currentCRMElement !== undefined) {
    cancelEditCRMElement();
  }

  document.getElementById(demoId + "-" + dataId + "-editgroup").style.display = "none";
  document.getElementById(demoId + "-" + dataId + "-confirmgroup").style.display = "inherit";

  /* identify right dataset */ 
  for (let i = 0; i < demos.length; i++) {
    if (demos[i]._id == demoId) {
      dbName = demos[i].database.dbName;
      collectionName = demos[i].database.collectionName;
      fields = demos[i].database.fields;
      for (let j = 0; j < demos[i].database.data.length; j++) {
        if (demos[i].database.data[j]._id == dataId) {
          data = demos[i].database.data[j];
          dataIdx = j;
          break;
        }
      }
      break;
    }
  }

  /* make all fields editable */
  for (let field in data) {
    /* skip id field of crm element */
    if (field == "_id") {
      continue;
    }
    document.getElementById(demoId + "-" + dataId + "-" + field).removeAttribute("disabled");
  }

  /* set global pointer to crm element which is currently edited */
  currentCRMElement = {
    demoId : demoId,
    dataId : dataId,
    dataIdx : dataIdx,
    dbName : dbName,
    collectionName : collectionName,
    data : data,
    fields : fields
  }

}


function cancelEditCRMElement() {

  let data = currentCRMElement.data, crmHTMLElement;

  document.getElementById(currentCRMElement.demoId + "-" + currentCRMElement.dataId + "-editgroup").style.display = "inherit";
  document.getElementById(currentCRMElement.demoId + "-" + currentCRMElement.dataId + "-confirmgroup").style.display = "none";

  /* revert all fields to disable status */
  for (let field in data) {
    if (field == "_id") {
      continue;
    }
    crmHTMLElement = document.getElementById(currentCRMElement.demoId + "-" + currentCRMElement.dataId + "-" + field);
    crmHTMLElement.setAttribute("disabled", "");
    
    /* make sure toggles are set properly */ 
    if (currentCRMElement.fields[field].type == "string") {
      crmHTMLElement.value = data[field];  
    } else if (currentCRMElement.fields[field].type == "boolean") {
      if (data[field]) {
        crmHTMLElement.setAttribute("checked", "")
      } else if (crmHTMLElement.hasAttribute("checked")) {
        crmHTMLElement.removeAttribute("checked");
      }
    }
  } 

  /* remove pointer to an active crm element which is edited */
  currentCRMElement = undefined;

}

function insertCMRElementForAllDemos(values) {
  let fields = tempCRMElement.database.fields, demoId, dataId = values._id;

  let htmlDivParentObject, htmlDivButtonObject, htmlChildObject, htmlRowObject, htmlDivObject, htmlButtonGroupObject;

  /* go through all demos and check whether they are pointing to same crm collection and insert document if that's the case */
  for (let i = 0; i < demos.length; i++) {
    /* if current demo has database property */
    if (demos[i].hasOwnProperty("database")) {
      /* ... and is using the same database and collection and has already loaded the data */
      if (demos[i].database.dbName == tempCRMElement.database.dbName && demos[i].database.collectionName == tempCRMElement.database.collectionName && demos[i].database.hasOwnProperty("data")) {

        demoId = demos[i]._id;

        /* add newly created values to data array */
        demos[i].database.data.push(values);

        /* insert HTML for current values */
        htmlDivParentObject = document.getElementById(demoId + "-crmdata");
        htmlDivButtonObject = document.getElementById(demoId + "-crmnewbuttoncontainer");


        htmlChildObject = document.createElement("mdc-divider");
        htmlChildObject.setAttribute("orientation", "horizontal");
        htmlChildObject.setAttribute("variant", "solid");
        htmlChildObject.setAttribute("id", demoId + "-" + dataId + "-crmdivider");
        htmlDivParentObject.insertBefore(htmlChildObject, htmlDivButtonObject);

        htmlRowObject = document.createElement("div");
        htmlRowObject.setAttribute("class", "crmrow");
        htmlRowObject.setAttribute("id", demoId + "-" + dataId + "-crmrow");
        htmlDivParentObject.insertBefore(htmlRowObject, htmlDivButtonObject);  

        htmlDivObject = document.createElement("div");
        //htmlDivObject.setAttribute("class", "crmelement");
        htmlRowObject.appendChild(htmlDivObject);
        
        for (let field in fields) {

          let currentField = fields[field];
          let currentValue = values[field];
          
          if (currentField.type == "string") {
            htmlChildObject = document.createElement("mdc-input");            
            htmlChildObject.setAttribute("value", currentValue);
            htmlChildObject.setAttribute("placeholder", currentField.label);
          } else if (currentField.type == "boolean") {
            htmlChildObject = document.createElement("mdc-toggle");
            if (currentValue) {
              htmlChildObject.setAttribute("checked", "");
            }
          }

          htmlChildObject.setAttribute("label", currentField.label);
          htmlChildObject.setAttribute("disabled", "");
          htmlChildObject.setAttribute("id", demoId + "-" + dataId + "-" + field);
          htmlChildObject.setAttribute("class", "crmelement");

          htmlDivObject.appendChild(htmlChildObject);

        }

        htmlDivObject = document.createElement("div");
        htmlDivObject.setAttribute("class", "crmbuttoncontainer");
        htmlRowObject.appendChild(htmlDivObject);

        htmlButtonGroupObject = document.createElement("mdc-buttongroup");
        htmlButtonGroupObject.setAttribute("id", demoId + "-" + dataId + "-editgroup");
        htmlButtonGroupObject.setAttribute("variant", "primary");
        htmlButtonGroupObject.setAttribute("orientation", "vertical");
        htmlButtonGroupObject.setAttribute("size", "40");

        htmlDivObject.appendChild(htmlButtonGroupObject);

        htmlChildObject = document.createElement("mdc-button");
        htmlChildObject.setAttribute("prefix-icon", "edit-bold");
        htmlChildObject.setAttribute("onClick", "editCRMElement('" + demoId + "','" + dataId + "')");
        htmlButtonGroupObject.appendChild(htmlChildObject);

        htmlChildObject = document.createElement("mdc-button");
        htmlChildObject.setAttribute("prefix-icon", "delete-bold");
        htmlChildObject.setAttribute("onClick", "confirmDeleteCRMElement('" + demoId + "','" + dataId + "')");
        htmlButtonGroupObject.appendChild(htmlChildObject);

        htmlButtonGroupObject = document.createElement("mdc-buttongroup");
        htmlButtonGroupObject.setAttribute("id", demoId + "-" + dataId + "-confirmgroup");
        htmlButtonGroupObject.setAttribute("variant", "primary");
        htmlButtonGroupObject.setAttribute("orientation", "vertical");
        htmlButtonGroupObject.setAttribute("size", "40");
        htmlButtonGroupObject.style.display = "none";

        htmlDivObject.appendChild(htmlButtonGroupObject);

        htmlChildObject = document.createElement("mdc-button");
        htmlChildObject.setAttribute("prefix-icon", "check-bold");
        htmlChildObject.setAttribute("onClick", "updateCRMElement()");
        htmlButtonGroupObject.appendChild(htmlChildObject);

        htmlChildObject = document.createElement("mdc-button");
        htmlChildObject.setAttribute("prefix-icon", "cancel-bold");
        htmlChildObject.setAttribute("onClick", "cancelEditCRMElement()");
        htmlButtonGroupObject.appendChild(htmlChildObject);

        htmlChildObject = document.createElement("mdc-spinner");
        htmlChildObject.setAttribute("id", demoId + "-" + dataId + "-spinner");
        htmlChildObject.setAttribute("variant", "standalone");
        htmlChildObject.setAttribute("size", "midsize");
        htmlChildObject.style.display = "none";

        htmlDivObject.appendChild(htmlChildObject);

      }

    }
  }

}

function createNewCRMElement(demoId) {

  let htmlRowObject, htmlDivObject, htmlDivButtonObject, htmlDivParentObject, htmlChildObject;

  /* remove any other active temporary crm elements and reset their dialog buttons */ 
  if (tempCRMElement !== undefined) {

    document.getElementById(tempCRMElement._id + "-add-crmelement-button").style.display = "inherit";
    document.getElementById(tempCRMElement._id + "-save-crmelement-button").style.display = "none";
    document.getElementById(tempCRMElement._id + "-cancel-crmelement-button").style.display = "none";

    /* remove current element from HTML struct */
    document.getElementById(tempCRMElement._id + "-tempcrmdivider").remove();
    document.getElementById(tempCRMElement._id + "-tempcrmrow").remove();

  }

  /* update visibility of buttons */
  document.getElementById(demoId + "-add-crmelement-button").style.display = "none";
  document.getElementById(demoId + "-save-crmelement-button").style.display = "inherit";
  document.getElementById(demoId + "-cancel-crmelement-button").style.display = "inherit";

  /* save proper demo element to global var */
  for (let i = 0; i < demos.length; i++) {
    if (demos[i]._id == demoId) {
      tempCRMElement = demos[i];
      continue;
    }
  }

  htmlDivButtonObject = document.getElementById(demoId + "-crmnewbuttoncontainer");
  htmlDivParentObject = document.getElementById(demoId + "-crmdata");

  htmlChildObject = document.createElement("mdc-divider");
  htmlChildObject.setAttribute("orientation", "horizontal");
  htmlChildObject.setAttribute("variant", "solid");
  htmlChildObject.setAttribute("id", demoId + "-tempcrmdivider");
  htmlDivParentObject.insertBefore(htmlChildObject, htmlDivButtonObject);

  htmlRowObject = document.createElement("div");
  htmlRowObject.setAttribute("class", "crmrow");
  htmlRowObject.setAttribute("id", demoId + "-tempcrmrow");
  htmlDivParentObject.insertBefore(htmlRowObject, htmlDivButtonObject);

  htmlDivObject = document.createElement("div");
  //htmlDivObject.setAttribute("class", "crmelement");
  htmlRowObject.appendChild(htmlDivObject);

  for (field in tempCRMElement.database.fields) {

    let currentField = tempCRMElement.database.fields[field];
      
      if (currentField.type == "string") {
        htmlChildObject = document.createElement("mdc-input");            
        htmlChildObject.setAttribute("placeholder", currentField.label);
      } else if (currentField.type == "boolean") {
        htmlChildObject = document.createElement("mdc-toggle");
      }

      htmlChildObject.setAttribute("label", currentField.label);
      htmlChildObject.setAttribute("id", demoId + "-" + field + "-tempcrmelement");
      htmlChildObject.setAttribute("class", "crmelement");

      htmlDivObject.appendChild(htmlChildObject);

  }

}

async function uploadNewCRMElement() {

  let fetchBody, values, crmHTMLElement;

  let saveButton = document.getElementById(tempCRMElement._id + "-save-crmelement-button");
  let cancelButton = document.getElementById(tempCRMElement._id + "-cancel-crmelement-button")
  let spinner = document.createElement("mdc-spinner");
  spinner.setAttribute("slot", "postfix");
  spinner.setAttribute("variant", "button");
  spinner.setAttribute("size", "small");

  fetchBody = {
    dbName : tempCRMElement.database.dbName,
    collectionName : tempCRMElement.database.collectionName,
  };

  values = {};

  /* save all fields to value array */
  for (let field in tempCRMElement.database.fields) {
    
    crmHTMLElement = document.getElementById(tempCRMElement._id + "-" + field + "-tempcrmelement");
    /* distinguish between string and boolean */
    if (tempCRMElement.database.fields[field].type == "boolean") {
      values[field] = crmHTMLElement.hasAttribute("checked");
    } else if (tempCRMElement.database.fields[field].type == "string") {
      values[field] = crmHTMLElement.value;
    }
  
  }

  fetchBody.values = values;

  saveButton.setAttribute("postfix-icon", "");
  saveButton.setAttribute("disabled", "");
  saveButton.appendChild(spinner);

  cancelButton.setAttribute("disabled", "");
  
  let response = await fetch("/db/create", {
    method: "POST",
    body: JSON.stringify(fetchBody),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  });

  let jsonResponse = await response.json();

  values._id = jsonResponse.insertedId;

  /* clean up all temporary elements */
  insertCMRElementForAllDemos(values);

  spinner.remove();
  saveButton.setAttribute("postfix-icon", "upload-regular");
  saveButton.removeAttribute("disabled");

  cancelButton.removeAttribute("disabled");

  cancelNewCRMElement();

}

function cancelNewCRMElement() {

  document.getElementById(tempCRMElement._id + "-add-crmelement-button").style.display = "inherit";
  document.getElementById(tempCRMElement._id + "-save-crmelement-button").style.display = "none";
  document.getElementById(tempCRMElement._id + "-cancel-crmelement-button").style.display = "none";
  
  /* remove current element from HTML struct */
  document.getElementById(tempCRMElement._id + "-tempcrmdivider").remove();
  document.getElementById(tempCRMElement._id + "-tempcrmrow").remove();

  tempCRMElement = undefined;

}



function renderCRMData(demoObject) {

  let demoId = demoObject._id;
  let fields = demoObject.database.fields;
  let data = demoObject.database.data;
  let dataId;

  let htmlDivParentObject = document.getElementById(demoObject._id + "-crmdata");
  let htmlChildObject, htmlRowObject, htmlDivObject, htmlButtonGroupObject;

  htmlChildObject = document.createElement("h3");
  htmlChildObject.innerHTML = "CRM Content";
  htmlDivParentObject.appendChild(htmlChildObject);

  // console.log(JSON.stringify(fields));

  for (let i = 0; i < data.length; i++) {

    dataId = data[i]._id;

    htmlChildObject = document.createElement("mdc-divider");
    htmlChildObject.setAttribute("orientation", "horizontal");
    htmlChildObject.setAttribute("variant", "solid");
    htmlChildObject.setAttribute("id", demoId + "-" + dataId + "-crmdivider");
    htmlDivParentObject.appendChild(htmlChildObject);

    htmlRowObject = document.createElement("div");
    htmlRowObject.setAttribute("class", "crmrow");
    htmlRowObject.setAttribute("id", demoId + "-" + dataId + "-crmrow");
    htmlDivParentObject.appendChild(htmlRowObject);  

    htmlDivObject = document.createElement("div");
    //htmlDivObject.setAttribute("class", "crmelement");
    htmlRowObject.appendChild(htmlDivObject);
    
    for (let field in data[i]) {
      if (field == "_id") {
        continue;
      }
      let currentField = fields[field];
      let currentValue = data[i][field];
      
      if (currentField.type == "string") {
        htmlChildObject = document.createElement("mdc-input");            
        htmlChildObject.setAttribute("value", currentValue);
        htmlChildObject.setAttribute("placeholder", currentField.label);
      } else if (currentField.type == "boolean") {
        htmlChildObject = document.createElement("mdc-toggle");
        if (currentValue) {
          htmlChildObject.setAttribute("checked", "");
        }
      }

      htmlChildObject.setAttribute("label", currentField.label);
      htmlChildObject.setAttribute("disabled", "");
      htmlChildObject.setAttribute("id", demoId + "-" + dataId + "-" + field);
      htmlChildObject.setAttribute("class", "crmelement");

      htmlDivObject.appendChild(htmlChildObject);

    }

    htmlDivObject = document.createElement("div");
    htmlDivObject.setAttribute("class", "crmbuttoncontainer");
    htmlRowObject.appendChild(htmlDivObject);

    htmlButtonGroupObject = document.createElement("mdc-buttongroup");
    htmlButtonGroupObject.setAttribute("id", demoId + "-" + dataId + "-editgroup");
    htmlButtonGroupObject.setAttribute("variant", "primary");
    htmlButtonGroupObject.setAttribute("orientation", "vertical");
    htmlButtonGroupObject.setAttribute("size", "40");

    htmlDivObject.appendChild(htmlButtonGroupObject);

    htmlChildObject = document.createElement("mdc-button");
    htmlChildObject.setAttribute("prefix-icon", "edit-bold");
    htmlChildObject.setAttribute("onClick", "editCRMElement('" + demoId + "','" + dataId + "')");
    htmlButtonGroupObject.appendChild(htmlChildObject);

    htmlChildObject = document.createElement("mdc-button");
    htmlChildObject.setAttribute("prefix-icon", "delete-bold");
    htmlChildObject.setAttribute("onClick", "confirmDeleteCRMElement('" + demoId + "','" + dataId + "')");
    htmlButtonGroupObject.appendChild(htmlChildObject);

    htmlButtonGroupObject = document.createElement("mdc-buttongroup");
    htmlButtonGroupObject.setAttribute("id", demoId + "-" + dataId + "-confirmgroup");
    htmlButtonGroupObject.setAttribute("variant", "primary");
    htmlButtonGroupObject.setAttribute("orientation", "vertical");
    htmlButtonGroupObject.setAttribute("size", "40");
    htmlButtonGroupObject.style.display = "none";

    htmlDivObject.appendChild(htmlButtonGroupObject);

    htmlChildObject = document.createElement("mdc-button");
    htmlChildObject.setAttribute("prefix-icon", "check-bold");
    htmlChildObject.setAttribute("onClick", "updateCRMElement()");
    htmlButtonGroupObject.appendChild(htmlChildObject);

    htmlChildObject = document.createElement("mdc-button");
    htmlChildObject.setAttribute("prefix-icon", "cancel-bold");
    htmlChildObject.setAttribute("onClick", "cancelEditCRMElement()");
    htmlButtonGroupObject.appendChild(htmlChildObject);

    htmlChildObject = document.createElement("mdc-spinner");
    htmlChildObject.setAttribute("id", demoId + "-" + dataId + "-spinner");
    htmlChildObject.setAttribute("variant", "standalone");
    htmlChildObject.setAttribute("size", "midsize");
    htmlChildObject.style.display = "none";

    htmlDivObject.appendChild(htmlChildObject);

    
  }

  htmlDivObject = document.createElement("div");
  htmlDivObject.setAttribute("class", "crmnewbuttoncontainer");
  htmlDivObject.setAttribute("id", demoId + "-crmnewbuttoncontainer");
  htmlDivParentObject.appendChild(htmlDivObject);

  htmlChildObject = document.createElement("mdc-button");
  htmlChildObject.setAttribute("postfix-icon", "plus-circle-bold");
  htmlChildObject.setAttribute("id", demoId + "-add-crmelement-button");
  htmlChildObject.setAttribute("onClick", "createNewCRMElement('" + demoId + "')");
  htmlChildObject.innerHTML = "Add Element";

  htmlDivObject.appendChild(htmlChildObject);

  htmlChildObject = document.createElement("mdc-button");
  htmlChildObject.setAttribute("postfix-icon", "cancel-regular");
  htmlChildObject.setAttribute("variant", "secondary");
  htmlChildObject.setAttribute("id", demoId + "-cancel-crmelement-button");
  htmlChildObject.setAttribute("onClick", "cancelNewCRMElement()");
  htmlChildObject.style.display = "none";
  htmlChildObject.innerHTML = "Cancel";

  htmlDivObject.appendChild(htmlChildObject);

  htmlChildObject = document.createElement("mdc-button");
  htmlChildObject.setAttribute("postfix-icon", "upload-regular");
  htmlChildObject.setAttribute("id", demoId + "-save-crmelement-button");
  htmlChildObject.setAttribute("onClick", "uploadNewCRMElement()");
  htmlChildObject.style.display = "none";
  htmlChildObject.innerHTML = "Save";

  htmlDivObject.appendChild(htmlChildObject);

}

async function loadCRM(demoId) {

  document.getElementById(demoId + '-accordion').removeAttribute('onClick');

  let dbName, collectionName, crmFields, crmData, demoIdx, spinner, spinnerContainer;

  for (let i = 0; i < demos.length; i++) {
    if (demos[i]._id == demoId) {
      /* do nothing if current demo doesn't have any associated database */
      if (!demos[i].hasOwnProperty('database')) {
        return;
      }
      dbName = demos[i].database.dbName;
      collectionName = demos[i].database.collectionName;
      crmFields = demos[i].database.fields;
      demoIdx = i;
      break;
    }
  }

  spinnerContainer = document.createElement("div");
  spinnerContainer.setAttribute("class","spinnercontainer");

  spinner = document.createElement("mdc-spinner");
  spinner.setAttribute("size", "large");
  spinner.setAttribute("variant", "standalone");

  spinnerContainer.appendChild(spinner);

  document.getElementById(demoId + "-crmdata").appendChild(spinnerContainer);

  fetchBody = {
    dbName : dbName,
    collectionName : collectionName,
    query : {}
  };

  let response = await fetch("/db/find", {
    method: "POST",
    body: JSON.stringify(fetchBody),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  });

  crmData = await response.json();

  demos[demoIdx].database.data = crmData;

  // console.log(demos[demoIdx]);
  spinnerContainer.remove();
  renderCRMData(demos[demoIdx]);

}


async function saveDemoParameters(demoId) {
  let demoParams = null;
  let saveButton = document.getElementById(demoId + "-save-params-button");
  let spinner = document.createElement("mdc-spinner");
  spinner.setAttribute("slot", "postfix");
  spinner.setAttribute("variant", "button");
  spinner.setAttribute("size", "small");

  /* search current demo struct */ 
  for (let i = 0; i < demos.length; i++) {
    if (demos[i]._id == demoId) {
      demoParams = demos[i].parameters;
      break;
    }
  }

  /* get all parameters from fields */
  for (let i = 0; i < demoParams.length; i++) {
    let inputField = document.getElementById(demoId + "-" + demoParams[i].name);
    if (demoParams[i].type == "string") {
      demoParams[i].value = inputField.value;
    } else if (demoParams[i].type == "boolean") {
      demoParams[i].value = inputField.hasAttribute("checked");
    }
  }

  // console.log(JSON.stringify(demoParams));

  fetchBody = {
    dbName : demoSettings.dbName,
    collectionName : "demos",
    query : {
      _id : demoId
    },
    updateValues : {
      parameters : demoParams
    }
  };

  /* update button */

  saveButton.setAttribute("postfix-icon", "");
  saveButton.setAttribute("disabled", "");
  saveButton.appendChild(spinner);

  let response = await fetch("/db/update", {
    method: "POST",
    body: JSON.stringify(fetchBody),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  });

  let jsonResponse = await response.json();

  /* update button */
  spinner.remove();
  saveButton.setAttribute("postfix-icon", "upload-regular");
  saveButton.removeAttribute("disabled");

  // console.log(jsonResponse);

}
