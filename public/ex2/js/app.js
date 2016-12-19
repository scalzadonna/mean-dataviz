var animateApp = angular.module('animateApp', ['ngRoute', 'ngAnimate']);
$(document).load().scrollTop(0);

animateApp.config(function($routeProvider) {

    $routeProvider
    	.when('/', {
        controller: 'indexController',
    		templateUrl: 'home.html'
    	})
    	.when('/more', {
        controller: 'moreController',
        templateUrl: 'more.html'
    	});
});

animateApp.controller('indexController', function($scope) {
    $scope.pageClass = 'page-home';
});

animateApp.controller('moreController', function($scope) {
    $scope.pageClass = 'page-more';
});
