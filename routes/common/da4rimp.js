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

const request = require("request");
const _path = require('path');
const _fs = require('fs');
const _url = require('url');
const config = require('../../config');
const dav3 = require('autodesk.forge.designautomation');


class Utils {

	/// <summary>
	/// Returns the directory where bindles are stored on the local machine.
	/// </summary>
	static get LocalBundlesFolder() {
		return (_path.resolve(_path.join(__dirname, '../..', 'public/bundles')));
	}

	/// <summary>
	/// Prefix for AppBundles and Activities. This value may come from an environment variable
	/// </summary>
	static get NickName() {
		if( config.designAutomation && config.designAutomation.nick_name ){
			return (config.designAutomation.nick_name);
		}else{
			return (config.credentials.client_id);
		}
	}

	/// <summary>
	/// Alias for the app (e.g. DEV, STG, PROD). This value may come from an environment variable
	/// </summary>
	static get Alias() {
		if( config.designAutomation && config.designAutomation.alias ){
			return (config.designAutomation.alias);
		}else{
			return ('dev');
		}
	}

	/// <summary>
	/// Activity name. This value may come from an environment variable
	/// </summary>
	static get ActivityName() {
		if( config.designAutomation && config.designAutomation.activity_name ){
			return (config.designAutomation.activity_name);
		}else{
			return ('ExtractAssetsActivity');
		}
	}

	/// <summary>
	/// Search files in a folder and filter them.
	/// </summary>
	static async findFiles(dir, filter) {
		return (new Promise((fulfill, reject) => {
			_fs.readdir(dir, (err, files) => {
				if (err)
					return (reject(err));
				if (filter !== undefined && typeof filter === 'string')
					files = files.filter((file) => {
						return (_path.extname(file) === filter);
					});
				else if (filter !== undefined && typeof filter === 'object')
					files = files.filter((file) => {
						return (filter.test(file));
					});
				fulfill(files);
			});
		}));
	}

	/// <summary>
	/// Create a new DAv3 client/API with default settings
	/// </summary>
	static dav3API(oauth2) {
		let apiClient = new dav3.AutodeskForgeDesignAutomationClient(config.client);
		apiClient.authManager.authentications['2-legged'].accessToken = oauth2.access_token;
		return (new dav3.AutodeskForgeDesignAutomationApi(apiClient));
	}

	/// <summary>
	/// Helps identify the engine
	/// </summary>
	static EngineAttributes(engine) {
		if (engine.includes('3dsMax'))
			return ({
				commandLine: '$(engine.path)\\3dsmaxbatch.exe -sceneFile $(args[inputFile].path) $(settings[script].path)',
				extension: 'max',
				script: "da = dotNetClass(\'Autodesk.Forge.Sample.DesignAutomation.Max.RuntimeExecute\')\nda.ModifyWindowWidthHeight()\n"
			});
		if (engine.includes('AutoCAD'))
			return ({
				commandLine: '$(engine.path)\\accoreconsole.exe /i $(args[inputFile].path) /al $(appbundles[{0}].path) /s $(settings[script].path)',
				extension: 'dwg',
				script: "UpdateParam\n"
			});
		if (engine.includes('Inventor'))
			return ({
				commandLine: '$(engine.path)\\InventorCoreConsole.exe /i $(args[inputFile].path) /al $(appbundles[{0}].path)',
				extension: 'ipt',
				script: ''
			});
		if (engine.includes('Revit'))
			return ({
				commandLine: '$(engine.path)\\revitcoreconsole.exe /i $(args[inputFile].path) /al $(appbundles[{0}].path)',
				extension: 'rvt',
				script: ''
			});

		throw new Error('Invalid engine');
	}

	static FormDataLength(form) {
		return (new Promise((fulfill, reject) => {
			form.getLength((err, length) => {
				if (err)
					return (reject(err));
				fulfill(length);
			});
		}));
	}

	/// <summary>
	/// Upload a file
	/// </summary>
	static uploadFormDataWithFile(filepath, endpoint, params = null) {
		return (new Promise(async (fulfill, reject) => {
			const fileStream = _fs.createReadStream(filepath);

			const form = new formdata();
			if (params) {
				const keys = Object.keys(params);
				for (let i = 0; i < keys.length; i++)
					form.append(keys[i], params[keys[i]]);
			}
			form.append('file', fileStream);

			let headers = form.getHeaders();
			headers['Cache-Control'] = 'no-cache';
			headers['Content-Length'] = await Utils.FormDataLength(form);

			const urlinfo = _url.parse(endpoint);
			const postReq = http.request({
					host: urlinfo.host,
					port: (urlinfo.port || (urlinfo.protocol === 'https:' ? 443 : 80)),
					path: urlinfo.pathname,
					method: 'POST',
					headers: headers
				},
				response => {
					fulfill(response.statusCode);
				},
				err => {
					reject(err);
				}
			);

			form.pipe(postReq);
		}));
    }
    

    ///////////////////////////////////////////////////////////////////////
    /// Upload the package to AWS url
    ///////////////////////////////////////////////////////////////////////
    static uploadAppBundleAsync( field, data) {
    
        return new Promise(function (resolve, reject) {
            let myData = field.formData;
            myData.file = data;
    
            var options = {
                method: 'POST',
                url: field.endpointURL,
                formData: myData,
                headers: {
                    'content-type': 'multipart/form-data'
                },
            };
            request(options, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    let resp;
                    try {
                        resp = JSON.parse(body)
                    } catch (e) {
                        resp = body
                    }
                    if (response.statusCode >= 400) {
                        console.log('error code: ' + response.statusCode + ' response message: ' + response.statusMessage);
                        reject({
                            statusCode: response.statusCode,
                            statusMessage: response.statusMessage
                        });
                    } else {
                        resolve({
                            statusCode: response.statusCode,
                            headers: response.headers,
                            body: resp
                        });
                    }
                }
            });
        });
    }
}


module.exports = 
{ 
    Utils
};
    