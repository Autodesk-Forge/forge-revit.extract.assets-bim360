/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////


var budgetMgrInstance = null;


///////////////////////////////////////////////////////////////////////
/// Class to handle budget table
///////////////////////////////////////////////////////////////////////
class AssetTable {

  static Asset_Table_Columns = [
    { title: "Assert ID" },
    { title: "Category" },
    { title: "Status" },
    { title: "Manufacturer" },
    { title: "Model" }
  ];

  constructor(tableId, dataSet = []) {
    this.tableId = tableId;
    this.table = $(tableId).DataTable({
      pageLength: 10,
      data: dataSet,
      columns: AssetTable.Asset_Table_Columns
    });
  }

  refreshTable(dataSet = null) {
    if (this.table === null) {
      console.error('The table is not initialized, please re-check');
      return;
    }
    const newData = dataSet ? dataSet : this.table.data();
    this.table.clear().rows.add(newData).draw();
  }


  getAssetList() {
    var assetList = [];
    if (this.table !== null) {
      this.table.data().toArray().forEach((budgetItem) => {
        const item = {
          clientAssetId: budgetItem[0],
          categoryId: budgetItem[1],
          statusId: budgetItem[2],
          manufacturer: budgetItem[3],
          model: budgetItem[4]
        }
        assetList.push(item);
      })
    }
    return assetList;
  }
}

///////////////////////////////////////////////////////////////////////
/// Class to manage the operation to budget
///////////////////////////////////////////////////////////////////////
class BudgetManager {
  static SOCKET_TOPIC_WORKITEM = 'Workitem-Notification';

  constructor() {
    this.currentModelNode = null;
    this.projectId = null;

    this.quantityInfo = null;
    this.workingItem = null;

    this.drawTableCallback = null;

    this.assetTable = new AssetTable('#assetInfoTable');

    this.socketio = io();
  }

  get AssetTable() {
    return this.assetTable;
  }

  // start listen to the server
  connectToServer() {
    if (this.socketio) {
      this.socketio.on(BudgetManager.SOCKET_TOPIC_WORKITEM, this.handleSocketEvent.bind(this));
    }
  }

  // handle the events sent from server
  async handleSocketEvent(data) {
    if (this.workingItem === null || data.WorkitemId !== this.workingItem)
      return;

    const status = data.Status.toLowerCase();
    // enable the create button and refresh the hubs when completed/failed/cancelled
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      this.workingItem = null;
    }
    if (status === 'completed' && this.currentModelNode != null) {
      console.log('Work item is completed');

      let table_dataSet = [];
      const elementInfo = data.ExtraInfo;

      elementInfo.AssetList.forEach( assert => {
        table_dataSet.push( [assert.Id, assert.CategoryId, assert.StatusId, assert.Manufacturer, assert.Model]);
      })

      this.assetTable.refreshTable(table_dataSet);
      this.currentModelNode = null;
    }

    if (this.drawTableCallback)
      this.drawTableCallback();
  }


  // initialize the information of current project, including selected node and and project
  async initBudgetMgr(modelNode, projectId) {
    if (modelNode && projectId) {
      this.currentModelNode = modelNode;
      this.projectId = projectId;
    }
  }


  // extract quantity inforamtion based on the current revit project
  async extractAssetsInfo(drawTableCallback) {
    this.drawTableCallback = drawTableCallback;
    const inputJson = {
      walls: true,
      floors: true,
      doors: true,
      windows: true
    };
    try {
      const requestUrl = '/api/forge/da4revit/revit/' + encodeURIComponent(this.currentModelNode.storage) + '/assets';
      this.quantityInfo = await apiClientAsync(requestUrl, inputJson);
      this.workingItem = this.quantityInfo.workItemId;
      return true;
    } catch (err) {
      this.quantityInfo = null;
      this.workingItem = null;
      return false;
    }
  }

  // update the current budgets information to BIM 360 Cost Management module
  async updateToBIM360() {
    if (!this.assetTable)
      return false;

    // get categores
    let categories = null;
    try{
      const requestUrl = '/api/forge/bim360/projects/' + encodeURIComponent(this.projectId) + '/categories';
      categories = await apiClientAsync(requestUrl);
    }catch(ex){
      console.error('Failed to get categories');    
    }

    // get status set
    let statusSets = null;
    try{
      const requestUrl = '/api/forge/bim360/projects/' + encodeURIComponent(this.projectId) + '/status-sets';
      statusSets = await apiClientAsync(requestUrl);
    }catch(ex){
      console.error('Failed to get status sets');    
    }

    const assetList = this.assetTable.getAssetList();
    // handle assetList.
    assetList.forEach(asset => {
      for (let key in asset) {
        if (key === 'categoryId') {
          let category = categories.find(item => {
            return (item["name"] === asset[key]);
          })
          if (category != null) {
            asset[key] = category["id"];
          }
        }
        if (key === 'statusId') {
          asset[key] = statusSets[0]['id'];
        }
      }
    })

    try {
      const requestUrl = '/api/forge/da4revit/bim360/assets';
      const requestBody = {
        cost_container_id: this.projectId,
        data: assetList
      };
      const result = await apiClientAsync(requestUrl, requestBody, 'post');
      return true;
    } catch (err) {
      console.error('Failed to create assets');
      return false;
    }
  }
}

///////////////////////////////////////////////////////////////////////
/// Document ready event
///////////////////////////////////////////////////////////////////////
$(document).ready(function () {
  $('#extractAssetsInfo').click(extractAssetInfoHandler);
  $('#updateToBIM360Btn').click(updateToBIM360Handler);
 
  budgetMgrInstance = new BudgetManager();
  budgetMgrInstance.connectToServer();
});

///////////////////////////////////////////////////////////////////////
/// Event to start extracting the Assets informaiton from model
///////////////////////////////////////////////////////////////////////
async function extractAssetInfoHandler() {
    const instanceTree = $('#sourceHubs').jstree(true);
    if( instanceTree == null ){
        alert('Can not get the user hub');
        return;
    }
    const sourceNode = instanceTree.get_selected(true)[0];
    if (sourceNode == null || sourceNode.type !== 'versions' ) {
        alert('Can not get the selected file, please make sure you select a version as input');
        return;
    }
    const fileName = instanceTree.get_text(sourceNode.parent);
    const fileNameParams = fileName.split('.');
    if( fileNameParams[fileNameParams.length-1].toLowerCase() !== "rvt"){
        alert('please select Revit project and try again');
        return;
    }
    const projectHref = $('#labelProjectHref').text();
    const projectId = $('#labelCostContainer').text();
    if (projectHref === '' || projectId === '') {
      alert('please select one Revit project!');
      return;
    }
    if( sourceNode.original.storage == null){
        alert('Can not get the storage of the version');
        return;
    }

    // Start to work.
    $('.clsInProgress').show();
    $('.clsResult').hide();
    $('#updateToBIM360Btn')[0].disabled = true;


    await budgetMgrInstance.initBudgetMgr( sourceNode.original, projectId );
    let result = await budgetMgrInstance.extractAssetsInfo( ()=>{
      $('.clsInProgress').hide();
      $('.clsResult').show();
      $('#updateToBIM360Btn')[0].disabled = false;
    });
    if(!result){
      console.error('Failed to handle the parameters');
      $('.clsInProgress').hide();
      $('.clsResult').show();
    }
  return;
}

///////////////////////////////////////////////////////////////////////
/// Event to update the assets info to BIM360 Asset module
///////////////////////////////////////////////////////////////////////
async function updateToBIM360Handler() {
  $('.clsUpdatingBIM360').show();
  $('#updateToBIM360Btn')[0].disabled = true;

  if ( budgetMgrInstance ==null ) {
    alert('budget table is not initialized.');
    return;
  }
  const result = await budgetMgrInstance.updateToBIM360();
  if( result ){
    alert('Assets are imported to BIM360 Asset Module.')
  }else{
    alert('Failed to imported Assets to BIM360 Asset Module.')
  }

  $('.clsUpdatingBIM360').hide();
  $('#updateToBIM360Btn')[0].disabled = false;

  return;
}


// helper function for Request
function apiClientAsync( requestUrl, requestData=null, requestMethod='get' ) {
  let def = $.Deferred();

  if( requestMethod == 'post' ){
    requestData = JSON.stringify(requestData);
  }

  jQuery.ajax({
    url: requestUrl,
    contentType: 'application/json',
    type: requestMethod,
    dataType: 'json',
    data: requestData,
    success: function (res) {
      def.resolve(res);
    },
    error: function (err) {
      console.error('request failed:');
      def.reject(err)
    }
  });
  return def.promise();
}
