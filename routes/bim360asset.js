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
'use strict';   

const express = require('express');
const { bim360Cost }= require('../config');
const { OAuth } = require('./common/oauthImp');
const { apiClientCallAsync } = require('./common/apiclient');

const router = express.Router();


///////////////////////////////////////////////////////////////////////
/// Middleware for obtaining a token for each request.
///////////////////////////////////////////////////////////////////////
router.use(async (req, res, next) => {
    const oauth = new OAuth(req.session);
    req.oauth_token = await oauth.getInternalToken();
    next();   
});


// /////////////////////////////////////////////////////////////////////
// / Create assets to BIM360 
// /////////////////////////////////////////////////////////////////////
router.post('/da4revit/bim360/assets', async (req, res, next) => {
    const project_id = req.body.cost_container_id;
    const assetList  = req.body.data; // input Url of Excel file
    if ( assetList === '' ) {
        return (res.status(400).json({
            diagnostic: 'Missing input body info'
        }));
    }
    const importAssetsUrl =  bim360Cost.URL.CREATE_ASSERTS_URL.format(project_id);
    let assetsRes = null;

    await Promise.all(assetList.map( async (item,index)=>{
        try {
            await sleep(1000*index);
            assetsRes = await apiClientCallAsync('POST', importAssetsUrl, req.oauth_token.access_token, item);
            console.log(assetsRes);
        } catch (err) {
            console.error(err);
        }
    }) )
    return (res.status(200).json({resut:true}));
});



// /////////////////////////////////////////////////////////////////////
// / Get categories in BIM360 
// /////////////////////////////////////////////////////////////////////
router.get('/bim360/projects/:project_id/categories', async (req, res, next) => {

    const project_id = req.params.project_id;
    if ( project_id === '' ) {
        return (res.status(400).json({
            diagnostic: 'Missing input cost container id'
        }));
    }
    const categoriesUrl =  bim360Cost.URL.CATEGORIES_URL.format(project_id);
    let categoriesRes = null;
    try {
        categoriesRes = await apiClientCallAsync( 'GET',  categoriesUrl, req.oauth_token.access_token);
    } catch (err) {
        console.error(err);
        return (res.status(500).json({
			diagnostic: 'Failed to get asset categories info from BIM 360'
        }));
    }
    return (res.status(200).json(categoriesRes.body.results));
});


// /////////////////////////////////////////////////////////////////////
// / Get status sets in BIM360 
// /////////////////////////////////////////////////////////////////////
router.get('/bim360/projects/:project_id/status-sets', async (req, res, next) => {

    const project_id = req.params.project_id;
    if ( project_id === '' ) {
        return (res.status(400).json({
            diagnostic: 'Missing input cost container id'
        }));
    }
    const categoriesUrl =  bim360Cost.URL.STATUS_SETS_URL.format(project_id);
    let categoriesRes = null;
    try {
        categoriesRes = await apiClientCallAsync( 'GET',  categoriesUrl, req.oauth_token.access_token);
    } catch (err) {
        console.error(err);
        return (res.status(500).json({
			diagnostic: 'Failed to get asset status sets info from BIM 360'
        }));
    }
    return (res.status(200).json(categoriesRes.body.results));
});

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = router;
