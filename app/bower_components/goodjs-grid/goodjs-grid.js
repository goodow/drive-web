/**
 * Created by benjamin on 14-4-16.
 * Directive good-grid component
 * Desc : fetch content from backend ,and display data use table html element
 */
angular.module('good.ui.grid', [])
    .controller('goodGridController', ['$scope', '$attrs', '$log', '$element', function ($scope, $attrs, $log, $element) {


        /**
         * 将一种数据解析为header与body两种数据
         * @param data
         * @returns {{tableHeader: Array, tableBody: Array}}
         */
        function show(data) {
            var datas = JSON.parse(data);
            if (datas.length !== 0) {
                var dataHeader = [];
                var dataBody = [];
                var dataTr = [];
                for (var p in datas[0]._source) {
                    dataHeader.push(p);
                }
                for (var i = 0; i < datas.length; i++) {
                    for (var p in datas[i]._source) {
                        dataTr.push(datas[i]._source[p]);
                    }
                    dataBody.push(dataTr);
                    dataTr = [];
                }
                return {
                    tableHeader: dataHeader,
                    tableBody: dataBody
                };
            }
        }


        /**
         * 监听$scope的tableData属性变化时，将数据赋给$scope的tableHeader与tableBody属性
         */
        $scope.$watch('tableData', function (newValue, oldValue) {
            if (newValue !== oldValue && newValue !== "") {
                var tableInfo = show(newValue);
                //表头
                $scope.tableHeader = tableInfo.tableHeader;
                //表体
                $scope.tableBody = tableInfo.tableBody;
            }
        });


    }]).directive('goodGrid', function () {
        return {
            restrict: 'EA',
            templateUrl: 'template/good-grid.html',
            controller: 'goodGridController',
            scope: {
                tableData: '@'
            },
            replace: false
        }
    }).run(['$templateCache', function ($templateCache) {
        $templateCache.put('template/good-grid.html', '<table style="margin-bottom:0px"  class="table table-striped table-bordered table-hover table-condensed">' +
            '<tbody>' +
            '<tr><th ng-repeat="headerTh in tableHeader">{{headerTh}}</th></tr>' +
            '<tr ng-repeat="bodyTr in tableBody">' +
            '<th ng-repeat="bodyTd in bodyTr track by $index" >{{bodyTd}}</th>' +
            '</tr></tbody> </table>')
    }]);

