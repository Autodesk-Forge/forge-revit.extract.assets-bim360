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

// Autodesk Forge configuration
module.exports = {
    // Set environment variables or hard-code here
    credentials: {
        client_id: process.env.FORGE_CLIENT_ID,
        client_secret: process.env.FORGE_CLIENT_SECRET,
        callback_url: process.env.FORGE_CALLBACK_URL
    },
    scopes: {
        // Required scopes for the server-side application
        internal: ['code:all', 'bucket:create', 'bucket:read', 'data:read', 'data:create', 'data:write'],

        // Required scopes for the server-side design automation api
        internal_2legged: ['code:all', 'bucket:create', 'bucket:read', 'data:read', 'data:create', 'data:write'],

        // Required scope for the client-side viewer
        public: ['viewables:read']
    },
    client: {
        circuitBreaker: {
			threshold: 11,
			interval: 1200
		},
		retry: {
			maxNumberOfRetries: 7,
			backoffDelay: 4000,
			backoffPolicy: 'exponentialBackoffWithJitter'
		},
		requestTimeout: 25000
    },
    bim360Assets:{
        URL:{
            CATEGORIES_URL: "https://developer.api.autodesk.com/bim360/assets/v1/projects/{0}/categories",
            STATUS_SETS_URL: "https://developer.api.autodesk.com/bim360/assets/v1/projects/{0}/asset-statuses",
            CREATE_ASSERTS_URL: "https://developer.api.autodesk.com/bim360/assets/v2/projects/{0}/assets:batch-create"
        }
    },
    designAutomation:{
        app_base_domain: process.env.FORGE_WEBHOOK_URL,
        // the following environment variables are only required to define if you want to use your own predefined activity
        alias: process.env.DESIGN_AUTOMATION_ALIAS,
        nick_name:     process.env.DESIGN_AUTOMATION_NICKNAME,
        activity_name:     process.env.DESIGN_AUTOMATION_ACTIVITY_NAME
    }
};
