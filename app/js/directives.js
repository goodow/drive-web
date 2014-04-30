'use strict';

/* Directives */


angular.module('drive.directives', ['drive.controllers'])
.directive('helloworld', function() {
    return {
        restrict:'E',
        controller:'Ctrl2',
        replace:'true',
        templateUrl:'partials/helloworldDirective.html'
    }
  });
