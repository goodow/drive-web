'use strict';

/* Controllers */


angular.module('drive.controllers', [])
    .controller('MenuCtrl', ['$rootScope', '$scope', function ($rootScope, $scope) {
        var li1 = {"type": 'attachment', "name": '文档管理'};
        var li2 = {"type": 'attachmentActivity', "name": '文档行为管理'};
        var li3 = {"type": 'device', "name": '设备管理'};
        var li4 = {"type": 'deviceActivity', "name": '设备行为管理'};
        var menuList = [];
        menuList.push(li1);
        menuList.push(li2);
        menuList.push(li3);
        menuList.push(li4);
        $scope.menuList = menuList;

        $scope.setMenu = function (index) {
            menuList.forEach(function (item) {
                item.className_ = '';
            });
            $scope.menuList[index].className_ = 'active';
        }
    }])
    .controller('DateCtrl', ['$scope', '$routeParams', 'DataGridService', function ($scope, $routeParams, DataGridService) {
        $scope.currentPage = 1;

        var index = 'drive_test';

        var type = $routeParams.type;

        var bus = DataGridService;

        $scope.type = type;
        var pageSize = 5;
        var queryOptions = {
            action: 'search',
            _index: index,
            _type: type,
            source: {
                query: {
                    match_all: {

                    }
                },
                from: 0,
                size: pageSize
            }

        };
        $scope.queryMethod = function () {

            var queryFields = [];
            if (type == "deviceActivity") {
                queryFields = ["owner", "address", "deviceId"];
            } else if (type == "attachmentActivity") {
                queryFields = ["user^3", "title^2", "owner"];
            }
            var query = {};
            if($scope.queryString == null || $scope.queryString == ""){
                query = {
                    action: 'search',
                    _index: index,
                    _type: type,
                    source: {
                        query: {
                            match_all: {

                            }
                        },
                        from: 0,
                        size: pageSize
                    },
                    search_type: 'query_then_fetch',
                    scroll: '5m'
                };
            }else{
                query = {
                    action: 'search',
                    _index: index,
                    _type: type,
                    source: {
                        query: {
                            "multi_match": {
                                "query": $scope.queryString,
//                                "type": "best_fields",
                                "fields": queryFields
//                                "operator": "and"
                            },
                            from: 0,
                            size: pageSize
                        },
                        search_type: 'query_then_fetch',
                        scroll: '5m'
                    }
                }
            }
            bus.send('realtime.search', query, getData);
        }
        var getData = function (message) {
//            console.log(message);
            var datas = message.body().hits.hits;
//            console.log(datas);
            var myDatas = [];
            if ('attachment' == type || 'device' == type) {
                for (var n = 0; n < datas.length; n++) {
                    var myData = {};
                    myData._source = {"_id": datas[n]._id};
                    for (var o in datas[n]._source) {
                        myData._source[o] = datas[n]._source[o]
                    }
                    myDatas.push(myData)
                }
            } else {
                myDatas = datas;
            }

            if (datas.length !== 0) {
                $scope.$apply(function () {
                    $scope.datas = myDatas;
                    $scope.pageTotal = getPageTotal(Math.ceil(message.body().hits.total / pageSize), $scope.currentPage);
                });
            } else {
                //没有更多数据了,currentPage 已经加过1 不能再递增了,所以要减1来维持最大的页码,如果不减1,则currentPage会一直递增
                --$scope.currentPage;
            }

        }

        function secondsToHms(value) {
            var theTime = parseInt(value);// 秒
            var theTime1 = 0;// 分
            var theTime2 = 0;// 小时
            var theDay = 0;//天
            // alert(theTime);
            if (theTime > 60) {
                theTime1 = parseInt(theTime / 60);
                theTime = parseInt(theTime % 60);
                // alert(theTime1+"-"+theTime);
                if (theTime1 > 60) {
                    theTime2 = parseInt(theTime1 / 60);
                    theTime1 = parseInt(theTime1 % 60);
                    if (theTime2 > 24) {
                        theDay = parseInt(theTime2 / 24);
                        theTime2 = parseInt(theTime1 % 24);
                    }
                }
            }
            var result = "" + parseInt(theTime) + "秒";
            if (theTime1 > 0) {
                result = "" + parseInt(theTime1) + "分" + result;
            }
            if (theTime2 > 0) {
                result = "" + parseInt(theTime2) + "小时" + result;
            }
            if (theDay > 0) {
                result = "" + parseInt(theDay) + "天" + result;
            }
            return result;
        }

        var getPageTotal = function (totalPage, currentPage) {
            var outstr = [];
            var viewedCount = 5;

            function buildArray(i) {
                if (currentPage == i) {
                    outstr.push({"pageNo": i, "className_": 'btn-primary'});
                } else {
                    outstr.push({"pageNo": i, "className_": 'btn-default'});
                }
            }

            //init Pages
            var num2;
            if (totalPage > viewedCount) {
                num2 = viewedCount;
            } else {
                num2 = totalPage;
            }
            for (var i = 1; i <= num2; i++) {
                buildArray(i)
            }
            var num = Math.ceil(viewedCount / 2);
            if (currentPage >= num) {
                outstr = [];
                var temp = currentPage + num;
                if (temp > totalPage) {
                    for (var i = totalPage - viewedCount + 1; i <= totalPage; i++) {
                        buildArray(i);
                    }
                } else {
                    for (var i = currentPage - num + 1; i < temp; i++) {
                        buildArray(i);
                    }
                }
            }
            return outstr;
        }
        $scope.prePage = function () {
            if ($scope.currentPage <= 1) {
                $scope.currentPage = 1;
            }
            if ($scope.currentPage != 1) {
                $scope.currentPage--;
                queryOptions.source.from = ($scope.currentPage - 1) * pageSize;
                bus.send('realtime.search', queryOptions, getData);
            }
        }
        $scope.nextPage = function () {
            if ($scope.currentPage <= 1) {
                $scope.currentPage = 1;
            }
            $scope.currentPage++;
            queryOptions.source.from = ($scope.currentPage - 1) * pageSize;
            bus.send('realtime.search', queryOptions, getData);
        }
        $scope.gotoPage = function (pageNo) {
            if ($scope.currentPage <= 1) {
                $scope.currentPage = 1;
            }
            $scope.currentPage = pageNo;
            queryOptions.source.from = ($scope.currentPage - 1) * pageSize;
            bus.send('realtime.search', queryOptions, getData);
        }

        bus.send('realtime.search', queryOptions, getData);
        bus.registerHandler("@goodow.bus.onOpen", function(message) {
            console.log("Opened at: " + new Date().toString());
        });
        bus.registerHandler("@goodow.bus.onClose", function(message) {
            console.log("Closed at: " + new Date().toString());
        });
    }
    ])
;
