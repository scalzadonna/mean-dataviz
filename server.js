var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var session = require('express-session');
var flash = require('req-flash');
var ObjectID = mongodb.ObjectID;

var db,
    SHIPMENTS_COLLECTION = "shipments",
    COMMODITIES_COLLECTION = "commodities",
    COUNTRIES_COLLECTION = "countries";

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(session(
  { secret: 'chiforimpula', resave: true, saveUninitialized: true }));
app.use(checkAuth);
app.use(flash());
app.set('view engine', 'jade');
app.set('view options', { layout: false });


mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  db = database;
  console.log("MongoDB connection up & running");

  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("Server is running on port", port);
  });
});

app.get('/', function (req, res) {
		res.redirect('/login');
});


app.get('/login', function (req, res, next) {
		res.render('login', { flash: req.flash() } );
});

app.get('/register', function (req, res, next) {
		res.render('register', { flash: req.flash() } );
});


app.post('/register', function (req, res, next) {
    console.log(req);
    req.flash('error', 'Usuario creado, ingrese con sus credenciales');
    res.redirect('/login');
});

app.get('/secure', function (req, res, next) {
		res.redirect('dashboard');
});

app.post('/login', function (req, res, next) {

	// you might like to do a database look-up or something more scalable here
	//if (req.body.username && req.body.username === 'user' && req.body.password && req.body.password === 'pass') {
		req.session.authenticated = true;
		res.redirect('/secure');
	// } else {
	// 	req.flash('error', 'Usuario o contrasena incorrecto');
	// 	res.redirect('/login');
	// }

});

app.get('/logout', function (req, res, next) {
	delete req.session.authenticated;
	res.redirect('/');
});


// SHIPMENTS API ROUTER
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
  var queryObject = {};

  var partnerParam = +req.params.code;
  if (partnerParam > -1)
    queryObject["partner_code"] = partnerParam;
  else
    queryObject["partner_code"] = -1;

  var commodityParam = +req.query.commodity;
    if (commodityParam>-1)
      queryObject["commodity_code"] = commodityParam;

	db.collection(SHIPMENTS_COLLECTION)
    .find(queryObject,
      {
        _id:0,
        period:1,
        year:1,
        partner_code:1,
        commodity_code:1,
        trade_value_start_exports:1,
        trade_value_total:1
      })
    .toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get shipments for that country.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.get("/shipments/commodity/:code", function(req, res) {
  var queryObject = {};

  var commodityParam = +req.params.code;
  if (commodityParam)
    queryObject["commodity_code"] = commodityParam;
  else
    queryObject["commodity_code"] = -1;

  var partnerParam = +req.query.partner;
  if (partnerParam>-1)
    queryObject["partner_code"] = partnerParam;

	db.collection(SHIPMENTS_COLLECTION)
    .find(queryObject,
      {
        _id:0,
        period:1,
        year:1,
        partner_code:1,
        commodity_code:1,
        trade_value_start_exports:1,
        trade_value_total:1
      })
    .toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get shipments for that commodity.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.get("/shipments/commodities", function(req, res) {
	db.collection(COMMODITIES_COLLECTION)
    .find({}, {_id:0,key:1,value:1})
    .toArray(function(err, docs) {
      if (err) {
        handleError(res, err.message, "Failed to get commodities.");
      } else {
        res.status(200).json(docs);
      }
    });
});

  //Retrieve all countries for json mongoimport, deprecated
// app.get("/shipments/countries", function(req, res) {
// 	db.collection(SHIPMENTS_COLLECTION)
//     .aggregate( [
//       { $group : { _id : "$partner_code",  value: { $addToSet: "$partner" } } },
//       { $sort : { value : 1, } }
//     ] )
//     .toArray(function(err, docs) {
//       if (err) {
//         handleError(res, err.message, "Failed to get countries.");
//       } else {
//         res.status(200).json(docs);
//       }
//     });
// });

  app.get("/shipments/countries", function(req, res) {
  	db.collection(COUNTRIES_COLLECTION)
      .find({}, {_id:0,key:1,value:1})
      .toArray(function(err, docs) {
        if (err) {
          handleError(res, err.message, "Failed to get countries.");
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


function checkAuth (req, res, next) {
	// don't serve /secure to those not logged in
	// you should add to this list, for each and every secure url
	if (req.url === '/secure' && (!req.session || !req.session.authenticated)) {
		res.render('unauthorised', { status: 403 });
		return;
	}
	next();
}

function handleError(res, reason, message, code) {
  console.log("Error ocurred: " + reason);
  res.status(code || 500).json({"error message": message});
}
