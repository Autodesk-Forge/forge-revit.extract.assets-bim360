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


var assetMgrInstance = null;


///////////////////////////////////////////////////////////////////////
/// Class to handle assetMgrInstance table
///////////////////////////////////////////////////////////////////////
class AssetTable {

  static Asset_Table_Columns = [
    { title: "Assert ID" },
    { title: "Category" },
    { title: "Status" },
    { title: "Description" },
    // { title: "Barcode" }
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
      this.table.data().toArray().forEach((assetItem) => {
        const item = {
          clientAssetId: assetItem[0],
          categoryId: assetItem[1],
          statusId: assetItem[2],
          description: assetItem[3],
          barcode: assetItem[4]
        }
        assetList.push(item);
      })
    }
    return assetList;
  }
}

///////////////////////////////////////////////////////////////////////
/// Class to manage the operation to asset
///////////////////////////////////////////////////////////////////////
class AssetManager {
  static SOCKET_TOPIC_WORKITEM = 'Workitem-Notification';

  constructor() {
    this.currentModelNode = null;
    this.projectId = null;

    this.assetInfo = null;
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
      this.socketio.on(AssetManager.SOCKET_TOPIC_WORKITEM, this.handleSocketEvent.bind(this));
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
        table_dataSet.push( [assert.Id, assert.CategoryId, assert.StatusId, assert.Description, assert.Barcode]);
      })

      this.assetTable.refreshTable(table_dataSet);
      this.currentModelNode = null;
    }

    if (this.drawTableCallback)
      this.drawTableCallback();
  }


  // initialize the information of current project, including selected node and and project
  async initAssetMgr(modelNode, projectId) {
    if (modelNode && projectId) {
      this.currentModelNode = modelNode;
      this.projectId = projectId;
    }
  }


  // extract asset inforamtion based on the current revit project
  async extractAssetsInfo(drawTableCallback) {
    this.drawTableCallback = drawTableCallback;
    const inputJson = {
      DuctTerminal: true
    };
    try {
      const requestUrl = '/api/forge/da4revit/revit/' + encodeURIComponent(this.currentModelNode.storage) + '/assets';
      this.assetInfo = await apiClientAsync(requestUrl, inputJson);
      this.workingItem = this.assetInfo.workItemId;
      return true;
    } catch (err) {
      this.assetInfo = null;
      this.workingItem = null;
      return false;
    }
  }

  // update the current assets information to BIM 360 Asset Management module
  async updateToBIM360() {
    if (!this.assetTable)
      return false;

    // find categores
    let categories = null;
    try{
      const requestUrl = '/api/forge/bim360/projects/' + encodeURIComponent(this.projectId) + '/categories';
      categories = await apiClientAsync(requestUrl);
    }catch(ex){
      console.error('Exception to get categories');   
      return false; 
    }

    // find status set
    let statusSets = null;
    try{
      const requestUrl = '/api/forge/bim360/projects/' + encodeURIComponent(this.projectId) + '/status-sets';
      statusSets = await apiClientAsync(requestUrl);
    }catch(ex){
      console.error('Exception to get status sets');    
      return false;
    }

    if( categories == null || statusSets == null ){
      console.error('Failed to get assets categories or status sets');    
      return false;
    }

    const assetList = this.assetTable.getAssetList();
    // replace statusId and categoryId in assetList with correct one
    for(let index = 0; index < assetList.length; index++ ){
      let asset = assetList[index];
      for (let key in asset) {
        if (key === 'categoryId') {
          let category = categories.find(item => {
            return (item["name"] === asset[key]);
          })
          if (category != null) {
            asset[key] = category["id"];
          } 
          else { // create a category if not existing
            try {
              const requestUrl = '/api/forge/bim360/projects/' + encodeURIComponent(this.projectId) + '/categories';
              const requestBody = {
                parentId: categories[0].id,
                name: asset[key]
              };
              const newCategory = await apiClientAsync(requestUrl, requestBody, "post");
              asset[key] = newCategory["id"];
              categories.push(newCategory);
            }
            catch (err) {
              console.error('Failed to find and create category.');
              return false;
            }
          }
        }
        if (key === 'statusId') {
          let status = statusSets.find(item => {
            return (item["label"] === asset[key]);
          })
          if (status != null) {
            asset[key] = status["id"];
          } 
          else { // get the 1st status if not existing
            asset[key] = statusSets[0]['id'];
          }
        }
      } 
    }

    try {
      const requestUrl = '/api/forge/da4revit/bim360/assets';
      const requestBody = {
        project_id: this.projectId,
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
 
  assetMgrInstance = new AssetManager();
  assetMgrInstance.connectToServer();
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
    const projectId   = $('#labelProjectId').text();
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
    $('#extractAssetsInfo')[0].disabled = true;
    $('#updateToBIM360Btn')[0].disabled = true;


    await assetMgrInstance.initAssetMgr( sourceNode.original, projectId );
    let result = await assetMgrInstance.extractAssetsInfo( ()=>{
      $('.clsInProgress').hide();
      $('.clsResult').show();
      $('#extractAssetsInfo')[0].disabled = false;
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

  if ( assetMgrInstance ==null ) {
    alert('asset table is not initialized.');
    return;
  }
  const result = await assetMgrInstance.updateToBIM360();
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
