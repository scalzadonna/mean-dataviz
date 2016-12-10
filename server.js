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
  console.log("Database connection up and running");

  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// SHIPMENTS API ROUTER

function handleError(res, reason, message, code) {
  console.log("Error ocurred: " + reason);
  res.status(code || 500).json({"error message": message});
}

/*  "/shipments"
 *    GET: finds all shipments
 *    POST: creates a new shipment
 */

app.get("/shipments", function(req, res) {
	db.collection(SHIPMENTS_COLLECTION).find({}).limit( 20 ).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get shipments.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.get("/shipments/limit/:qty", function(req, res) {
	db.collection(SHIPMENTS_COLLECTION).find({}).limit( +req.params.qty ).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get shipments.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.get("/shipments/partner/:code", function(req, res) {
  console.log('queryng for:');
  console.log(req.params.code);
	db.collection(SHIPMENTS_COLLECTION).find({"partner_code": +req.params.code}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get shipments.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.get("/shipments/commodity/:code", function(req, res) {
	db.collection(SHIPMENTS_COLLECTION).find({'commodity_code': +req.params.code}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get shipments.");
    } else {
      res.status(200).json(docs);
    }
  });
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
	db.collection(SHIPMENTS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get shipment");
    } else {
      res.status(200).json(doc);
    }
  });

});

app.put("/shipments/:id", function(req, res) {
	var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(SHIPMENTS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update contact");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/shipments/:id", function(req, res) {
	db.collection(CONTACTS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete shipment");
    } else {
      res.status(204).end();
    }
  });
});
