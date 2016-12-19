angular.module('controlsApp', ['AxelSoft'])
  .controller('ListSelectController', function($scope) {
    $scope.countryLabels = {
      displayText: 'Importador',
      emptyListText: 'No hay resultados',
      emptySearchResultText: 'Ningún importador para "$0"'
    };
    $scope.commodityLabels = {
      displayText: 'Producto',
      emptyListText: 'No hay resultados',
      emptySearchResultText: 'Ningún producto para "$0"'
    };

    $scope.countries = [];
    $scope.commodities = [];

    //Load data from REST service
    d3.json("../shipments/countries/", function(error, data) {
      if (error) return console.warn(error);
      $scope.countries = data;
    });
    d3.json("../shipments/commodities/", function(error, data) {
      if (error) return console.warn(error);
      $scope.commodities = data;
    });

    $scope.$watch('selectedCountry', function(newVal) {
      if (newVal && newVal.key){
        if ($scope.selectedCommodity && $scope.selectedCommodity.key)
          onCountryChange(newVal.key,$scope.selectedCommodity.key)
        else onCountryChange(newVal.key);
      }
    });
    $scope.$watch('selectedCommodity', function(newVal) {
      if (newVal && newVal.key){
        //If there's a country selected filter by both
        if ($scope.selectedCountry && $scope.selectedCountry.key)
          onCommodityChange(newVal.key,$scope.selectedCountry.key)
        else onCommodityChange(newVal.key);
      }
    });
  });
