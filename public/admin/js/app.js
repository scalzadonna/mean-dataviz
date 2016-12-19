angular.module("shipmentsApp", ['ngRoute'])
    .config(function($routeProvider) {
        $routeProvider
            .when("/", {
                templateUrl: "list.html",
                controller: "ListController",
                resolve: {
                    shipments: function(Shipments) {
                        return Shipments.getShipments();
                    }
                }
            })
            .when("/new/shipment", {
                controller: "NewShipmentController",
                templateUrl: "shipment-form.html"
            })
            .when("/shipment/:shipmentId", {
                controller: "EditShipmentController",
                templateUrl: "shipment.html"
            })
            .otherwise({
                redirectTo: "/"
            })
    })
    .service("Shipments", function($http) {
        this.getShipments = function() {
            return $http.get("/shipments").
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error finding shipments.");
                });
        }
        this.createShipment = function(shipment) {
            return $http.post("/shipments", shipment).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error creating shipment.");
                });
        }
        this.getShipment = function(shipmentId) {
            var url = "/shipments/" + shipmentId;
            return $http.get(url).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error finding this shipment.");
                });
        }
        this.editShipment = function(shipment) {
            var url = "/shipments/" + shipment._id;
            return $http.put(url, shipment).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error editing this shipment.");
                    console.log(response);
                });
        }
        this.deleteShipment = function(shipmentId) {
            var url = "/shipments/" + shipmentId;
            return $http.delete(url).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error deleting this shipment.");
                    console.log(response);
                });
        }
    })
    .controller("ListController", function(shipments, $scope) {
        $scope.shipments = shipments.data;
    })
    .controller("NewShipmentController", function($scope, $location, Shipments) {
        $scope.back = function() {
            $location.path("#/");
        }

        $scope.saveShipment = function(shipment) {
            Shipments.createShipment(shipment).then(function(doc) {
                var shipmentUrl = "/shipment/" + doc.data._id;
                $location.path(shipmentUrl);
            }, function(response) {
                alert(response);
            });
        }
    })
    .controller("EditShipmentController", function($scope, $routeParams, Shipments) {
        Shipments.getShipment($routeParams.shipmentId).then(function(doc) {
            $scope.shipment = doc.data;
        }, function(response) {
            alert(response);
        });

        $scope.toggleEdit = function() {
            $scope.editMode = true;
            $scope.shipmentFormUrl = "shipment-form.html";
        }

        $scope.back = function() {
            $scope.editMode = false;
            $scope.shipmentFormUrl = "";
        }

        $scope.saveShipment = function(shipment) {
            Shipments.editShipment(shipment);
            $scope.editMode = false;
            $scope.shipmentFormUrl = "";
        }

        $scope.deleteShipment = function(shipmentId) {
            Shipments.deleteShipment(shipmentId);
        }
    });
