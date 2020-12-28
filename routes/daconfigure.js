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
const _fs = require('fs');
const _path = require('path');

const { OAuth } = require('./common/oauthImp');
const{ Utils }  = require ('./common/da4rimp')

const router = express.Router();


///////////////////////////////////////////////////////////////////////
/// Middleware for obtaining a token for each request.
///////////////////////////////////////////////////////////////////////
router.use(async (req, res, next) => {
    const oauth = new OAuth(req.session);
    req.oauth_client = oauth.get2LeggedClient();
    req.oauth_token = await req.oauth_client.authenticate();     
    next();   
});


///////////////////////////////////////////////////////////////////////
/// Query the list of the engines
///////////////////////////////////////////////////////////////////////
router.get('/designautomation/engines', async(req, res, next) => {
    const api = Utils.dav3API(req.oauth_token);
    let engines = null;
    try {
        engines = await api.getEngines();
    } catch (ex) {
        console.error(ex);
        return res.status(500).json({
            diagnostic: 'Failed to get engine list'
        });
    }
    const engineList = engines.data.filter((engine) => {
        return (engine.indexOf('Revit') >= 0)
    })
    return (res.status(200).json(engineList.sort())); // return list of engines
})


///////////////////////////////////////////////////////////////////////
/// Query the list of the activities
///////////////////////////////////////////////////////////////////////
router.get('/designautomation/activities', async(req, res, next) => {
	const api = Utils.dav3API(req.oauth_token);
	// filter list of 
	let activities = null;
	try {
		activities = await api.getActivities();
	} catch (ex) {
		console.error(ex);
		return (res.status(500).json({
			diagnostic: 'Failed to get activity list'
		}));
	}
	let definedActivities = [];
	for (let i = 0; i < activities.data.length; i++) {
		let activity = activities.data[i];
		if (activity.startsWith(Utils.NickName) && activity.indexOf('$LATEST') === -1)
			definedActivities.push(activity.replace(Utils.NickName + '.', ''));
	}
	return(res.status(200).json(definedActivities));
})


///////////////////////////////////////////////////////////////////////
/// Query the list of the appbundle packages
///////////////////////////////////////////////////////////////////////
router.get('/appbundles', async (req, res, next) => {
    try {
        const fileArray = _fs.readdirSync(Utils.LocalBundlesFolder);
        const zipFile = fileArray.filter(fileName => {
            return (fileName.indexOf('.zip') >= 0)
        })
        res.status(200).json(zipFile);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            diagnostic: 'Failed to find appbundle list'
        });
    }
})

///////////////////////////////////////////////////////////////////////
/// Create|Update Appbundle version
///////////////////////////////////////////////////////////////////////
router.post('/designautomation/appbundles', async( req, res, next) => {
    const fileName = req.body.fileName;
    const engineName  = req.body.engine;

    const zipFileName = fileName + '.zip';
    const appBundleName = fileName + 'AppBundle';

    // check if ZIP with bundle is existing
	const localAppPath = _path.join(Utils.LocalBundlesFolder, zipFileName);
    if (!_fs.existsSync(localAppPath)) {
        console.error(`${localAppPath} is not existing`);
        return (res.status(400).json({ 
            diagnostic: `${localAppPath} is not existing`
        }));
    }

    const api = Utils.dav3API(req.oauth_token);
	let appBundles = null;
	try {
		appBundles = await api.getAppBundles();
	} catch (ex) {
		console.error(ex);
		return (res.status(500).json({
			diagnostic: 'Failed to get the Bundle list'
		}));
    }
    
	const qualifiedAppBundleId = `${Utils.NickName}.${appBundleName}+${Utils.Alias}`;
    var newAppVersion = null;
    if( appBundles.data.includes( qualifiedAppBundleId ) ){
 		// create new version
         const appBundleSpec = {
				engine: engineName,
				description: appBundleName
			};
		try {
			newAppVersion = await api.createAppBundleVersion(appBundleName, appBundleSpec);
		} catch (ex) {
			console.error(ex);
			return (res.status(500).json({
				diagnostic: 'Cannot create new version'
			}));
		}

		// update alias pointing to v+1
		const aliasSpec = {
				version: newAppVersion.Version
			};
		try {
			const newAlias = await api.modifyAppBundleAlias(appBundleName, Utils.Alias, aliasSpec);
		} catch (ex) {
			console.error(ex);
			return (res.status(500).json({
				diagnostic: 'Failed to create an alias'
			}));
		}   
    } else {
        const appBundleSpec = {
            package: appBundleName,
            engine: engineName,
            id: appBundleName,
            description: `Export Asset information from Revit`
        };
        try {
            newAppVersion = await api.createAppBundle(appBundleSpec);
        } catch (ex) {
            console.error(ex);
            return (res.status(500).json({
                diagnostic: 'Failed to create new app'
            }));
        }

        // create alias pointing to v1
        const aliasSpec = {
            id: Utils.Alias,
            version: 1
        };
        try {
            const newAlias = await api.createAppBundleAlias(appBundleName, aliasSpec);
        } catch (ex) {
            console.error(ex);
            return (res.status(500).json({
                diagnostic: 'Failed to create an alias'
            }));
        }
    }
    const contents = _fs.readFileSync(localAppPath);
    try{
        await Utils.uploadAppBundleAsync(newAppVersion.uploadParameters, contents);
    }catch(err){
        console.error(err);
        return (res.status(500).json({
            diagnostic: "Failed to upload the package to the url."
        }));
    }
    const result = {
        AppBundle : qualifiedAppBundleId,
        Version   : newAppVersion.version
    }
    return (res.status(200).json( result ));    
})


///////////////////////////////////////////////////////////////////////
/// Create activity
///////////////////////////////////////////////////////////////////////
router.post('/designautomation/activities', async( req, res, next) => {
    const fileName = req.body.fileName;
    const engineName  = req.body.engine;

    const appBundleName = fileName + 'AppBundle';
    const activityName = fileName + 'Activity';

    const api = Utils.dav3API(req.oauth_token);
    let activities = null;
    try{
        activities = await api.getActivities();
    }catch(ex){
        console.error(ex);
        return res.status(500).json({
			diagnostic: 'Failed to get activity list'
        });
    }
    const qualifiedAppBundleId = `${Utils.NickName}.${appBundleName}+${Utils.Alias}`;
	const qualifiedActivityId = `${Utils.NickName}.${activityName}+${Utils.Alias}`;
    if( !activities.data.includes( qualifiedActivityId ) ){
        const activitySpec = {
            Id : activityName,
            Appbundles : [ qualifiedAppBundleId ],
            CommandLine : [ "$(engine.path)\\\\revitcoreconsole.exe /i \"$(args[inputFile].path)\" /al \"$(appbundles[" + appBundleName + "].path)\"" ],
            Engine : engineName,
            Parameters :
            {
                inputFile: {
                    verb: "get",
                    description: "input revit file",
                    required: true
                },
                inputJson: {
                    verb: "get",
                    description: "input Json parameters",
                    localName: "params.json"
                },
                outputJson: {
                    verb: "put",
                    description: "output asset file",
                    localName: "result.json"
                }
            }
        }
		try {
			const newActivity = await api.createActivity(activitySpec);
		} catch (ex) {
			console.error(ex);
			return (res.status(500).json({
				diagnostic: 'Failed to create new activity'
			}));
		}
		// specify the alias for this Activity
		const aliasSpec = {
			id: Utils.Alias,
			version: 1
		};
		try {
			const newAlias = await api.createActivityAlias(activityName, aliasSpec);
		} catch (ex) {
			console.error(ex);
			return (res.status(500).json({
				diagnostic: 'Failed to create new alias for activity'
			}));
		}
        return res.status(200).json({
            Activity : qualifiedActivityId,
            Status : "Created"
        });
    }
    return res.status(200).json({
        Activity : qualifiedActivityId,
        Status : "Existing"
    });

})


///////////////////////////////////////////////////////////////////////
/// Delete appbundle from Desigan Automation server
///////////////////////////////////////////////////////////////////////
router.delete('/designautomation/appbundles/:appbundle_name', async(req, res, next) =>{
    const appbundle_name = req.params.appbundle_name;
    const api = Utils.dav3API(req.oauth_token);
    try{
        await api.deleteAppBundle( appbundle_name );
    }catch(ex){
        console.error(ex);
        return res.status(500).json({
            diagnostic: 'Failed to delete the bundle'
        });
    }
    return res.status(204).end();
})



///////////////////////////////////////////////////////////////////////
/// Delete activity from design automation server
///////////////////////////////////////////////////////////////////////
router.delete('/designautomation/activities/:activity_name', async(req, res, next) =>{
    const activity_name = req.params.activity_name;
    const api = Utils.dav3API(req.oauth_token);
    try{
        await api.deleteActivity( activity_name );
    }catch(ex){
        console.error(ex);
        return res.status(500).json({
            diagnostic: 'Failed to delete the activity'
        });
    }
    return res.status(204).end();
})

module.exports = router;
