#region Header
// Revit API .NET Labs
//
// Copyright (C) 2007-2019 by Autodesk, Inc.
//
// Permission to use, copy, modify, and distribute this software
// for any purpose and without fee is hereby granted, provided
// that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
//
// Use, duplication, or disclosure by the U.S. Government is subject to
// restrictions set forth in FAR 52.227-19 (Commercial Computer
// Software - Restricted Rights) and DFAR 252.227-7013(c)(1)(ii)
// (Rights in Technical Data and Computer Software), as applicable.
#endregion // Header

#region Namespaces
using System;
using System.IO;
using System.Collections.Generic;

using Newtonsoft.Json;

using Autodesk.Revit.ApplicationServices;
using Autodesk.Revit.DB;

using DesignAutomationFramework;

#endregion // Namespaces

namespace DesignAutomationSample
{

    [Autodesk.Revit.Attributes.Regeneration(Autodesk.Revit.Attributes.RegenerationOption.Manual)]
    [Autodesk.Revit.Attributes.Transaction(Autodesk.Revit.Attributes.TransactionMode.Manual)]
    public class AssetsInfo : IExternalDBApplication
    {
        public ExternalDBApplicationResult OnStartup(ControlledApplication app)
        {
            DesignAutomationBridge.DesignAutomationReadyEvent += HandleDesignAutomationReadyEvent;
            return ExternalDBApplicationResult.Succeeded;
        }

        public ExternalDBApplicationResult OnShutdown(ControlledApplication app)
        {
            return ExternalDBApplicationResult.Succeeded;
        }

        public void HandleDesignAutomationReadyEvent(object sender, DesignAutomationReadyEventArgs e)
        {
            e.Succeeded = ExportAssetsInModel(e.DesignAutomationData.RevitApp, e.DesignAutomationData.FilePath, e.DesignAutomationData.RevitDoc);
        }

        internal class AssetCollection
        {
            public string Workitem { get; set; } = "";
            public List<AssetInfo> AssetList { get; set; } = new List<AssetInfo>();
        }


        internal class AssetInfo
        {
            public string Id { get; set; } = "";
            public string CategoryId { get; set; } = "";
            public string StatusId { get; set; } = "";
            public string Manufacturer { get; set; } = "";
            public string Model { get; set; } = "";
            public string Description { get; set; } = "";
            public string Barcode { get; set; } = "";
        }

        /// <summary>
        /// AssetParams is used to parse the input Json parameters
        /// </summary>
        internal class AssetParams
        {
            public bool DuctTerminal { get; set; } = false;

            static public AssetParams Parse(string jsonPath)
            {
                try
                {
                    if (!File.Exists(jsonPath))
                        return new AssetParams { DuctTerminal = false };

                    string jsonContents = File.ReadAllText(jsonPath);
                    return JsonConvert.DeserializeObject<AssetParams>(jsonContents);
                }
                catch (System.Exception ex)
                {
                    Console.WriteLine("Exception when parsing json file: " + ex);
                    return null;
                }
            }
        }


        internal static List<Document> GetHostAndLinkDocuments(Document revitDoc)
        {
            List<Document> docList = new List<Document>();
            docList.Add(revitDoc);

            // Find RevitLinkInstance documents
            FilteredElementCollector elemCollector = new FilteredElementCollector(revitDoc);
            elemCollector.OfClass(typeof(RevitLinkInstance));
            foreach (Element curElem in elemCollector)
            {
                RevitLinkInstance revitLinkInstance = curElem as RevitLinkInstance;
                if (null == revitLinkInstance)
                    continue;

                Document curDoc = revitLinkInstance.GetLinkDocument();
                if (null == curDoc) // Link is unloaded.
                    continue;

                // When one linked document has more than one RevitLinkInstance in the
                // host document, then 'docList' will contain the linked document multiple times.

                docList.Add(curDoc);
            }

            return docList;
        }

        /// <summary>
        /// Count the element in each file
        /// </summary>
        /// <param name="revitDoc"></param>
        /// <param name="assetParams"></param>
        /// <param name="results"></param>
        internal static void ExtractAssets(Document revitDoc, AssetParams assetParams, ref AssetCollection assets)
        {
            if(assetParams.DuctTerminal)
            {
                Console.WriteLine("Extract DuctTerminal...");
                FilteredElementCollector collector = new FilteredElementCollector(revitDoc);
                ICollection<Element> collection = collector.OfClass(typeof(FamilyInstance))
                                                   .OfCategory(BuiltInCategory.OST_DuctTerminal)
                                                   .ToElements();

                int index = 1;
                foreach (var element in collection)
                {
                    AssetInfo asset = new AssetInfo();
                    // those values are just for showcase, in real case, please get these value from proper parameters
                    asset.Id = @"DuctTerminal-" + index;
                    asset.CategoryId = element.Category.Name;
                    // TBD: StatusId is fixed at this momentent
                    asset.StatusId = "Specified";
                    asset.Description = element.Name;
                    asset.Barcode = element.UniqueId;


                    FamilyInstance instance = element as FamilyInstance;
                    FamilySymbol symbol = instance.Symbol;
                    if(symbol != null)
                    {
                        Parameter manufacturer = symbol.get_Parameter(BuiltInParameter.ALL_MODEL_MANUFACTURER);
                        asset.Manufacturer = (manufacturer != null)? manufacturer.AsString() : "Not Specified";

                        Parameter model = symbol.get_Parameter(BuiltInParameter.ALL_MODEL_MODEL);
                        asset.Model = (model != null) ? model.AsString() : "Not Specified";
                    }
                    assets.AssetList.Add(asset);

                    index++;
                }
            }
            
            String[] paths = Directory.GetCurrentDirectory().Split('\\');
            assets.Workitem = paths[paths.Length - 1];
            Console.WriteLine(assets.AssetList.ToString());
            Console.WriteLine(assets.Workitem);
        }

        /// <summary>
        /// count the elements depends on the input parameter in params.json
        /// </summary>
        /// <param name="rvtApp"></param>
        /// <param name="inputModelPath"></param>
        /// <param name="doc"></param>
        /// <returns></returns>
        public static bool ExportAssetsInModel(Application rvtApp, string inputModelPath, Document doc)
        {
            if (rvtApp == null)
                return false;

            if (!File.Exists(inputModelPath))
                return false;

            if (doc == null)
                return false;

            Console.WriteLine("Start to execute the job");

            // For CountIt workItem: If RvtParameters is null, count all types
            AssetParams assetParams = AssetParams.Parse("params.json");
            AssetCollection assets = new AssetCollection();

            List<Document> allDocs = GetHostAndLinkDocuments(doc);
            foreach (Document curDoc in allDocs)
            {
                Console.WriteLine(@"Start to handle Document" + curDoc.PathName);
                ExtractAssets(curDoc, assetParams, ref assets);
            }

            using (StreamWriter sw = File.CreateText("result.json"))
            {
                sw.WriteLine(JsonConvert.SerializeObject(assets));
                sw.Close();
            }

            Console.WriteLine("Finished to execute the job");

            return true;
        }

    }

}
