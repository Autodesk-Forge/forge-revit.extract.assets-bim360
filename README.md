# forge-revit.extract.quantity-bim360.cost

[![Node.js](https://img.shields.io/badge/Node.js-8.0-blue.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-4.0-blue.svg)](https://www.npmjs.com/)
![Platforms](https://img.shields.io/badge/Web-Windows%20%7C%20MacOS%20%7C%20Linux-lightgray.svg)
[![Data-Management](https://img.shields.io/badge/Data%20Management-v1-green.svg)](http://developer.autodesk.com/)
[![Design-Automation](https://img.shields.io/badge/Design%20Automation-v3-green.svg)](http://developer.autodesk.com/)
[![Forge-Viewer](https://img.shields.io/badge/Forge%20Viewer-v7-green.svg)](http://developer.autodesk.com/)
[![Cost Management](https://img.shields.io/badge/Cost%20Management-v1%20beta-green.svg)](http://developer.autodesk.com/)


![Windows](https://img.shields.io/badge/Plugins-Windows-lightgrey.svg)
![.NET](https://img.shields.io/badge/.NET%20Framework-4.7-blue.svg)
[![Revit-2020](https://img.shields.io/badge/Revit-2020-lightgrey.svg)](http://autodesk.com/revit)


![Advanced](https://img.shields.io/badge/Level-Advanced-red.svg)
[![MIT](https://img.shields.io/badge/License-MIT-blue.svg)](http://opensource.org/licenses/MIT)

# Description
This sample demonstrates extracting quantity information of Revit element directly from model under BIM 360 using design automation service, and calculate the budget for each element based on the quantity and price which is stored in database. 
The sample also provides the ability to import the generated budgets directly into BIM 360 Cost Management module, and synchronize the Unit Price for each element between Cost module and Price Book database. 


# Thumbnail
![thumbnail](/thumbnail.png)

# Demonstration
[![https://youtu.be/zJKvatl3zek](http://img.youtube.com/vi/zJKvatl3zek/0.jpg)](https://youtu.be/zJKvatl3zek "Generate Quantity and Budget from Revit model directly, and export to BIM360 Cost module as new Budgets")


# Live Demo
[https://revit-qto-bim360.herokuapp.com/](https://revit-qto-bim360.herokuapp.com/)

# Main Parts of The Work
1. Create a Revit Plugin to be used within AppBundle of Design Automation for Revit. Please check [PlugIn](./RevitQtoPlugin/) 
2. Create your App, upload the AppBundle, define your Activity, you can simply use the `**Configure**` button in the Web Application to create the Appbundle & Activity. Or you can use Postman to do that according to [this tutorial](https://forge.autodesk.com/en/docs/design-automation/v3/tutorials/revit/) and [repo](https://github.com/Autodesk-Forge/forge-tutorial-postman)  
3. Create the Web App to call the workitem.

# Web App Setup

## Prerequisites

1. **Forge Account**: Learn how to create a Forge Account, activate subscription and create an app at [this tutorial](http://learnforge.autodesk.io/#/account/). 
2. **BIM 360 Account**: must be an Account Admin to add the app custom integration, or invited by an admin of a BIM 360 Account. [Learn about provisioning](https://forge.autodesk.com/blog/bim-360-docs-provisioning-forge-apps). 
3. **BIM 360 Cost Management**: Create BIM 360 project, activate Cost Management module, setup project to create **Budget Code Template** for Cost Management according to [the guide](https://help.autodesk.com/view/BIM360D/ENU/?guid=BIM360D_Cost_Management_getting_started_with_cost_management_html)
4. **Visual Code**: Visual Code (Windows or MacOS).
5. **Revit 2020** & **Visual Studio 2017**: required to compile changes into the plugin
6. **ngrok**: Routing tool, [download here](https://ngrok.com/)
7. **MongoDB**: noSQL database, learn more. Or use a online version via Mongo Altas (this is used on this sample)


For using this sample, you need an Autodesk developer credentials. Visit the [Forge Developer Portal](https://developer.autodesk.com), sign up for an account, then [create an app](https://developer.autodesk.com/myapps/create). For this new app, use **http://localhost:3000/api/forge/callback/oauth** as Callback URL. Finally take note of the **Client ID** and **Client Secret**.

## Running locally

Install [NodeJS](https://nodejs.org), version 8 or newer.

Clone this project or download it (this `nodejs` branch only). It's recommended to install [GitHub desktop](https://desktop.github.com/). To clone it via command line, use the following (**Terminal** on MacOSX/Linux, **Git Shell** on Windows):

    git clone https://github.com/Autodesk-Forge/forge-revit.extract.quantity-bim360.cost

Install the required packages using `npm install`.

**ngrok**

Run `ngrok http 3000` to create a tunnel to your local machine, then copy the address into the `FORGE_WEBHOOK_URL` environment variable. Please check [WebHooks](https://forge.autodesk.com/en/docs/webhooks/v1/tutorials/configuring-your-server/) for details.

**MongoDB**

[MongoDB](https://www.mongodb.com) is a no-SQL database based on "documents", which stores JSON-like data. For testing purpouses, you can either use local or live. For cloud environment, try [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (offers a free tier). With MongoDB Atlas you can set up an account for free and create clustered instances, intructions:

1. Create an account on MongoDB Atlas.
2. Create a free version of cluster, use the default setting, but name it as `forgesample` for example.
3. Whitelist the IP address to access the database, [see this tutorial](https://docs.atlas.mongodb.com/security-whitelist/). If the sample is running on Heroku, you'll need to open to all (IP `0.0.0.0/0`). 
4. Create a new user to access the database, please keep the **user name** and **password** to be used in the following connection. 
5. At this point, you can click **Connect** button to check your **connection string** to the MongoDB cluster, the connection string should be in the form like 
`mongodb+srv://<username>:<password>@<clustername>-<njl8m>.mongodb.net`. 

Please set environment variable `OAUTH_DATABASE` with your url. [Learn more here](https://docs.mongodb.com/manual/reference/connection-string/)

There are several tools to view your database, [Robo 3T](https://robomongo.org/) (formerly Robomongo) is a free lightweight GUI that can be used. When it opens, follow instructions [here](https://www.datduh.com/blog/2017/7/26/how-to-connect-to-mongodb-atlas-using-robo-3t-robomongo) to connect to MongoDB Atlas.


**Environment variables**

Set the enviroment variables with your client ID & secret and finally start it. Via command line, navigate to the folder where this repository was cloned and use the following:

Mac OSX/Linux (Terminal)

    npm install
    export FORGE_CLIENT_ID=<<YOUR CLIENT ID FROM DEVELOPER PORTAL>>
    export FORGE_CLIENT_SECRET=<<YOUR CLIENT SECRET>>
    export FORGE_CALLBACK_URL=<<YOUR CALLBACK URL>>
    export FORGE_WEBHOOK_URL=<<YOUR DESIGN AUTOMATION FOR REVIT CALLBACK URL>>
    export OAUTH_DATABASE="mongodb+srv://<username>:<password>@<clustername>-<njl8m>.mongodb.net>>"

    npm start

Windows (use **Node.js command line** from Start menu)

    npm install
    set FORGE_CLIENT_ID=<<YOUR CLIENT ID FROM DEVELOPER PORTAL>>
    set FORGE_CLIENT_SECRET=<<YOUR CLIENT SECRET>>
    set FORGE_CALLBACK_URL=<<YOUR CALLBACK URL>>
    set FORGE_WEBHOOK_URL=<<YOUR DESIGN AUTOMATION FOR REVIT CALLBACK URL>>
    set OAUTH_DATABASE="mongodb+srv://<username>:<password>@<clustername>-<njl8m>.mongodb.net>>"
    npm start

## Using the app

Open the browser: [http://localhost:3000](http://localhost:3000).

**Please watch the [Video](https://youtu.be/zJKvatl3zek) for the detail setup and usage, or follow the steps:**

- **Setup the app before using the App**
1. Make sure the Forge App is integrated with your BIM 360 account, please click **Enable my BIM 360 Account** button and follow the steps to finish the integration. 
2. Make sure to create **Revi Design Automation** Appbundle & activity, click **Configure** button, select local **AppBundle** and **Engine** to create. Currently, Revit 2019|2020 engines are both supported. 
3. Make sure to [Create BIM360 project, activate Cost Management module, setup project for Cost Management](https://help.autodesk.com/view/BIM360D/ENU/?guid=BIM360D_Cost_Management_getting_started_with_cost_management_html), a **Budget Code Template** must be created before adding or importing budget items.
4. Make sure to initialize the **Price Book** database, open **Price Book** dialog, set **Length of budget code** according to your definition for **Budget Code Template**(the digits length of your budget code), and click **Reset** button, it will create **Standard_Book**(database), **Price_Book**(collection), with a couple of predefined sample price items.

- **Operate with App after setup**
1. Select Revit file version in BIM360 Hub to view the Model, Click `Extract quantity from the model` button, it will extract the quantity info for each Revit element, and calculate the budget based on the quantity and price which is stored in database as Price Book, then display you the result in table|chart.
2. Clike `Update to BIM360`, it will import the generated budgets directly into BIM 360 Cost Management module.
3. Open `BIM 360 Cost Management` module, check the budgets, and update the `Unit Cost` for any budget item, then click `Get Unit Price from BIM360` button, it will update the Price Book in the database and refresh budget table|chart based on the updated **Unit Price** from BIM360.

## Deployment

To deploy this application to Heroku, the **Callback URL** for Forge must use your `.herokuapp.com` address. After clicking on the button below, at the Heroku Create New App page, set your Client ID, Secret, Callback URL and Revit Design Automation variables for Forge.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Autodesk-Forge/forge-revit.extract.quantity-bim360.cost)

Watch [this video](https://www.youtube.com/watch?v=Oqa9O20Gj0c) on how deploy samples to Heroku.

## Packages used
- The sample is using [autodesk.forge.designautomation](https://www.npmjs.com/package/autodesk.forge.designautomation) SDK.
- The [Autodesk Forge](https://www.npmjs.com/package/forge-apis) packages is included by default. Some other non-Autodesk packaged are used, including [socket.io](https://www.npmjs.com/package/socket.io), [express](https://www.npmjs.com/package/express).
- The [MongoDB Node.js SDK](https://www.npmjs.com/package/mongodb) is used to operate with the database.


## Further Reading

**Documentation:**
- This sample is based on [Learn Forge Tutorial](https://github.com/Autodesk-Forge/learn.forge.viewhubmodels/tree/nodejs), please check details there about the basic framework if you are not familar. 
- [Data Management API](httqqqps://developer.autodesk.com/en/docs/data/v2/overview/)
- [BIM 360 API](https://developer.autodesk.com/en/docs/bim360/v1/overview/) and [App Provisioning](https://forge.autodesk.com/blog/bim-360-docs-provisioning-forge-apps)
- [BIM 360 Cost Management API](https://forge.autodesk.com/en/docs/bim360/v1/overview/field-guide/cost-management/)
- [Create BIM360 project, activate Cost Management module, setup project for Cost Management](https://help.autodesk.com/view/BIM360D/ENU/?guid=BIM360D_Cost_Management_getting_started_with_cost_management_html)
- [Design Automation API](https://forge.autodesk.com/en/docs/design-automation/v3/developers_guide/overview/)
- [Design Automation for Revit tutorial](https://forge.autodesk.com/en/docs/design-automation/v3/tutorials/revit/)

**Desktop APIs:**
- [Revit](https://knowledge.autodesk.com/support/revit-products/learn-explore/caas/simplecontent/content/my-first-revit-plug-overview.html)
**Other APIs:**
- [MongoDB for Node.js#](https://docs.mongodb.com/ecosystem/drivers/node/) driver
- [Mongo Altas](https://www.mongodb.com/cloud/atlas) Database-as-a-Service for MongoDB

**Tools**
- [Design Automation Postman collection](https://github.com/Autodesk-Forge/forge-tutorial-postman)

## Tips & Tricks
- The sample use the local endpoint to accept the outputJson file which is generated by the Revit cloud engine, this help improve the performance.

## Troubleshooting
- **Cannot see my BIM 360 projects**: Make sure to provision the Forge App Client ID within the BIM 360 Account, [learn more here](https://forge.autodesk.com/blog/bim-360-docs-provisioning-forge-apps). This requires the Account Admin permission.

- After installing Github desktop for Windows, on the Git Shell, if you see a ***error setting certificate verify locations*** error, use the following:

    git config --global http.sslverify "false"

## Limitation
- BIM 360 Cost Management module needs to be activated to use this App, due to the current limitation of BIM 360 API, user needs to activate **Cost Management** module, and create **Budget Code Template** in cost project setting manually. Please check [Create BIM360 project, activate Cost Management module, setup project for Cost Management](https://help.autodesk.com/view/BIM360D/ENU/?guid=BIM360D_Cost_Management_getting_started_with_cost_management_html) for details.
- **Budget Code** is required to create a budget. Currently, a random budget code with specified digits length(set in **Price Book**) will be automatically generated for each budget. 
- Currently Revit Cloud Worksharing is not supported by the Design Automation.  The scenario that this sample demonstrates is applicable only with a file-based Revit model. 
- Client JavaScript requires modern browser.

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.

## Written by

Zhong Wu [@johnonsoftware](https://twitter.com/johnonsoftware), [Forge Partner Development](http://forge.autodesk.com)
