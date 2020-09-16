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
using System.Linq;
using System.Collections.Generic;

using Newtonsoft.Json;

using Autodesk.Revit.ApplicationServices;
using Autodesk.Revit.DB;

using DesignAutomationFramework;

#endregion // Namespaces

namespace RevitQto
{


    [Autodesk.Revit.Attributes.Regeneration(Autodesk.Revit.Attributes.RegenerationOption.Manual)]
    [Autodesk.Revit.Attributes.Transaction(Autodesk.Revit.Attributes.TransactionMode.Manual)]
    public class ExportQtoInfo : IExternalDBApplication
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

        }

        /// <summary>
        /// CountItParams is used to parse the input Json parameters
        /// </summary>
        internal class CountItParams
        {
            public bool walls { get; set; } = false;
            public bool Concrete { get; set; } = true;
            public bool floors { get; set; } = false;
            public bool doors { get; set; } = false;
            public bool windows { get; set; } = false;

            static public CountItParams Parse(string jsonPath)
            {
                try
                {
                    if (!File.Exists(jsonPath))
                        return new CountItParams { walls = true, Concrete = true, floors = true, doors = true, windows = true };

                    string jsonContents = File.ReadAllText(jsonPath);
                    return JsonConvert.DeserializeObject<CountItParams>(jsonContents);
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
        /// <param name="countItParams"></param>
        /// <param name="results"></param>
        internal static void CountElements(Document revitDoc, CountItParams countItParams, ref AssetCollection assets)
        {
            if (countItParams.floors)
            {
                FilteredElementCollector elemCollector = new FilteredElementCollector(revitDoc);
                elemCollector.OfClass(typeof(Floor));
                IList<Element> elements = elemCollector.ToElements();
                int index = 1;
                foreach(Element element in elements)
                {
                    Floor floor = element as Floor;
                    if (floor == null)
                        continue;

                    Console.WriteLine("Get floor name: " + floor.Name);

                    AssetInfo asset = new AssetInfo();
                    asset.Id = @"Floor-" + index;
                    asset.CategoryId = floor.Category.Name;
                    asset.StatusId = "Specified";
                    asset.Manufacturer = "Manufacturer US";
                    asset.Model = "Test sample";
                    assets.AssetList.Add(asset);
                    index++;
                }
            }

            if (countItParams.doors)
            {
                FilteredElementCollector collector = new FilteredElementCollector(revitDoc);
                ICollection<Element> collection = collector.OfClass(typeof(FamilyInstance))
                                                   .OfCategory(BuiltInCategory.OST_Doors)
                                                   .ToElements();

                int index = 1;
                foreach( var element in collection)
                {
                    AssetInfo asset = new AssetInfo();
                    asset.Id = @"Door-" + index;
                    asset.CategoryId = element.Category.Name;
                    asset.StatusId = "Specified";
                    asset.Manufacturer = "Manufacturer Asia";
                    asset.Model = "Test sample";
                    assets.AssetList.Add(asset);

                    index++;
                }
            }

            if (countItParams.windows)
            {
                FilteredElementCollector collector = new FilteredElementCollector(revitDoc);
                ICollection<Element> collection = collector.OfClass(typeof(FamilyInstance))
                                                   .OfCategory(BuiltInCategory.OST_Windows)
                                                   .ToElements();

                int index = 1;
                foreach (var element in collection)
                {
                    AssetInfo asset = new AssetInfo();
                    asset.Id = @"Window-" + index;
                    asset.CategoryId = element.Category.Name;
                    asset.StatusId = "Specified";
                    asset.Manufacturer = "Manufacturer EMEA";
                    asset.Model = "Test sample";
                    assets.AssetList.Add(asset);

                    index++;
                }
            }
            
            String[] paths = Directory.GetCurrentDirectory().Split('\\');
            assets.Workitem = paths[paths.Length - 1];
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
            CountItParams countItParams = CountItParams.Parse("params.json");
            AssetCollection assets = new AssetCollection();

            List<Document> allDocs = GetHostAndLinkDocuments(doc);
            foreach (Document curDoc in allDocs)
            {
                CountElements(curDoc, countItParams, ref assets);
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
