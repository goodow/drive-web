'use strict';

/* Services */



angular.module('drive.services', [])
  .factory('bus', ['$window','Constant',function($window,Constant){
      var  options = {debug:true, forkLocal:true};
      var serverUrl = Constant.serverUrl;
      var bus = new $window.good.channel.WebSocketBus(serverUrl,options);
      return function(){
          return bus;
      }
  }])
  .factory('HeadData', function(){
      var DashBoard = [{"type": 'attachmentBoard', "name": '文档统计'},{"type": 'deviceBoard', "name": '设备统计'}];
      var SystemManage = [{"type": 'attachment', "name": '文档播放统计'},{"type": 'attachmentActivity', "name": '文档操作管理'},{"type": 'device', "name": '设备管理'},{"type": 'deviceActivity', "name": '设备操作管理'},{"type": 'devicestatus', "name": '设备在线显示'}];
      var UserManage = [{"type": 'user1', "name": '用户管理1'},{"type": 'user2', "name": '用户管理2'}];
      var ProfileManage = [{"type": 'profile1', "name": '个人中心1'},{"type": 'profile2', "name": '个人中心2'}];
      var li1 = {"menu": DashBoard, "name": '统计报表', "className_":'active'};
      var li2 = {"menu": SystemManage, "name": '系统管理', "className_":''};
      var li3 = {"menu": UserManage, "name": '用户管理', "className_":''};
      var li4 = {"menu": ProfileManage, "name": '个人中心', "className_":''};

      var headList = [];
      headList.push(li1);
      headList.push(li2);
      headList.push(li3);
      headList.push(li4);
      return headList;
  })
  .factory('millionFormat',function(){
        return function(value){
            var theTime = parseInt(value);// 秒
            var theTime1 = 0;// 分
            var theTime2 = 0;// 小时
            var theDay = 0;//天
            if(theTime > 60) {
                theTime1 = parseInt(theTime/60);
                theTime = parseInt(theTime%60);
                if(theTime1 > 60) {
                    theTime2 = parseInt(theTime1/60);
                    theTime1 = parseInt(theTime1%60);
                    if(theTime2 > 24){
                        theDay = parseInt(theTime2/24);
                        theTime2 = parseInt(theTime1%24);
                    }
                }
            }
            var result = ""+parseInt(theTime)+"秒";
            if(theTime1 > 0) {
                result = ""+parseInt(theTime1)+"分"+result;
            }
            if(theTime2 > 0) {
                result = ""+parseInt(theTime2)+"小时"+result;
            }
            if(theDay > 0) {
                result = ""+parseInt(theDay)+"天"+result;
            }
            return result;
        };
    })
  .factory('Constant', function(){
      return {
          host:'test.goodow.com',
          search_channel:'realtime.search',
          serverUrl:"http://test.goodow.com:1986/channel"
      }
  })
    .factory('PaginationService',function(){
        //两个字段分页
       var paginationQuery2 = {
           'query':{
               "bool": {
                   "should": [
                       {
                           "bool": {
                               "must": [
                                   {
                                       "term": {
//                                           "open": "2014-11-15T14:12:12"
                                       }
                                   },
                                   {
                                       "range": {
//                                           "_uid": {
//                                               "gt": "attachmentActivity#D19cnQA2Q-OHkspewvHpEg"
//                                           }
                                       }
                                   }
                               ]
                           }
                       },
                       {
                           "range": {
//                               "open": {
//                                   "lt": "2014-11-15T14:12:12"
//                               }
                           }
                       }
                   ],
                   "minimum_should_match": 1
               }
           },
           "size": 5,
           "sort": [
//               {
//                   "open": "desc"
//               },
//               "_uid"
           ]
       };
        //1个字段分页
        var paginationQuery1 = {
            'query':{
                'bool':{
                    'must':[{
                        "range": {
//                     "_uid": {
//                     "gt": "attachmentActivity#D19cnQA2Q-OHkspewvHpEg"
                         }
                    }
//        ,{
//            'multi_match':{
//                query:queryString,
//                field:[]
//            }
//        }
        ]
    }

            },
            "size": 5,
            "sort": [
//               "_uid"
            ]
        };
        return {
//            sort:function(arr){
//                for(var i=0;i<arr.length;i++){
//                    pagnationQueryDSL.sort[i] = arr[i];
//                }
//                return this;
//            },
//            size:function(num){
//                pagnationQueryDSL.size = num;
//                return this;
//            },
//            setFieldAndValue:function(){
//                var arg1 = arguments[0];
//                for(var prop in arg1){
//                    this.must()
//                }
//            },
//            must:function(arr){
//                for(var i=0;i<arr.length;i++){
//                    pagnationQueryDSL['query']['bool']['should'][0]['bool']['must'][i] = arr[i];
//                }
//                return this;
//            },
//            should:function(obj){
//                pagnationQueryDSL['query']['bool']['should'][1] = obj;
//                return this;
//            },
//            value:function(){
//                return pagnationQueryDSL;
//            }

            //field2与size参数是可选参数
            //size如果不传就是默认值5代表每页返回的数量
            //如果没有值可以传,就传null,
            //true与false是排序,true是升序,false是降序
            //buildQuery({_uid:2532342324},null,null,true)
            buildQuery:function(field1,field2,size,bool){
                if(size){
                    paginationQuery1.size = size;
                    paginationQuery2.size = size;
                }
                if(field2){
                   if(bool){
                       //验证 正确
                       for(var prop  in field1){
                           paginationQuery2['query']['bool']['should'][0]['bool']['must'][0]['term'][prop] = field1[prop];
                           paginationQuery2['sort'][0] = prop;
                           var obj1 = {};
                           obj1['gt'] =  field1[prop];
                           paginationQuery2['query']['bool']['should'][1]['range'][prop] = obj1;
                           for(var prop1 in field2){
                               paginationQuery2['sort'][1] = prop1;
                               var obj = {};
                               obj['gt'] = field2[prop1];
                               paginationQuery2['query']['bool']['should'][0]['bool']['must'][1]['range'][prop1] = obj;
                           }
                       }
                   }else{
                       //已验证 正确
                      for(var prop  in field1) {
                          paginationQuery2['query']['bool']['should'][0]['bool']['must'][0]['term'][prop] = field1[prop];
                          var obj = {};
                          obj[prop] = 'desc';
                          paginationQuery2['sort'][0] = obj;
                          var obj2 = {};
                          obj2['lt'] = field1[prop];
                          paginationQuery2['query']['bool']['should'][1]['range'][prop] = obj2;
                          for (var prop1 in field2) {
                              paginationQuery2['sort'][1] = prop1;
                              var obj1 = {};
                              obj1['gt'] = field2[prop1];
                              paginationQuery2['query']['bool']['should'][0]['bool']['must'][1]['range'][prop1] = obj1;
                          }
                      }
                   }
                    return paginationQuery2;
                }else{
                    if(bool){
                        for(var prop  in field1){
                            var obj = {};
                            obj.gt = field1[prop];
                            paginationQuery1['query']['bool']['must'][0]['range'][prop] = obj;
                            paginationQuery1['sort'][0] = prop;
                        }
                    }else{
                        for(var prop  in field1){
                            var obj = {};
                            obj.lt = field1[prop];
                            paginationQuery1['query']['bool']['must'][0]['range'][prop] = obj;
                            var obj = {};
                            obj[prop] = 'desc';
                            paginationQuery1['sort'][0] = obj;
                        }
                    }
                    return paginationQuery1;
                }
            }
//            ,buildPre:function(field1,field2,size,bool){
//                if(size){
//                    paginationQuery1.size = size;
//                    paginationQuery2.size = size;
//                }
//                if(field2){
//
//                }else{
//                    if(bool){
//                        for(var prop  in field1){
//                            var obj = {};
//                            obj.gt = field1[prop];
//                            paginationQuery1['query']['bool']['must'][0]['range'][prop] = obj;
//                            paginationQuery1['sort'][0] = prop;
//                        }
//                    }else{
//                        for(var prop  in field1){
//                            var obj = {};
//                            obj.lt = field1[prop];
//                            paginationQuery1['query']['bool']['must'][0]['range'][prop] = obj;
//                            var obj = {};
//                            obj[prop] = 'desc';
//                            paginationQuery1['sort'][0] = obj;
//                        }
//                    }
//                    return paginationQuery1;
//                }
//            },
//            buildFirst:function(){
//
//            }

        };
    })
    //How to Use
    // 注入messageService
    //messageService.toast('Test');
    .factory('messageService',['$document','$log','$timeout','$compile','$rootScope','$window',function($document,$log,$timeout,$compile,$rootScope,$window){
      return {
        //content是要显示的内容
        toast:function(content){
          var messagePanel = angular.element('<toast>'+content+'</toast>');
          $document.find('body').append(messagePanel);
          var scope = $rootScope.$new(false);
          scope.toastTitle = '提示';
          $compile(messagePanel)(scope);

        }
      }
    }])
