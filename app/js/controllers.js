'use strict';

/* Controllers */


angular.module('drive.controllers',[])
    .controller('MenuCtrl',['$rootScope','$scope',function($rootScope,$scope){
      var li1 = {"type":'attachment',"name":'文档管理'};
      var li2 = {"type":'attachmentActivity',"name":'文档操作管理'};
      var li3 = {"type":'device',"name":'设备管理'};
      var li4 = {"type":'deviceActivity',"name":'设备操作管理'};
      var menuList = [];
//        menuList.push(li1);
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
    .controller('AttachmentActivityCtrl',['$scope','bus','Constant','PaginationService','millionFormat','$log','messageService',function($scope,bus,Constant,PaginationService,millionFormat,$log,messageService){

      var currentPage = 1;
      var size = 5;
      var index = 'drive_test';
      var type = 'attachmentActivity';
      var flag = true; //true向下翻，
      $scope.title = '文档操作管理';
      //两字段排序,如果open 与uid不能保持一至,则无法向上翻页
      var searchParam = {
        "action":'search',
        '_index':index,
        '_type':type,
        source:{
          sort:[
            '_uid'
          ],
          'size':size
        }
      };

      var getQueryString = function(keyword){
        var queryString = {match_all: {}};
        if(keyword != '' || keyword.length != 0){
          queryString =  {
            "multi_match" : {
              "query" : '"'+keyword+'"',
              "fields" : ["title", "user", "userId"]
            }
          }
        }
        return queryString;
      };

      var callback = function(message){
        var datas = message.body().hits.hits;
        if(!datas||datas.length == 0){
          messageService.toast('查询不到新数据哦！');
          --currentPage;
          return;
        }
        for(var i=0;i<datas.length;i++){
          datas[i]._source.duration = millionFormat(datas[i]._source.duration)
        }
        $scope.$apply(function(){
          if(!flag&&!$scope.search_tx){
            datas.reverse();
          }
          $scope.datas = datas;
        });
      };

      bus().send(Constant.search_channel,searchParam,callback);
      $scope.prePage = function(){
        if(currentPage <= 1){
          currentPage = 1;
        }

        if(currentPage == 1){
          messageService.toast('已经是第一页了哦！');
          return;
        }

        if(currentPage != 1){
          currentPage--;
        }
        flag = false;

        var getFirstItem = function(items){
          if(!items||!angular.isArray(items)||items.length == 0){
            return null;
          }
          return items[0];
        }
        //$scope.datas array clone
        var datas = angular.extend([],$scope.datas);
//            if(datas.length < size)
//                return;
        var first = getFirstItem(datas);
        if(first) {
          var querydsl = PaginationService.buildQuery({'_uid':type+'#'+first._id},null,5,false);
          if($scope.search_tx){
            querydsl = {
              query:getQueryString($scope.search_tx),
              from:  (currentPage - 1) * 5,
              size: 5
            };
          }else{
            querydsl.sort.pop();
            querydsl.sort.push({'_uid':'desc'})
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);
        }
      }
      $scope.nextPage = function(){
        if(currentPage <= 1){
          currentPage = 1;
        }

        flag = true;
        var getLastItem = function(items){
          if(!items||!angular.isArray(items)||items.length == 0){
            return null;
          }
          return items[size-1];
        }
        //$scope.datas array clone
        var datas = angular.extend([],$scope.datas)
        if(datas.length < size){
          messageService.toast('没有更多数据了哦！');
          return;
        }

        currentPage++;
        var last = getLastItem(datas);
        if(last){
          var querydsl = PaginationService.buildQuery({'_uid':type+'#'+last._id},null,5,true);
          if($scope.search_tx){
            querydsl = {
              query:getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel,searchParam,callback);

        }
      }
      $scope.searchClick = function(){
        flag = true;
        currentPage = 1;
        if($scope.search_tx){
          searchParam = {
                  action: 'search',
          _index: index,
          _type: type,
          source: {
            query:getQueryString($scope.search_tx),
            from: 0,
            size: 5
          },
          search_type: 'query_then_fetch',
          scroll: '5m'
          };
        }else{
          searchParam = {
            "action":'search',
            '_index':index,
            '_type':type,
            source:{
              sort:[
                {'open':"desc"},
                '_uid'
              ],
              'size':size
            }
          };
        }
        $log.log(JSON.stringify(searchParam));
        bus().send(Constant.search_channel, searchParam, callback);
      }
    }])
    .controller('DeviceActivityCtrl',['$scope','bus','Constant','PaginationService','millionFormat','$log','messageService',function($scope,bus,Constant,PaginationService,millionFormat,$log,messageService){
      var currentPage = 1;
      var size = 5;
      var index = 'drive_test';
      var type = 'deviceActivity';
      var flag = true; //true向下翻，
      $scope.title = '设备操作管理';
      var searchParam = {
        "action":'search',
        '_index':index,
        '_type':type,
        source:{
          sort:[
            '_uid'
          ],
          'size':size
        }
      };

      var getQueryString = function(keyword){
        var queryString = {match_all: {}};
        if(keyword != '' || keyword.length != 0){
          queryString =  {
            "multi_match" : {
              "query" : '"'+keyword+'"',
              "fields" : ["deviceId", "owner^2"]
            }
          }
        }
        return queryString;
      };

      var callback = function(message){
        var datas = message.body().hits.hits;
        if(!datas||datas.length == 0){
          messageService.toast('查询不到新数据哦！');
          --currentPage;
          return;
        }
        for(var i=0;i<datas.length;i++){
          datas[i]._source.duration = millionFormat(datas[i]._source.duration);
          datas[i]._source.状态 = 'action';
          datas[i]._source.操作 = 'action';
        }
        $scope.$apply(function(){
          if(!flag&&!$scope.search_tx){
            datas.reverse();
          }
          $scope.datas = datas;
        });
      };
      bus().send(Constant.search_channel,searchParam,callback);
      $scope.prePage = function(){
        if(currentPage <= 1){
          currentPage = 1;
        }
        if(currentPage == 1){
          messageService.toast('已经是第一页了哦！');
          return;
        }
        if(currentPage != 1){
          currentPage--;
        }
        flag = false;

        var getFirstItem = function(items){
          if(!items||!angular.isArray(items)||items.length == 0){
            return null;
          }
          return items[0];
        }
        //$scope.datas array clone
        var datas = angular.extend([],$scope.datas);
//            if(datas.length < size)
//                return;
        var first = getFirstItem(datas);
        if(first) {
          var querydsl = PaginationService.buildQuery({'_uid':type+'#'+first._id},null,5,false);
          if($scope.search_tx){
            querydsl = {
              query:getQueryString($scope.search_tx),
              from:  (currentPage - 1) * 5,
              size: 5
            };
          }else{
            querydsl.sort.pop();
            querydsl.sort.push({'_uid':'desc'})
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);
        }
      }
      $scope.nextPage = function(){
        if(currentPage <= 1){
          currentPage = 1;
        }
        flag = true;
        var getLastItem = function(items){
          if(!items||!angular.isArray(items)||items.length == 0){
            return null;
          }
          return items[size-1];
        }
        //$scope.datas array clone
        var datas = angular.extend([],$scope.datas)
        if(datas.length < size){
          messageService.toast('没有更多数据了哦！');
          return;
        }

        currentPage++;
        var last = getLastItem(datas);
        if(last){
          var querydsl = PaginationService.buildQuery({'_uid':type+'#'+last._id},null,5,true);
          if($scope.search_tx){
            querydsl = {
              query:getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel,searchParam,callback);

        }
      }
      $scope.searchClick = function(){
        flag = true;
        currentPage = 1;
        if($scope.search_tx){
          searchParam = {
            action: 'search',
            _index: index,
            _type: type,
            source: {
              query:getQueryString($scope.search_tx),
              from: 0,
              size: 5
            },
            search_type: 'query_then_fetch',
            scroll: '5m'
          };
        }else{
          searchParam = {
            "action":'search',
            '_index':index,
            '_type':type,
            source:{
              sort:[
                {"open":"desc"},
                "_uid"
              ],
              'size':size
            }
          };
        }
        $log.log(JSON.stringify(searchParam));
        bus().send(Constant.search_channel, searchParam, callback);
      }
    }])
    .controller('DeviceCtrl',['$scope','bus','Constant','PaginationService','millionFormat','$log','messageService',function($scope,bus,Constant,PaginationService,millionFormat,$log,messageService){
      var currentPage = 1;
      var size = 5;
      var index = 'drive_test';
      var type = 'device';
      var flag = true; //true向下翻，
      $scope.btnText = [];
      $scope.title = '设备管理';
      var searchParam = {
        "action":'search',
        '_index':index,
        '_type':type,
        source:{
          sort:[
            '_uid'
          ],
          'size':size
        }
      };

      var getQueryString = function(keyword){
        var queryString = {match_all: {}};
        if(keyword != '' || keyword.length != 0){
          queryString =  {
            "multi_match" : {
              "query" : '"'+keyword+'"',
              "fields" : ["deviceId", "owner^2"]
            }
          }
        }
        return queryString;
      };

      var callback = function(message){
        $scope.btnText = [];
        var datas = message.body().hits.hits;
        if(!datas||datas.length == 0){
          messageService.toast('查询不到新数据哦！');
          --currentPage;
          return;
        }

        for(var i=0;i<datas.length;i++){
          datas[i]._source._id = datas[i]._id;
        }

        $scope.$apply(function(){
          $scope.datas = datas;
          if(!flag&&!$scope.search_tx){
            datas.reverse();
          }
          var tableInfo = show(datas);
          //表头
          $scope.tableHeader = tableInfo.tableHeader;
          //表体
          $scope.tableBody = tableInfo.tableBody;
        });
      };

      var show = function (datas) {
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
            if(datas[i]._source.reset == 1){
              $scope.btnText.push('取消');
            }else{
              $scope.btnText.push('重置');
            }
          }
          return {
            tableHeader: dataHeader,
            tableBody: dataBody
          };
        }
      }

      bus().send(Constant.search_channel,searchParam,callback);
      $scope.prePage = function(){
        if(currentPage <= 1){
          currentPage = 1;
        }
        if(currentPage == 1){
          messageService.toast('已经是第一页了哦！');
          return;
        }
        if(currentPage != 1){
          currentPage--;
        }
        flag = false;

        var getFirstItem = function(items){
          if(!items||!angular.isArray(items)||items.length == 0){
            return null;
          }
          return items[0];
        }
        //$scope.datas array clone
        var datas = angular.extend([],$scope.datas);
//            if(datas.length < size)
//                return;
        var first = getFirstItem(datas);
        if(first) {
          var querydsl = PaginationService.buildQuery({'_uid':type+'#'+first._id},null,5,false);
          if($scope.search_tx){
            querydsl = {
              query:getQueryString($scope.search_tx),
              from:  (currentPage - 1) * 5,
              size: 5
            };
          }else{
            querydsl.sort.pop();
            querydsl.sort.push({'_uid':'desc'})
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);
        }
      }
      $scope.nextPage = function(){
        if(currentPage <= 1){
          currentPage = 1;
        }
        flag = true;
        var getLastItem = function(items){
          if(!items||!angular.isArray(items)||items.length == 0){
            return null;
          }
          return items[size-1];
        }
        //$scope.datas array clone
        var datas = angular.extend([],$scope.datas)
        if(datas.length < size){
          messageService.toast('没有更多数据了哦！');
          return;
        }

        currentPage++;
        var last = getLastItem(datas);
        if(last){
          var querydsl = PaginationService.buildQuery({'_uid':type+'#'+last._id},null,5,true);
          if($scope.search_tx){
            querydsl = {
              query:getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel,searchParam,callback);

        }
      }
      $scope.searchClick = function(){
        flag = true;
        currentPage = 1;
        if($scope.search_tx){
          searchParam = {
            action: 'search',
            _index: index,
            _type: type,
            source: {
              query:getQueryString($scope.search_tx),
              from: 0,
              size: 5
            },
            search_type: 'query_then_fetch',
            scroll: '5m'
          };
        }else{
          searchParam = {
            "action":'search',
            '_index':index,
            '_type':type,
            source:{
              sort:[
                {"open":"desc"},
                "_uid"
              ],
              'size':size
            }
          };
        }
        $log.log(JSON.stringify(searchParam));
        bus().send(Constant.search_channel, searchParam, callback);
      }

      $scope.resetClick = function(id,btnIndex){
        var getInfo = {
          action:'get',
          _index:index,
          _type:type,
          _id:id
        }
        bus().send(Constant.search_channel, getInfo, function(message){

          if($scope.btnText[btnIndex] == '重置'){
            message.body()._source.reset = 1;
          }else{
            message.body()._source.reset = 0;
          }
          var updateDevice = {
            action:'index',
            _index:index,
            _type:type,
            _id:message.body()._id,
            source:message.body()._source
          }
          bus().send(Constant.search_channel, updateDevice, function(message){
            console.log(message.body());
            $scope.$apply(function(){
              $scope.btnText[btnIndex] = $scope.btnText[btnIndex] == '重置'?'取消':'重置';
            });
          });
        });
      }

      //重置按钮样式
      $scope.resetBtn= function(value){
        if(value[1]==1)
          return "btn btn-default disabled"
        else
          return "btn btn-default";
      }
    }])
