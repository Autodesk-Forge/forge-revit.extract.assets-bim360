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
const { database }= require('../config');

const MongoClient = require('mongodb').MongoClient;
const router = express.Router();

// Sample price book database, you can create complex database per your request
const price_Book = [
    {
        "Type": "Concrete",
        "Price": 146,
        "Unit": "m3"
    }, {
        "Type": "Window",
        "Price": 1224,
        "Unit": "nr"
    }, {
        "Type": "Door",
        "Price": 1836,
        "Unit": "nr"
    }, {
        "Type": "Floor",
        "Price": 80,
        "Unit": "m2"
    }
]

var mongoClient = new MongoClient(database.url, { useNewUrlParser: true, useUnifiedTopology: true });


// reset the database
router.post('/pricebook/database', async (req, res, next) => {
    mongoClient.connect((err, db) => {
        if (err) {
            console.error(err);
            return (res.status(500).json({
                diagnostic: "failed to connect server"
            }));
        }
        let dbo = db.db("Standard_Book");

        dbo.collections(  (err, collections)=>{
            if (err) {
                console.error(err);
                return (res.status(500).json({
                    diagnostic: "failed to find existing collection"
                }));
            }
            const priceBook = collections.find( (item)=>{
                return item.collectionName == 'Price_Book';
            } )
            if( priceBook != null ){
                dbo.collection("Price_Book").drop( (err, delOk) => {
                    if (err) {
                        console.error(err);
                        return (res.status(500).json({
                            diagnostic: "failed to delete existing collection"
                        }));
                    }
                    dbo.createCollection("Price_Book", (err, collection) => {
                        if (err) {
                            console.error(err);
                            return (res.status(500).json({
                                diagnostic: "failed to create collection"
                            }));
                        }
            
                        let priceBookInfo = price_Book;
                        const budgetCodeLength = req.body.budgetCodeLength;
                        priceBookInfo.push({'budgetCodeLength': budgetCodeLength});
                        collection.insertMany(priceBookInfo, (err, docs) => {
                            if (err) {
                                console.error(err);
                                return (res.status(500).json({
                                    diagnostic: "failed to create collection"
                                }));
                            }
                            res.status(200).json(docs.ops);
                            return;
                            // TBD   mongoClient.close();
                        })
                    })
                })
            }else{
                dbo.createCollection("Price_Book", (err, collection) => {
                    if (err) {
                        console.error(err);
                        return (res.status(500).json({
                            diagnostic: "failed to create collection"
                        }));
                    }
                    let priceBookInfo = price_Book;
                    const budgetCodeLength = req.body.budgetCodeLength;
                    priceBookInfo.push({'budgetCodeLength': budgetCodeLength});
                    collection.insertMany(price_Book, (err, docs) => {
                        if (err) {
                            console.error(err);
                            return (res.status(500).json({
                                diagnostic: "failed to create collection"
                            }));
                        }
                        res.status(200).json(docs.ops);
                        return;
                        // TBD   mongoClient.close();
                    })
                })   
            }
        } )
    });
})



/////////////////////////////////////////////////////////////////////
// get the price book info from database
/////////////////////////////////////////////////////////////////////
router.get('/pricebook/items', async (req, res, next) => {
    mongoClient.connect((err) => {
        if (err) {
            console.error(err);
            return (res.status(500).json({
                diagnostic: "failed to connect server"
            }));
        }
        const collection = mongoClient.db("Standard_Book").collection("Price_Book");
        // perform actions on the collection object
        collection.find({}).toArray(function (err, docs) {
            if (err) {
                console.error(err);
                mongoClient.close();
                return (res.status(500).json({
                    diagnostic: "failed to find the items in collection"
                }));
            }
            res.status(200).json(docs.filter(item => { return (item != null) }));
            return;
            // TBD   mongoClient.close();
        });
    });
});



/////////////////////////////////////////////////////////////////////
// Update the price book in database
/////////////////////////////////////////////////////////////////////
router.post('/pricebook/items', async (req, res, next) => {
    const requestBody = req.body;
    mongoClient.connect((err) => {
        if (err) {
            console.error(err);
            return (res.status(500).json({
                diagnostic: "failed to connect server"
            }));
        }
        const collection = mongoClient.db("Standard_Book").collection("Price_Book");
        // perform actions on the collection object
        collection.updateOne({ "Type": requestBody.type }, { $set: { "Price": requestBody.unitPrice } }, function (err, result) {
            if (err) {
                console.error(err);
                mongoClient.close();
                return (res.status(500).json({
                    diagnostic: "failed to update the items in collection"
                }));
            }
            res.status(200).json(result);
            return;
            // TBD   mongoClient.close();
        });
    });
});



module.exports = router;
