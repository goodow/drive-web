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
    })
    .directive('toast',['$timeout','$interval','$window',function($timeout,$interval,$window){
      var canDismiss = true;
      var linkFn = function(scope,elment,attr){
        elment.on('mouseover',function(){
          canDismiss = false;
        });
        elment.on('mouseout',function(){
          canDismiss = true;
        });
        var interval = $interval(function(){
          if(canDismiss){
            elment.remove();
            $interval.cancel(interval)
          }
        },2000)
      }
      return {
        restrict:'EA',
        transclude: true,
        templateUrl:'partials/messageDirective.html',
        compile:function(tElement, tAttrs, transclude){
          //屏幕可视区域宽高
          var height = $window.screen.height;
          var width = $window.screen.width;
          console.log(height+'---'+width);
          var eleWid = tElement[0].firstChild.offsetWidth;
          var eleHeight = tElement[0].firstChild.offsetHeight;
          tElement.find('div').css({
            top:(height-eleHeight)/2+'px',
            left:(width-eleWid)/2+'px'
          });
          return linkFn;
        }
      }
    }])
