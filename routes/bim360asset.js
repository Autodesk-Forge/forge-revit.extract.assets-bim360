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
const { bim360Assets }= require('../config');
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
    const project_id = req.body.project_id;
    const assetList  = req.body.data; // input Url of Excel file
    if ( assetList === '' ) {
        return (res.status(400).json({
            diagnostic: 'Missing input body info'
        }));
    }
    const importAssetsUrl =  bim360Assets.URL.CREATE_ASSERTS_URL.format(project_id);
    let assetsRes = null;

    // batch create has maximun of 100 assets
    while(assetList.length > 0)
    {
        let currentAsset = assetList.splice(0, 100);
        try {
            assetsRes = await apiClientCallAsync('POST', importAssetsUrl, req.oauth_token.access_token, currentAsset);
            console.log(assetsRes);
        } catch (err) {
            console.error(err);
            return (res.status(500).json({
                diagnostic: 'Failed to import assets to BIM 360'
            }));       
        }
    }
    return (res.status(200).json({resut:true}));
});



// /////////////////////////////////////////////////////////////////////
// / Get categories in BIM360 
// /////////////////////////////////////////////////////////////////////
router.get('/bim360/projects/:project_id/categories', async (req, res, next) => {

    const project_id = req.params.project_id;
    if ( project_id === '' ) {
        return (res.status(400).json({
            diagnostic: 'Missing input project id'
        }));
    }
    const categoriesUrl =  bim360Assets.URL.CATEGORIES_URL.format(project_id);
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
// / Create new category in BIM360 
// /////////////////////////////////////////////////////////////////////
router.post('/bim360/projects/:project_id/categories', async (req, res, next) => {

    const project_id = req.params.project_id;
    if ( project_id === '' ) {
        return (res.status(400).json({
            diagnostic: 'Missing input project id'
        }));
    }
    const category  = req.body;
    if ( category === null ) {
        return (res.status(400).json({
            diagnostic: 'Missing input category body info'
        }));
    }

    const categoriesUrl =  bim360Assets.URL.CATEGORIES_URL.format(project_id);
    let categoriesRes = null;
    try {
        categoriesRes = await apiClientCallAsync( 'POST',  categoriesUrl, req.oauth_token.access_token, category );
    } catch (err) {
        console.error(err);
        return (res.status(500).json({
			diagnostic: 'Failed to create asset categories info within BIM 360'
        }));
    }
    return (res.status(200).json(categoriesRes.body));
});


// /////////////////////////////////////////////////////////////////////
// / Get status sets in BIM360 
// /////////////////////////////////////////////////////////////////////
router.get('/bim360/projects/:project_id/status-sets', async (req, res, next) => {

    const project_id = req.params.project_id;
    if ( project_id === '' ) {
        return (res.status(400).json({
            diagnostic: 'Missing input project id'
        }));
    }
    const statusSetsUrl =  bim360Assets.URL.STATUS_SETS_URL.format(project_id);
    let statusSetsRes = null;
    try {
        statusSetsRes = await apiClientCallAsync( 'GET',  statusSetsUrl, req.oauth_token.access_token);
    } catch (err) {
        console.error(err);
        return (res.status(500).json({
			diagnostic: 'Failed to get asset status sets info from BIM 360'
        }));
    }
    return (res.status(200).json(statusSetsRes.body.results));
});


// /////////////////////////////////////////////////////////////////////
// / Create new status set in BIM360 
// /////////////////////////////////////////////////////////////////////
router.post('/bim360/projects/:project_id/status-sets', async (req, res, next) => {

    const project_id = req.params.project_id;
    if ( project_id === '' ) {
        return (res.status(400).json({
            diagnostic: 'Missing input project id'
        }));
    }

    const statusBody  = req.body;
    if ( statusBody === null ) {
        return (res.status(400).json({
            diagnostic: 'Missing input status body info'
        }));
    }
    

    const statusSetsUrl =  bim360Assets.URL.STATUS_SETS_URL.format(project_id);
    let statusSetsRes = null;
    try {
        statusSetsRes = await apiClientCallAsync( 'POST',  statusSetsUrl, req.oauth_token.access_token, statusBody);
    } catch (err) {
        console.error(err);
        return (res.status(500).json({
			diagnostic: 'Failed to get asset status sets info from BIM 360'
        }));
    }
    return (res.status(200).json(statusSetsRes.body));
});


module.exports = router;
