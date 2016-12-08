var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var SHIPMENTS_COLLECTION = "shipments";

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

var db;

mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  db = database;
  console.log("Database connection ready");

  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// SHIPMENTS API ROUTER

function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/shipments"
 *    GET: finds all shipments
 *    POST: creates a new shipment
 */

app.get("/shipments", function(req, res) {
});

app.post("/shipments", function(req, res) {
  var newShipment = req.body;
  newShipment.createDate = new Date();

  if (!(req.body.reporter_code && req.body.reporter && req.body.partner_code && req.body.partner)) {
    handleError(res, "Invalid user input", "Must provide a reporter and partner.", 400);
  }

  db.collection(SHIPMENTS_COLLECTION).insertOne(newShipment, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new shipment.");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});
/*  "/shipments/:id"
 *    GET: find shipment by id
 *    PUT: update shipment by id
 *    DELETE: deletes shipment by id
 */

app.get("/shipments/:id", function(req, res) {
});

app.put("/shipments/:id", function(req, res) {
});

app.delete("/shipments/:id", function(req, res) {
});