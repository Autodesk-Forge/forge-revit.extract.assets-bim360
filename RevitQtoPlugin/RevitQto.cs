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
            e.Succeeded = CountElementsInModel(e.DesignAutomationData.RevitApp, e.DesignAutomationData.FilePath, e.DesignAutomationData.RevitDoc);

            //e.Succeeded = ExportRevitQtoInfo(e.DesignAutomationData);
        }


        /// <summary>
        /// CountItResults is used to save the count result into Json file
        /// </summary>
        internal class CountItResults
        {
            public double Concrete { get; set; } = 0;
            public double Floor { get; set; } = 0;
            public int Window { get; set; } = 0;
            public int Door { get; set; } = 0;
            public string workitem { get; set; } = "";
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
        internal static void CountElements(Document revitDoc, CountItParams countItParams, ref CountItResults results)
        {

            if (countItParams.Concrete)
            {
                IList<Element> elements = new FilteredElementCollector(revitDoc).WhereElementIsNotElementType().ToElements();
                foreach( Element item in elements)
                {
                    Parameter familyType = item.get_Parameter(BuiltInParameter.ELEM_FAMILY_AND_TYPE_PARAM);
                    if (familyType == null || familyType.StorageType != StorageType.ElementId)
                        continue;

                    Console.WriteLine("Get Family type");

                    Element type = revitDoc.GetElement(familyType.AsElementId());
                    if (type == null)
                        continue;

                    Parameter materialParam = type.get_Parameter(BuiltInParameter.STRUCTURAL_MATERIAL_PARAM);
                    if (materialParam == null || materialParam.StorageType != StorageType.ElementId)
                        continue;

                    Console.WriteLine("Get Structure Material");


                    Material material = revitDoc.GetElement(materialParam.AsElementId()) as Material;
                    if (material == null)
                        continue;

                    Console.WriteLine("Get Material");

                    if (material.MaterialCategory == "Concrete")
                    {
                        Console.WriteLine("Concrete volumn is " + item.Name + " id is: " + item.Id.ToString());

                        double volumn = item.get_Parameter(BuiltInParameter.HOST_VOLUME_COMPUTED).AsDouble();
                        Console.WriteLine(volumn.ToString());
                        results.Concrete += volumn;
                    }
                }



            }

            if (countItParams.floors)
            {
                FilteredElementCollector elemCollector = new FilteredElementCollector(revitDoc);
                elemCollector.OfClass(typeof(Floor));
                IList<Element> elements = elemCollector.ToElements();
                foreach(Element element in elements)
                {
                    Floor floor = element as Floor;
                    if (floor == null)
                        continue;

                    Console.WriteLine("Get Structure Material: " + floor.Name);

                    double area = floor.get_Parameter(BuiltInParameter.HOST_AREA_COMPUTED).AsDouble();
                    results.Floor += area;
                }
            }

            if (countItParams.doors)
            {
                FilteredElementCollector collector = new FilteredElementCollector(revitDoc);
                ICollection<Element> collection = collector.OfClass(typeof(FamilyInstance))
                                                   .OfCategory(BuiltInCategory.OST_Doors)
                                                   .ToElements();

                int count = collection.Count;
                results.Door += count;
            }

            if (countItParams.windows)
            {
                FilteredElementCollector collector = new FilteredElementCollector(revitDoc);
                ICollection<Element> collection = collector.OfClass(typeof(FamilyInstance))
                                                   .OfCategory(BuiltInCategory.OST_Windows)
                                                   .ToElements();

                int count = collection.Count;
                results.Window += count;
            }
            
            results.Concrete /= 35.315;
            results.Floor /= 10.764;
            String[] paths = Directory.GetCurrentDirectory().Split('\\');
            results.workitem = paths[paths.Length - 1];
            Console.WriteLine(results.workitem);
        }

        /// <summary>
        /// count the elements depends on the input parameter in params.json
        /// </summary>
        /// <param name="rvtApp"></param>
        /// <param name="inputModelPath"></param>
        /// <param name="doc"></param>
        /// <returns></returns>
        public static bool CountElementsInModel(Application rvtApp, string inputModelPath, Document doc)
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
            CountItResults results = new CountItResults();

            List<Document> allDocs = GetHostAndLinkDocuments(doc);
            foreach (Document curDoc in allDocs)
            {
                CountElements(curDoc, countItParams, ref results);
            }

            using (StreamWriter sw = File.CreateText("result.json"))
            {
                sw.WriteLine(JsonConvert.SerializeObject(results));
                sw.Close();
            }

            Console.WriteLine("Finished to execute the job");

            return true;
        }

    }

}
