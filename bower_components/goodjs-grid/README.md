drive-grid
===========

Installation
Installation is easy;download drive-table.js,include script file in you own html file like this:
<script src="Your file Path"></script>
then add dependencies on the goodow.ui.grid AngularJS module:

angular.module('yourModuleName',['goodow.ui.grid']);

First Step : create a controller(Name can not goodowGridController)
app.controller('Name',['$scope',function($scope){
    //important and necessary
    //witch ES index and type you would like to query
    $scope.index = '';
    $scope.type = '';
}]);

Second Step : write HTML like this:

 <div ng-controller = 'Name'>
 <div goodow-grid goodow-index='{{index}}' goodow-type='{{type}}'>
 </div>
 </div>



