'use strict';

/* Controllers */


angular.module('drive.controllers',[])
    .controller('MenuCtrl',['$rootScope','$scope',function($rootScope,$scope){
        var li1 = {"type":'attachment',"name":'文档管理'};
        var li2 = {"type":'attachmentActivity',"name":'文档行为管理'};
        var li3 = {"type":'device',"name":'设备管理'};
        var li4 = {"type":'deviceActivity',"name":'设备行为管理'};
        var menuList = [];
        menuList.push(li1);
        menuList.push(li2);
        menuList.push(li3);
        menuList.push(li4);
        $scope.menuList = menuList;

        $scope.setMenu = function(index) {
            menuList.forEach(function(item){
                item.className_ = '';
            });
            $scope.menuList[index].className_ = 'active';
        }
    }])
    .controller('DateCtrl',['$scope', '$routeParams','DataGridService',function($scope,$routeParams,DataGridService){
        $scope.currentPage = 1;
        var index = 'drive_test';
        var type = $routeParams.type;
        $scope.type = type;
        var pageSize = 5;
        var getData = function(message){
            var datas = message.body().hits.hits;
            var myDatas = [];
            if('attachment' == type || 'device' == type){
                for(var n = 0; n < datas.length; n++){
                    var myData = {};
                    myData._source = {"_id":datas[n]._id};
                    for(var o in datas[n]._source){
                        myData._source[o] = datas[n]._source[o]
                    }
                    myDatas.push(myData)
                }
            }else{
                myDatas = datas;
            }
            if(datas.length !== 0){
                $scope.$apply(function(){
                    $scope.datas = myDatas;
                    $scope.pageTotal = getPageTotal(Math.ceil(message.body().hits.total/pageSize) , $scope.currentPage);
                });
            }else{
                //没有更多数据了,currentPage 已经加过1 不能再递增了,所以要减1来维持最大的页码,如果不减1,则currentPage会一直递增
                 --$scope.currentPage;
            }
        }
        var getPageTotal = function(totalPage,currentPage){
            var outstr = [];
            var viewedCount = 5;
            function buildArray(i){
                if(currentPage == i){
                    outstr.push({"pageNo":i,"className_":'btn-primary'});
                }else{
                    outstr.push({"pageNo":i,"className_":'btn-default'});
                }
            }
            //init Pages
            var num2;
            if(totalPage>viewedCount){
                num2 = viewedCount;
            }else{
                num2 = totalPage;
            }
            for(var i=1;i<=num2 ;i++){
                buildArray(i)
            }
            var num = Math.ceil(viewedCount/2);
            if(currentPage >= num){
                outstr = [];
                var temp = currentPage+num;
                if(temp>totalPage){
                    for(var i=totalPage-viewedCount+1;i<=totalPage;i++){
                        buildArray(i);
                    }
                }else{
                    for(var i=currentPage-num+1;i<temp;i++){
                        buildArray(i);
                    }
                }
            }
            return outstr;
        }
        $scope.prePage = function(){
            if($scope.currentPage <= 1){
                $scope.currentPage = 1;
            }
            if($scope.currentPage != 1){
                $scope.currentPage--;
                DataGridService.getData(index,type,$scope.currentPage,pageSize ,getData);
            }
        }
        $scope.nextPage = function(){
            if($scope.currentPage <= 1){
                $scope.currentPage = 1;
            }
            $scope.currentPage++;
            DataGridService.getData(index,type,$scope.currentPage,pageSize ,getData);
        }
        $scope.gotoPage = function(pageNo){
            if($scope.currentPage <= 1){
                $scope.currentPage = 1;
            }
            $scope.currentPage = pageNo;
            DataGridService.getData(index,type,$scope.currentPage,pageSize ,getData);
        }
        DataGridService.getData(index,type,1,pageSize ,getData);
    }]);
