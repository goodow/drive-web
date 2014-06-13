'use strict';

/* Controllers */


angular.module('drive.controllers', [])
    .controller('HeadCtrl', ['$rootScope', '$scope','HeadData', function ($rootScope, $scope, HeadData) {
      $scope.headList = HeadData;
      $scope.setHead = function (index) {
        HeadData.forEach(function (item) {
          item.className_ = '';
        });
        HeadData[index].className_ = 'active';
        $scope.headList = HeadData;
      }
    }])
    .controller('MenuCtrl', ['$rootScope', '$scope', 'HeadData', function ($rootScope, $scope, HeadData) {
      $scope.headList = HeadData;
      //监听service的变化
      $scope.$watch('headList', function(newVal, oldVal) {
        HeadData.forEach(function (item) {
          if(item.className_ == 'active'){
            $scope.menuList = item.menu;
          }
        });
      }, true);
      $scope.setMenu = function (index) {
        $scope.menuList.forEach(function (item) {
          item.className_ = '';
        });
        $scope.menuList[index].className_ = 'active';
      }
    }])
    .controller('AttachmentActivityCtrl', ['$scope', 'bus', 'Constant', 'PaginationService', 'millionFormat', '$log', 'messageService', function ($scope, bus, Constant, PaginationService, millionFormat, $log, messageService) {

      var currentPage = 1;
      var size = 5;
      var index = 'drive_test';
      var type = 'attachmentActivity';
      var flag = true; //true向下翻，
      $scope.title = '文档操作管理';
      //两字段排序,如果open 与uid不能保持一至,则无法向上翻页
      var searchParam = {
        "action": 'search',
        '_index': index,
        '_type': type,
        source: {
          sort: [
            '_uid'
          ],
          'size': size
        }
      };

      var getQueryString = function (keyword) {
        var queryString = {match_all: {}};
        if (keyword != '' || keyword.length != 0) {
          queryString = {
            "multi_match": {
              "query": '"' + keyword + '"',
              "fields": ["title", "user", "userId"]
            }
          }
        }
        return queryString;
      };

      var callback = function (message) {
        var datas = message.body().hits.hits;
        if (!datas || datas.length == 0) {
          messageService.toast('查询不到新数据哦！');
          --currentPage;
          return;
        }
        for (var i = 0; i < datas.length; i++) {
          datas[i]._source.duration = millionFormat(datas[i]._source.duration)
        }
        $scope.$apply(function () {
          if (!flag && !$scope.search_tx) {
            datas.reverse();
          }
          $scope.datas = datas;

          if (datas.length !== 0) {
            var dataHeader = [];
            var dataBody = [];
            var dataTr = [];
            for (var p in datas[0]._source) {
              switch (p) {
                case "attachmentId":
                  p = "文件编码";
                  break;
                case "open":
                  p = "打开时间";
                  break;
                case "duration":
                  p = "持续时间";
                  break;
                case "userId":
                  p = "设备MAC";
                  break;
                case "title":
                  p = "文件标题";
                  break;
                case "user":
                  p = "所属校园";
                  break;
              }
              dataHeader.push(p);
            }
            for (var i = 0; i < datas.length; i++) {
              for (var p in datas[i]._source) {
                dataTr.push(datas[i]._source[p]);
              }
              dataBody.push(dataTr);
              dataTr = [];
            }
            $scope.tableHeader = dataHeader;
            $scope.tableBody = dataBody;
          }

        });
      };

      bus().send(Constant.search_channel, searchParam, callback);
      $scope.prePage = function () {
        if (currentPage <= 1) {
          currentPage = 1;
        }

        if (currentPage == 1) {
          messageService.toast('已经是第一页了哦！');
          return;
        }

        if (currentPage != 1) {
          currentPage--;
        }
        flag = false;

        var getFirstItem = function (items) {
          if (!items || !angular.isArray(items) || items.length == 0) {
            return null;
          }
          return items[0];
        }
        //$scope.datas array clone
        var datas = angular.extend([], $scope.datas);
//            if(datas.length < size)
//                return;
        var first = getFirstItem(datas);
        if (first) {
          var querydsl = PaginationService.buildQuery({'_uid': type + '#' + first._id}, null, 5, false);
          if ($scope.search_tx) {
            querydsl = {
              query: getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          } else {
            querydsl.sort.pop();
            querydsl.sort.push({'_uid': 'desc'})
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);
        }
      }
      $scope.nextPage = function () {
        if (currentPage <= 1) {
          currentPage = 1;
        }

        flag = true;
        var getLastItem = function (items) {
          if (!items || !angular.isArray(items) || items.length == 0) {
            return null;
          }
          return items[size - 1];
        }
        //$scope.datas array clone
        var datas = angular.extend([], $scope.datas)
        if (datas.length < size) {
          messageService.toast('没有更多数据了哦！');
          return;
        }

        currentPage++;
        var last = getLastItem(datas);
        if (last) {
          var querydsl = PaginationService.buildQuery({'_uid': type + '#' + last._id}, null, 5, true);
          if ($scope.search_tx) {
            querydsl = {
              query: getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);

        }
      }
      $scope.searchClick = function () {
        flag = true;
        currentPage = 1;
        if ($scope.search_tx) {
          searchParam = {
            action: 'search',
            _index: index,
            _type: type,
            source: {
              query: getQueryString($scope.search_tx),
              from: 0,
              size: 5
            },
            search_type: 'query_then_fetch',
            scroll: '5m'
          };
        } else {
          searchParam = {
            "action":'search',
            '_index':index,
            '_type':type,
            source:{
              sort:[
//                {'open':"desc"},
                '_uid'
              ],
              'size': size
            }
          };
        }
        $log.log(JSON.stringify(searchParam));
        bus().send(Constant.search_channel, searchParam, callback);
      }
    }])
    .controller('DeviceActivityCtrl', ['$scope', 'bus', 'Constant', 'PaginationService', 'millionFormat', '$log', 'messageService', function ($scope, bus, Constant, PaginationService, millionFormat, $log, messageService) {
      var currentPage = 1;
      var size = 5;
      var index = 'drive_test';
      var type = 'deviceActivity';
      var flag = true; //true向下翻，
      $scope.title = '设备操作管理';
      var searchParam = {
        "action": 'search',
        '_index': index,
        '_type': type,
        source: {
          sort: [
            '_uid'
          ],
          'size': size
        }
      };

      var getQueryString = function (keyword) {
        var queryString = {match_all: {}};
        if(keyword != '' || keyword.length != 0){
          queryString =  {
            "multi_match" : {
              "query" : '"'+keyword+'"',
              "fields" : ["deviceId","address", "user^2"]
            }
          }
        }
        return queryString;
      };

      var callback = function (message) {
        var datas = message.body().hits.hits;
        if (!datas || datas.length == 0) {
          messageService.toast('查询不到新数据哦！');
          --currentPage;
          return;
        }
        for (var i = 0; i < datas.length; i++) {
          datas[i]._source.duration = millionFormat(datas[i]._source.duration);
          datas[i]._source.radius = Math.round(datas[i]._source.radius);
        }
        $scope.$apply(function () {
          if (!flag && !$scope.search_tx) {
            datas.reverse();
          }
          $scope.datas = datas;

          if (datas.length !== 0) {
            var dataHeader = [];
            var dataBody = [];
            var dataTr = [];
            for (var p in datas[0]._source) {
              switch (p) {
                case "code":
                  p = "编码";
                  break;
                case "deviceId":
                  p = "MAC地址";
                  break;
                case "user":
                  p = "学校";
                  break;
                case "address":
                  p = "地址";
                  break;
                case "open":
                  p = "开机时间";
                  break;
                case "duration":
                  p = "持续时间";
                  break;
                case "coordinates":
                  p = "经纬度";
                  break;
                case "radius":
                  p = "精度";
                  break;

              }
              dataHeader.push(p);
            }
            for (var i = 0; i < datas.length; i++) {
              for (var p in datas[i]._source) {
                dataTr.push(datas[i]._source[p]);
              }
              dataBody.push(dataTr);
              dataTr = [];
            }
            $scope.tableHeader = dataHeader;
            $scope.tableBody = dataBody;
          }

        });
      };
      $log.log(JSON.stringify(searchParam));
      bus().send(Constant.search_channel,searchParam,callback);
      $scope.prePage = function(){
        if(currentPage <= 1){
          currentPage = 1;
        }
        if (currentPage == 1) {
          messageService.toast('已经是第一页了哦！');
          return;
        }
        if (currentPage != 1) {
          currentPage--;
        }
        flag = false;

        var getFirstItem = function (items) {
          if (!items || !angular.isArray(items) || items.length == 0) {
            return null;
          }
          return items[0];
        }
        //$scope.datas array clone
        var datas = angular.extend([], $scope.datas);
//            if(datas.length < size)
//                return;
        var first = getFirstItem(datas);
        if (first) {
          var querydsl = PaginationService.buildQuery({'_uid': type + '#' + first._id}, null, 5, false);
          if ($scope.search_tx) {
            querydsl = {
              query: getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          } else {
            querydsl.sort.pop();
            querydsl.sort.push({'_uid': 'desc'})
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);
        }
      }
      $scope.nextPage = function () {
        if (currentPage <= 1) {
          currentPage = 1;
        }
        flag = true;
        var getLastItem = function (items) {
          if (!items || !angular.isArray(items) || items.length == 0) {
            return null;
          }
          return items[size - 1];
        }
        //$scope.datas array clone
        var datas = angular.extend([], $scope.datas)
        if (datas.length < size) {
          messageService.toast('没有更多数据了哦！');
          return;
        }

        currentPage++;
        var last = getLastItem(datas);
        if (last) {
          var querydsl = PaginationService.buildQuery({'_uid': type + '#' + last._id}, null, 5, true);
          if ($scope.search_tx) {
            querydsl = {
              query: getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);

        }
      }
      $scope.searchClick = function () {
        flag = true;
        currentPage = 1;
        if ($scope.search_tx) {
          searchParam = {
            action: 'search',
            _index: index,
            _type: type,
            source: {
              query: getQueryString($scope.search_tx),
              from: 0,
              size: 5
            },
            search_type: 'query_then_fetch',
            scroll: '5m'
          };
        } else {
          searchParam = {
            "action":'search',
            '_index':index,
            '_type':type,
            source:{
              sort:[
//                {"open":"desc"},
                "_uid"
              ],
              'size': size
            }
          };
        }
        $log.log(JSON.stringify(searchParam));
        bus().send(Constant.search_channel, searchParam, callback);
      }
    }])
    .controller('DeviceCtrl', ['$scope', 'bus', 'Constant', 'PaginationService', 'millionFormat', '$log', 'messageService', function ($scope, bus, Constant, PaginationService, millionFormat, $log, messageService) {
      var currentPage = 1;
      var size = 5;
      var index = 'drive_test';
      var type = 'device';
      var flag = true; //true向下翻，
      $scope.loadingStatus = new Array(new Array(),new Array());
      $scope.btnStatus = new Array(new Array(),new Array());
      $scope.btnText = []; //操作按钮文字
      $scope.statusText = []; //设备状态
      $scope.title = '设备管理';
      var searchParam = {
        "action": 'search',
        '_index': index,
        '_type': type,
        source: {
          sort: [
            '_uid'
          ],
          'size': size
        }
      };

      var getQueryString = function (keyword) {
        var queryString = {match_all: {}};
        if(keyword != '' || keyword.length != 0){
          queryString =  {
            "multi_match" : {
              "query" : '"'+keyword+'"',
              "fields" : [ "owner^2", "registAddress"]
            }
          }
        }
        return queryString;
      };

      var callback = function(message){

        var datas = message.body().hits.hits;
        if (!datas || datas.length == 0) {
          messageService.toast('查询不到新数据哦！');
          --currentPage;
          return;
        }

//        for(var i=0;i<datas.length;i++){
//          datas[i]._source._id = datas[i]._id;
//        }

        $scope.$apply(function () {
          $scope.datas = datas;
          if (!flag && !$scope.search_tx) {
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
          var dataHeader = ["MAC地址"];
          var dataBody = [];
          var dataTr = [];
          for (var p in datas[0]._source) {
            switch (p){
              case "code":
                dataHeader.push("设备编码");
                break;
              case "owner":
                dataHeader.push('使用学校');
                break;
              case "contact":
                dataHeader.push('联系方式');
                break;
              case "registAddress":
                dataHeader.push('注册地址');
                break;
            }
          }
          for (var i = 0; i < datas.length; i++) {
            dataTr.push(datas[i]._id);
            for (var p in datas[i]._source) {
              if(p == "reset" || p == "lock" || p == "registCoordinates" || p =="radius")break;
              dataTr.push(datas[i]._source[p]);
            }
            dataBody.push(dataTr);
            dataTr = [];
            if(datas[i]._source.reset == 1){
              $scope.btnText[i] = '取消';
            }else{
              $scope.btnText[i] = '重置';
            }
            if(datas[i]._source.lock == 0){
              $scope.statusText[i] = '锁定';
            }else{
              $scope.statusText[i] = '解锁';
            }
            $scope.loadingStatus[i] = new Array();
            $scope.btnStatus[i] = new Array();
            $scope.loadingStatus[i][0] = false;
            $scope.loadingStatus[i][1] = false;
            $scope.btnStatus[i][0] = true;
            $scope.btnStatus[i][1] = true;
          }
          return {
            tableHeader: dataHeader,
            tableBody: dataBody
          };
        }
      }

      bus().send(Constant.search_channel, searchParam, callback);
      $scope.prePage = function () {
        if (currentPage <= 1) {
          currentPage = 1;
        }
        if (currentPage == 1) {
          messageService.toast('已经是第一页了哦！');
          return;
        }
        if (currentPage != 1) {
          currentPage--;
        }
        flag = false;

        var getFirstItem = function (items) {
          if (!items || !angular.isArray(items) || items.length == 0) {
            return null;
          }
          return items[0];
        }
        //$scope.datas array clone
        var datas = angular.extend([], $scope.datas);
//            if(datas.length < size)
//                return;
        var first = getFirstItem(datas);
        if (first) {
          var querydsl = PaginationService.buildQuery({'_uid': type + '#' + first._id}, null, 5, false);
          if ($scope.search_tx) {
            querydsl = {
              query: getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          } else {
            querydsl.sort.pop();
            querydsl.sort.push({'_uid': 'desc'})
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);
        }
      }
      $scope.nextPage = function () {
        if (currentPage <= 1) {
          currentPage = 1;
        }
        flag = true;
        var getLastItem = function (items) {
          if (!items || !angular.isArray(items) || items.length == 0) {
            return null;
          }
          return items[size - 1];
        }
        //$scope.datas array clone
        var datas = angular.extend([], $scope.datas)
        if (datas.length < size) {
          messageService.toast('没有更多数据了哦！');
          return;
        }

        currentPage++;
        var last = getLastItem(datas);
        if (last) {
          var querydsl = PaginationService.buildQuery({'_uid': type + '#' + last._id}, null, 5, true);
          if ($scope.search_tx) {
            querydsl = {
              query: getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);

        }
      }
      $scope.searchClick = function () {
        flag = true;
        currentPage = 1;
        if ($scope.search_tx) {
          searchParam = {
            action: 'search',
            _index: index,
            _type: type,
            source: {
              query: getQueryString($scope.search_tx),
              from: 0,
              size: 5
            },
            search_type: 'query_then_fetch',
            scroll: '5m'
          };
        } else {
          searchParam = {
            "action":'search',
            '_index':index,
            '_type':type,
            source:{
              sort:[
                "_uid"
              ],
              'size': size
            }
          };
        }
        $log.log(JSON.stringify(searchParam));
        bus().send(Constant.search_channel, searchParam, callback);
      }

      $scope.resetClick = function(id,btnIndex,btnPara){
        $scope.loadingStatus[btnIndex][btnPara] = !$scope.loadingStatus[btnIndex][btnPara];
        $scope.btnStatus[btnIndex][btnPara] = !$scope.btnStatus[btnIndex][btnPara];
        var getInfo = {
          action: 'get',
          _index: index,
          _type: type,
          _id: id
        }
        bus().send(Constant.search_channel, getInfo, function(message){
          if(btnPara == 0){
            message.body()._source.lock = $scope.statusText[btnIndex] == '锁定'?1:0;
          }else{
            message.body()._source.reset = $scope.btnText[btnIndex] == '重置'?1:0;
          }

          var updateDevice = {
            action: 'index',
            _index: index,
            _type: type,
            _id: message.body()._id,
            source: message.body()._source
          }
          console.log(updateDevice);
          bus().send(Constant.search_channel, updateDevice, function(message){
            console.log(message.body());
            $scope.$apply(function(){
              $scope.loadingStatus[btnIndex][btnPara] = !$scope.loadingStatus[btnIndex][btnPara];
              $scope.btnStatus[btnIndex][btnPara] = !$scope.btnStatus[btnIndex][btnPara];
              if(btnPara == 0){
                $scope.statusText[btnIndex] = $scope.statusText[btnIndex] == '锁定'?'解锁':'锁定';
              }else{
                $scope.btnText[btnIndex] = $scope.btnText[btnIndex] == '重置'?'取消':'重置';
              }
            });
          });
        });
      }
    }])
    .controller('AttachmentCtrl',['$scope','bus','Constant','PaginationService','millionFormat','$log','messageService',function($scope,bus,Constant,PaginationService,millionFormat,$log,messageService){
      var currentPage = 1;
      var size = 5;
      var index = 'drive_test';
      var type = 'attachment';
      var flag = true; //true向下翻，
      $scope.deviceOpen = []; // 设备总数
      $scope.deviceData = []; //播放设备详情
      $scope.openCount = []; //播放次数
      $scope.openTime = []; //播放时长
      $scope.title = '文档播放统计哦';
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
              "fields" : [ "title^2", "tags"]
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
          var dataHeader = ["文档编号"];
          var dataBody = [];
          var dataTr = [];
          for (var p in datas[0]._source) {
            switch (p){
              case "title":
                dataHeader.push("文档标题");
                break;
              case "contentType":
                dataHeader.push('文档类型');
                break;
            }
          }

          for (var i = 0; i < datas.length; i++) {
            dataTr.push(datas[i]._id);
            for (var p in datas[i]._source) {
              if(p == "contentLength" || p == "url" || p == "thumbnail" || p =="tags")break;
              if(p == "contentType"){
                dataTr.push(datas[i]._source[p].split("/")[datas[i]._source[p].split("/").length-1])
              }else{
                dataTr.push(datas[i]._source[p]);
              }
            }
            dataBody.push(dataTr);
            getOpenDeviceByFile(i,datas[i]._id);
            dataTr = [];
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
                "_uid"
              ],
              'size':size
            }
          };
        }
        $log.log(JSON.stringify(searchParam));
        bus().send(Constant.search_channel, searchParam, callback);
      }

      //某个设备上，某个文件播放次数
      var getDeviceOpenCount = function(userId, attachmentId){
        var source = {
          "query": {
            "bool": {
              "must": [
                {
                  "term": {
                    "userId": userId
                  }
                },
                {
                  "term": {
                    "attachmentId": attachmentId
                  }
                }
              ]
            }
          },
          "from":0,
          "size":0
        };
        var getDeviceOpen = {
          "action":'search',
          '_index':index,
          '_type':"attachmentActivity",
          source:source
        };
        bus().send(Constant.search_channel, getDeviceOpen, function(message){
          $scope.$apply(function(){
            $scope.deviceOpen.push(message.body().hits.total);
          });
        });
      }

      //根据文件获取播放过的设备
      var getOpenDeviceByFile = function(lineNo,attachmentId) {
        var source = {
          "size" : 0,
          "query" : {
            "term" : { "attachmentId" : attachmentId }
          },
          "facets" : {
            "tag" : {
              "terms" : {
                "fields" : ["userId"],
                "size" :100000000
              }
            }
          }
        }
        var getDevices = {
          "action":'search',
          '_index':index,
          '_type':"attachmentActivity",
          source:source
        };
        bus().send(Constant.search_channel, getDevices, function(message){
          var Data = message.body().facets.tag.terms;
          var openCount = 0;
          for(var i = 0; i < Data.length; i++){
            openCount = openCount+Data[i].count;
          }
          $scope.$apply(function(){
            $scope.deviceData[lineNo] = Data;
            $scope.deviceOpen[lineNo] = Data.length;
            $scope.openCount[lineNo] = openCount;
          });
        });
      }

      $scope.detailClick = function(btnIndex){
        var toastStr = "";
        var data = $scope.deviceData[btnIndex];
        for(var o in data){
          toastStr = toastStr+"设备号:"+data[o].term+"  播放数:"+data[o].count +"</br>";
        }
        messageService.toast(toastStr);
      }

    }])
    .controller('AttachmentChartCtrl', ['$rootScope', '$scope','bus','Constant','DateService', function ($rootScope, $scope,bus,Constant,DateService) {
      var index = "drive_test";
      $scope.data = {
        series: ['所有文件播放次数'],
        data : []
      }

      var getData = function(dateIndex){
        var date = DateService.getWeekDate(dateIndex);
        var source = {
          "size": 0,
          "query": {
            "range" : {
              "open" : {
                "gte" : date,
                "lte" : date
              }
            }
          },
          "facets": {
            "tag": {
              "terms": {
                "fields": [
                  "attachmentId"
                ],
                "size": 3
              }
            }
          }
        };
        var getAttachmentActivity = {
          "action":'search',
          '_index':index,
          '_type':"attachmentActivity",
          source:source
        };
        bus().send(Constant.search_channel, getAttachmentActivity, function(message){
          var totalCount = message.body().hits.total;
          var otherCount = message.body().facets.tag.terms;
          $scope.$apply(function(){
            $scope.data.data[dateIndex-1] = {
              x : DateService.getFormatDate(new Date(date)),
              y: [totalCount]
            };
          });
        });
      }

      for(var n = 1; n < 8; n++){
        getData(n);
      }

      $scope.chartType = 'line';

      $scope.config = {
        labels: false,
        title : "文件播放统计图 第 " + DateService.getWeekNo() + " 周",
        legend : {
          display:true,
          position:'right'
        },
        lineLegend: 'traditional'
      };
    }])
    .controller('DeviceChartCtrl', ['$rootScope', '$scope','bus','Constant','DateService', function ($rootScope, $scope,bus,Constant,DateService) {
      var index = "drive_test";
      $scope.data = {
        series: ['所有设备开机次数'],
        data : []
      }

      var getData = function(dateIndex){
        var date = DateService.getWeekDate(dateIndex);
        var source = {
          "size": 0,
          "query": {
            "range" : {
              "open" : {
                "gte" : date,
                "lte" : date
              }
            }
          },
          "facets": {
            "tag": {
              "terms": {
                "fields": [
                  "deviceId"
                ],
                "size": 3
              }
            }
          }
        };
        var getDeviceActivity = {
          "action":'search',
          '_index':index,
          '_type':"deviceActivity",
          source:source
        };
        bus().send(Constant.search_channel, getDeviceActivity, function(message){
          var totalCount = message.body().hits.total;
          var otherCount = message.body().facets.tag.terms;
          $scope.$apply(function(){
            $scope.data.data[dateIndex-1] = {
              x : DateService.getFormatDate(new Date(date)),
              y: [totalCount]
            };
          });
        });
      }

      for(var n = 1; n < 8; n++){
        getData(n);
      }


      //线性表显示
      $scope.chartType = 'line';

      $scope.config = {
        labels: false,
        title : "设备开机统计图 第 " + DateService.getWeekNo() + " 周",
        legend : {
          display:true,
          position:'right'
        },
        lineLegend: 'traditional'
      };
    }])
