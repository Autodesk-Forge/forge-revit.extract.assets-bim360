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

$(document).ready(function () {
    prepareLists();

    $('#clearAccount').click(async () => {
        const zipFileName = $('#localBundles').val();
        const fileName = zipFileName.split('.')[0];
        const activityName = fileName + 'Activity';
        const appBundleName = fileName + 'AppBundle';

        if (!confirm('Are you sure you want to delete the AppBundle & Activity for this zip Package?'))
            return;

        updateConfigStatus('deleting_appbundle', appBundleName)
        let result = null;
        result = await deleteAppBundle(appBundleName);
        if (!result) {
            console.error('deleting appbundle failed.')
            updateConfigStatus('deleting_failed', "Failed to delete appbundle {0}".format(appBundleName));
            return;
        }

        updateConfigStatus('deleting_activity', activityName)
        result = await deleteActivity(activityName);
        if (!result) {
            console.error('deleting activity failed.')
            updateConfigStatus('deleting_failed', "Failed to delete activity {0}".format(activityName));
            return;
        }
        updateConfigStatus('deleting_completed', "{0} & {1}".format(appBundleName, activityName));
    });
    $('#defineActivityShow').click(defineActivityModal);
    $('#createAppBundleActivity').click(createAppBundleActivity);
    $('#resetPriceBook').click(resetPriceBook);

});

if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

function prepareLists() {
    list('engines', '/api/forge/designautomation/engines');
    list('localBundles', '/api/forge/appbundles');
}


function list(control, endpoint) {
    $('#' + control).find('option').remove().end();
    jQuery.ajax({
        url: endpoint,
        dataType: 'json', // The data type will be received
        success: function (list) {
            if (list.length === 0)
                $('#' + control).append($('<option>', { disabled: true, text: 'Nothing found' }));
            else
                list.forEach(function (item) { $('#' + control).append($('<option>', { value: item, text: item })); })
        }
    });
}

// reset price book database
async function resetPriceBook() {
    $('.resetingPriceBook').show();
    $('#resetPriceBook').hide();

    const budgetCodeLength = parseInt($('#budgetCodeLength').val());
    const pbResult = await initPriceBook(budgetCodeLength);
    if( pbResult == null ) {
        console.error(err);
        alert('Failed to reset price book database');
    }
    alert('Price book database is sucessfully reset.');
    $('.resetingPriceBook').hide();
    $('#resetPriceBook').show();
}

// delete appbundle
async function deleteAppBundle( appBundleName ) {
    const requestUrl = '/api/forge/designautomation/appbundles/' + encodeURIComponent(appBundleName);
    try {
        await apiClientAsync(requestUrl, null, 'delete');
    } catch (err) {
        console.error(err);
        return false;
    }
    return true;
}

// delete activity
async function deleteActivity( activityName) {
    const requestUrl = '/api/forge/designautomation/activities/' + encodeURIComponent(activityName);
    try {
        await apiClientAsync(requestUrl, null, 'delete');
    } catch (err) {
        console.error(err);
        return false;
    }
    return true;
}

function defineActivityModal() {
    $("#defineActivityModal").modal();
}

// event handler for button 'createAppBundleActivity'
async function createAppBundleActivity() {
    const zipFileName = $('#localBundles').val();
    const fileName = zipFileName.split('.')[0];

    updateConfigStatus('creating_appbundle', fileName + "AppBundle")
    const appBundle = await createAppBundle(fileName);
    if (appBundle == null) {
        updateConfigStatus('creating_failed', "Failed to create AppBundle {0}".format(fileName))
        console.error('Failed to create AppBundle.');
        return;
    }

    updateConfigStatus('creating_activity', fileName + "Activity")
    const activity = await createActivity(fileName);
    if (activity == null) {
        updateConfigStatus('creating_failed', "{0}AppBundle & {1}Activity".format(fileName, fileName))
        console.error('Failed to create AppBundle and Activity.');
        return;
    }

    updateConfigStatus('creating_completed', "{0}AppBundle & {1}Activity".format(fileName, fileName))
}


// init the price book database
async function initPriceBook( budgetCodeLength ){
    const requestUrl = 'api/forge/pricebook/database';
    const requestBody = {
        budgetCodeLength: budgetCodeLength
    };
    try {
        return await apiClientAsync(requestUrl, requestBody, 'post');
    } catch (err) {
        console.error(err);
        return null;
    }
}

// create appbundle
async function createAppBundle(fileName) {
    const requestUrl = 'api/forge/designautomation/appbundles';
    const requestBody = {
        fileName: fileName,
        engine: $('#engines').val()
    };

    try {
        return await apiClientAsync(requestUrl, requestBody, 'post');
    } catch (err) {
        console.error(err);
        return null;
    }
}

// create activity
async function createActivity(fileName) {
    const requestUrl = 'api/forge/designautomation/activities';
    const requestBody = {
        fileName: fileName,
        engine: $('#engines').val()
    };
    try {
        return await apiClientAsync(requestUrl, requestBody, 'post');
    } catch (err) {
        console.error(err);
        return null;
    }
}

// udpate status bar
function updateConfigStatus(status, info = '') {
    let statusText = document.getElementById('configText');
    let upgradeBtnElm = document.getElementById('createAppBundleActivity');
    let cancelBtnElm = document.getElementById('clearAccount');
    switch (status) {
        case "creating_appbundle":
            setProgress(20, 'configProgressBar');
            statusText.innerHTML = "<h4>Step 1/2: Creating AppBundle: " +info+ "</h4>"
            upgradeBtnElm.disabled = true;
            cancelBtnElm.disabled = true;
            break;
        case "creating_activity":
            setProgress(60, 'configProgressBar');
            statusText.innerHTML = "<h4>Step 2/2: Creating Activity: " +info+ "</h4>"
            upgradeBtnElm.disabled = true;
            cancelBtnElm.disabled  = true;
            break;
        case "creating_completed":
            setProgress(100, 'configProgressBar');
            statusText.innerHTML = "<h4>Created:\n" + info +  "</h4>"
            upgradeBtnElm.disabled = false;
            cancelBtnElm.disabled = false;
            break;

        case "creating_failed":
            setProgress(0, 'configProgressBar');
            statusText.innerHTML = "<h4>Failed to create:\n"+ info +"</h4>"
            upgradeBtnElm.disabled = false;
            cancelBtnElm.disabled = false;
            break;

        case "deleting_appbundle":
            setProgress(20, 'configProgressBar');
            statusText.innerHTML = "<h4>Step 1/2: Deleting AppBundle: " +info+ "</h4>"
            upgradeBtnElm.disabled = true;
            cancelBtnElm.disabled = true;
            break;
        case "deleting_activity":
            setProgress(60, 'configProgressBar');
            statusText.innerHTML = "<h4>Step 2/2: Deleting Activity: " +info+ "</h4>"
            upgradeBtnElm.disabled = true;
            cancelBtnElm.disabled = true;
            break;
        case "deleting_completed":
            setProgress(100, 'configProgressBar');
            statusText.innerHTML = "<h4>Deleted:\n" + info + "</h4>"
            upgradeBtnElm.disabled = false;
            cancelBtnElm.disabled = false;
            break;
        case "deleting_failed":
            setProgress(0, 'configProgressBar');
            statusText.innerHTML = "<h4>Failed to delete:\n" + info + "</h4>"
            upgradeBtnElm.disabled = false;
            cancelBtnElm.disabled = false;
            break;
    }
}


// set progress
function setProgress(percent, progressbarId ) {
    let progressBar = document.getElementById(progressbarId);
    progressBar.style = "width: " + percent + "%;";
    if (percent === 100) {
        progressBar.parentElement.className = "progress progress-striped"
    } else {
        progressBar.parentElement.className = "progress progress-striped active"
    }
}
