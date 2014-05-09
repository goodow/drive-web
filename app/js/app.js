'use strict';

// Declare app level module which depends on filters, and services

angular.module('drive', [
    'ngRoute',
    'good.ui.grid',
    'drive.controllers',
    'drive.services',
    'drive.directives',
    'drive.filters'])
.config(['$routeProvider','$locationProvider',function($routeProvider,$locationProvider) {
//  $locationProvider.html5Mode(true).hashPrefix('');
  $routeProvider
      .when('/datagrid/:type', {templateUrl: 'partials/data-grid.html',controller:'DateCtrl'})
      .otherwise({'redirectTo':'/index.html' });
}])
//
//.run(['$templateCache',function($templateCache){
//    $templateCache.put('partials/helloworld1.html',"<h1 style='color:blue;'>{{helloworld1}}</h1>");
//}]);
