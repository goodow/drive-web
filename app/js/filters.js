'use strict';

/* Filters */

angular.module('drive.filters', [])
.filter('interpolate', ['version', function(version) {
     return function(text) {
       return String(text).replace(/\%VERSION\%/mg, version);
     }
   }]);
