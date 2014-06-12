'use strict';

// Declare app level module which depends on filters, and services

angular.module('drive', [
  'ngRoute',
  'good.ui.grid',
  'drive.controllers',
  'drive.services',
  'drive.directives',
  'drive.filters',
  'ngCookies',
  'angularCharts'])
    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
//  $locationProvider.html5Mode(true).hashPrefix('');
//      $locationProvider.html5Mode(true);
      $routeProvider
          .when('/datagrid/attachment', {templateUrl: 'partials/documentStatistic.html', controller: 'AttachmentCtrl'})
          .when('/datagrid/attachmentActivity', {templateUrl: 'partials/attachmentActivity.html', controller: 'AttachmentActivityCtrl'})
          .when('/datagrid/device', {templateUrl: 'partials/device.html', controller: 'DeviceCtrl'})
          .when('/datagrid/deviceActivity', {templateUrl: 'partials/deviceActivity.html', controller: 'DeviceActivityCtrl'})
          .when('/datagrid/devicestatus', {templateUrl: 'partials/data-map.html'})
          .when('/chart/attachmentChart', {templateUrl: 'partials/chart.html', controller: 'AttachmentChartCtrl'});
    }])
//
    .run(['$templateCache', '$location', '$cookieStore', '$cookies', 'Constant', function ($templateCache, $location, $cookieStore, $cookies, Constant) {
      var searchObject = $location.hash() || $location.$$path;
      if (searchObject && searchObject.indexOf('server') >= 0) {
        var serverUrl = searchObject.substring(searchObject.indexOf('=') + 1);
        $cookieStore.put('server', serverUrl);
      }
      var serverUrl = $cookieStore.get('server');
      if (serverUrl) {
        Constant.serverUrl = serverUrl;
      }
      console.log(serverUrl);
//    $templateCache.put('partials/helloworld1.html',"<h1 style='color:blue;'>{{helloworld1}}</h1>");
    }]);
