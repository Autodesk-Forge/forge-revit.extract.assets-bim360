# forge-revit.extract.assets-bim360

[![Node.js](https://img.shields.io/badge/Node.js-8.0-blue.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-4.0-blue.svg)](https://www.npmjs.com/)
![Platforms](https://img.shields.io/badge/Web-Windows%20%7C%20MacOS%20%7C%20Linux-lightgray.svg)
[![Data-Management](https://img.shields.io/badge/Data%20Management-v1-green.svg)](http://developer.autodesk.com/)
[![Design-Automation](https://img.shields.io/badge/Design%20Automation-v3-green.svg)](http://developer.autodesk.com/)
[![Forge-Viewer](https://img.shields.io/badge/Forge%20Viewer-v7-green.svg)](http://developer.autodesk.com/)
[![Assets Management](https://img.shields.io/badge/Assets%20Management-v1%20beta-green.svg)](http://developer.autodesk.com/)


![Windows](https://img.shields.io/badge/Plugins-Windows-lightgrey.svg)
![.NET](https://img.shields.io/badge/.NET%20Framework-4.7-blue.svg)
[![Revit-2020](https://img.shields.io/badge/Revit-2020-lightgrey.svg)](http://autodesk.com/revit)


![Advanced](https://img.shields.io/badge/Level-Advanced-red.svg)
[![MIT](https://img.shields.io/badge/License-MIT-blue.svg)](http://opensource.org/licenses/MIT)

# Description
Generating construction assets directly from Revit model is one scenario which focus on assets preparation. For example, a MEP model, there might be thousands of devices, customer has the requirement to automatically generate all of these devices directly from the design model into BIM 360 Assets. 
This sample demonstrates extracting assets information of Revit element directly from model under BIM 360 using design automation service. 
The sample also provides the ability to import the generated assets directly into BIM 360 Assets Management module. 


# Thumbnail
![thumbnail](/thumbnail.png)


# Live Demo
[https://revit-assets-bim360.herokuapp.com/](https://revit-assets-bim360.herokuapp.com/)

# Main Parts of The Work
1. Create a Revit Plugin to be used within AppBundle of Design Automation for Revit. Please check [PlugIn](./RevitPlugin/) 
2. Create your App, upload the AppBundle, define your Activity, you can simply use the **Configure** button in the Web Application to create the Appbundle & Activity. Or you can use Postman to do that according to [this tutorial](https://forge.autodesk.com/en/docs/design-automation/v3/tutorials/revit/) and [repo](https://github.com/Autodesk-Forge/forge-tutorial-postman)  
3. Create the Web App to call the workitem.

# Web App Setup

## Prerequisites

1. **Forge Account**: Learn how to create a Forge Account, activate subscription and create an app at [this tutorial](http://learnforge.autodesk.io/#/account/). 
2. **BIM 360 Account**: must be an Account Admin to add the app custom integration, or invited by an admin of a BIM 360 Account. [Learn about provisioning](https://forge.autodesk.com/blog/bim-360-docs-provisioning-forge-apps). 
3. **BIM 360 Assets Management**: Create BIM 360 project, [activate Assets Management module](http://help.autodesk.com/view/BIM360D/ENU/?guid=GUID-62233D06-249B-4D6E-BC05-5303642220A3).
4. **Visual Code**: Visual Code (Windows or MacOS).
5. **Revit 2020** & **Visual Studio 2017**: required to compile changes into the plugin
6. **ngrok**: Routing tool, [download here](https://ngrok.com/)


For using this sample, you need an Autodesk developer credentials. Visit the [Forge Developer Portal](https://developer.autodesk.com), sign up for an account, then [create an app](https://developer.autodesk.com/myapps/create). For this new app, use **http://localhost:3000/api/forge/callback/oauth** as Callback URL. Finally take note of the **Client ID** and **Client Secret**.

## Running locally

Install [NodeJS](https://nodejs.org), version 8 or newer.

Clone this project or download it (this `nodejs` branch only). It's recommended to install [GitHub desktop](https://desktop.github.com/). To clone it via command line, use the following (**Terminal** on MacOSX/Linux, **Git Shell** on Windows):

    git clone https://github.com/Autodesk-Forge/forge-revit.extract.assets-bim360

Install the required packages using `npm install`.

**ngrok**

Run `ngrok http 3000` to create a tunnel to your local machine, then copy the address into the `FORGE_WEBHOOK_URL` environment variable. Please check [WebHooks](https://forge.autodesk.com/en/docs/webhooks/v1/tutorials/configuring-your-server/) for details.


**Environment variables**

Set the enviroment variables with your client ID & secret and finally start it. Via command line, navigate to the folder where this repository was cloned and use the following:

Mac OSX/Linux (Terminal)

    npm install
    export FORGE_CLIENT_ID=<<YOUR CLIENT ID FROM DEVELOPER PORTAL>>
    export FORGE_CLIENT_SECRET=<<YOUR CLIENT SECRET>>
    export FORGE_CALLBACK_URL=<<YOUR CALLBACK URL>>
    export FORGE_WEBHOOK_URL=<<YOUR DESIGN AUTOMATION FOR REVIT CALLBACK URL>>

    npm start

Windows (use **Node.js command line** from Start menu)

    npm install
    set FORGE_CLIENT_ID=<<YOUR CLIENT ID FROM DEVELOPER PORTAL>>
    set FORGE_CLIENT_SECRET=<<YOUR CLIENT SECRET>>
    set FORGE_CALLBACK_URL=<<YOUR CALLBACK URL>>
    set FORGE_WEBHOOK_URL=<<YOUR DESIGN AUTOMATION FOR REVIT CALLBACK URL>>
    npm start

## Using the app

Open the browser: [http://localhost:3000](http://localhost:3000).

**Please watch the [Video](https://youtu.be/zJKvatl3zek) for the detail setup and usage, or follow the steps:**

- **Setup the app before using the App**
1. Make sure the Forge App is integrated with your BIM 360 account, please click **Enable my BIM 360 Account** button and follow the steps to finish the integration. 
2. Make sure to create **Revi Design Automation** Appbundle & activity, click **Configure** button, select local **AppBundle** and **Engine** to create. Currently, Revit 2019|2020|2021 engines are all supported. 
3. Make sure to [Create BIM360 project, activate Assets Management module](http://help.autodesk.com/view/BIM360D/ENU/?guid=GUID-62233D06-249B-4D6E-BC05-5303642220A3).


- **Operate with App after setup**
1. Select Revit file version in BIM360 Hub to view the Model, Click `Extract Assets from the model` button, it will extract the assets info for each Revit element.
2. Clike `Create to BIM360`, it will import the generated assets directly into BIM 360 Assets Management module.
3. Open `BIM 360 Assets Management` module, check the assets.

## Deployment

To deploy this application to Heroku, the **Callback URL** for Forge must use your `.herokuapp.com` address. After clicking on the button below, at the Heroku Create New App page, set your Client ID, Secret, Callback URL and Revit Design Automation variables for Forge.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Autodesk-Forge/forge-revit.extract.assets-bim360)

Watch [this video](https://www.youtube.com/watch?v=Oqa9O20Gj0c) on how deploy samples to Heroku.

## Packages used
- The sample is using [autodesk.forge.designautomation](https://www.npmjs.com/package/autodesk.forge.designautomation) SDK.
- The [Autodesk Forge](https://www.npmjs.com/package/forge-apis) packages is included by default. Some other non-Autodesk packaged are used, including [socket.io](https://www.npmjs.com/package/socket.io), [express](https://www.npmjs.com/package/express).

## Further Reading

**Documentation:**
- This sample is based on [Learn Forge Tutorial](https://github.com/Autodesk-Forge/learn.forge.viewhubmodels/tree/nodejs), please check details there about the basic framework if you are not familar. 
- [Data Management API](httqqqps://developer.autodesk.com/en/docs/data/v2/overview/)
- [BIM 360 API](https://developer.autodesk.com/en/docs/bim360/v1/overview/) and [App Provisioning](https://forge.autodesk.com/blog/bim-360-docs-provisioning-forge-apps)
- [BIM 360 Assets Management API](https://forge.autodesk.com/en/docs/bim360/v1/overview/field-guide/assets/)

- [Design Automation API](https://forge.autodesk.com/en/docs/design-automation/v3/developers_guide/overview/)
- [Design Automation for Revit tutorial](https://forge.autodesk.com/en/docs/design-automation/v3/tutorials/revit/)

**Desktop APIs:**
- [Revit](https://knowledge.autodesk.com/support/revit-products/learn-explore/caas/simplecontent/content/my-first-revit-plug-overview.html)

**Tools**
- [Design Automation Postman collection](https://github.com/Autodesk-Forge/forge-tutorial-postman)

## Tips & Tricks
- BIM 360 Assets Management module needs to be activated to use this App.
- The sample use the local endpoint to accept the outputJson file which is generated by the Revit cloud engine, this help improve the performance.
- While importing assets to BIM 360 Assets Management module, the category will be created if it's not existing, and the default status(**Specified**) of asset will be used if the status is not existing. 

## Troubleshooting
- **Cannot see my BIM 360 projects**: Make sure to provision the Forge App Client ID within the BIM 360 Account, [learn more here](https://forge.autodesk.com/blog/bim-360-docs-provisioning-forge-apps). This requires the Account Admin permission.

- After installing Github desktop for Windows, on the Git Shell, if you see a ***error setting certificate verify locations*** error, use the following:

    git config --global http.sslverify "false"

## Limitation
- Currently Revit Cloud Worksharing is not supported by the Design Automation.  The scenario that this sample demonstrates is applicable only with a file-based Revit model. 
- Client JavaScript requires modern browser.

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.

## Written by

Zhong Wu [@johnonsoftware](https://twitter.com/johnonsoftware), [Forge Partner Development](http://forge.autodesk.com)
