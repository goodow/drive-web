'use strict';

/* Services */



angular.module('drive.services', [])
  .factory('bus', ['$window','Constant',function($window,Constant){
      var  options = {debug:true, forkLocal:true};
      var serverUrl = Constant.serverUrl;
      var bus = new realtime.channel.ReconnectBus(serverUrl, options);
      return function(){
          return bus;
      }
  }])
  .factory('HeadData', function(){
      var DashBoard = [{"type": '/chart/attachmentChart', "name": '文档统计'},{"type": '/chart/deviceChart', "name": '设备统计'}];
      var SystemManage = [{"type": '/datagrid/attachment', "name": '文档播放统计'},{"type": '/datagrid/attachmentActivity', "name": '文档操作管理'},{"type": '/datagrid/device', "name": '设备管理'},{"type": '/datagrid/deviceActivity', "name": '设备操作管理'},{"type": '/datagrid/devicestatus', "name": '设备在线显示'}];
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
    .factory('DateService',function(){
      var now = new Date(); //当前日期
      var nowDayOfWeek = now.getDay(); //今天本周的第几天
      var nowDay = now.getDate(); //当前日
      var nowMonth = now.getMonth(); //当前月
      var nowYear = now.getYear(); //当前年
      nowYear += (nowYear < 2000) ? 1900 : 0; //

      var lastMonthDate = new Date(); //上月日期
      lastMonthDate.setDate(1);
      lastMonthDate.setMonth(lastMonthDate.getMonth()-1);
      var lastYear = lastMonthDate.getYear();
      var lastMonth = lastMonthDate.getMonth();
      //格局化日期：yyyy-MM-dd
      var formatDate = function(date) {
        var myyear = date.getFullYear();
        var mymonth = date.getMonth()+1;
        var myweekday = date.getDate();

        if(mymonth < 10){
          mymonth = "0" + mymonth;
        }
        if(myweekday < 10){
          myweekday = "0" + myweekday;
        }
        return (myyear + "-" + mymonth + "-" + myweekday);
      }

      return {
        //获取当前第几周
        getWeekNo: function getWeekNo() {
          var totalDays = 0;
          var now = new Date();
          var years=now.getYear();
          if (years < 1000)years+=1900;
          var days = new Array(12);	// Array to hold the total days in a month
          days[0] = 31;
          days[2] = 31;
          days[3] = 30;
          days[4] = 31;
          days[5] = 30;
          days[6] = 31;
          days[7] = 31;
          days[8] = 30;
          days[9] = 31;
          days[10] = 30;
          days[11] = 31;
          //  Check to see if this is a leap year
          if (Math.round(now.getYear()/4) == now.getYear()/4) {
            days[1] = 29
          }else {
            days[1] = 28
          }
          //  If this is January no need for any fancy calculation otherwise figure out the
          //  total number of days to date and then determine what week
          if (now.getMonth() == 0) {
            totalDays = totalDays + now.getDate();
          }else{
            var curMonth = now.getMonth();
            for (var count = 1; count <= curMonth; count++) {
              totalDays = totalDays + days[count - 1];
            }
            totalDays = totalDays + now.getDate();
          }
          var week = Math.round(totalDays/7);
          return week;
        },

        //格局化日期：MM.dd
        getFormatDate:function getFormatDate(date) {
          var myyear = date.getFullYear();
          var mymonth = date.getMonth()+1;
          var myweekday = date.getDate();

          if(mymonth < 10){
            mymonth = "0" + mymonth;
          }
          if(myweekday < 10){
            myweekday = "0" + myweekday;
          }
          return (mymonth + "." + myweekday);
        },

        //获得某月的天数
        getMonthDays:function getMonthDays(myMonth){
          var monthStartDate = new Date(nowYear, myMonth, 1);
          var monthEndDate = new Date(nowYear, myMonth + 1, 1);
          var days = (monthEndDate - monthStartDate)/(1000 * 60 * 60 * 24);
          return days;
        },

        //获得本季度的开端月份
        getQuarterStartMonth:function getQuarterStartMonth(){
          var quarterStartMonth = 0;
          if(nowMonth<3){
            quarterStartMonth = 0;
          }
          if(2<nowMonth && nowMonth<6){
            quarterStartMonth = 3;
          }
          if(5<nowMonth && nowMonth<9){
            quarterStartMonth = 6;
          }
          if(nowMonth>8){
            quarterStartMonth = 9;
          }
          return quarterStartMonth;
        },

        //获得本周的开端日期
        getWeekStartDate:function getWeekStartDate() {
          var curr = new Date;
          return formatDate(new Date(curr.setDate(curr.getDate() - curr.getDay()+1)));
        },

        //获得本周的停止日期
        getWeekEndDate:function getWeekEndDate() {
          var curr = new Date;
          return formatDate(new Date(curr.setDate(curr.getDate() - curr.getDay()+7)));;
        },

        //获取第几周日期
        getWeekDate:function getWeekDate(day) {
          var curr = new Date;
          return formatDate(new Date(curr.setDate(curr.getDate() - curr.getDay()+day)));;
        },

        //获得本月的开端日期
        getMonthStartDate:function getMonthStartDate(){
          var monthStartDate = new Date(nowYear, nowMonth, 1);
          return formatDate(monthStartDate);
        },

        //获得本月的停止日期
        getMonthEndDate:function getMonthEndDate(){
          var monthEndDate = new Date(nowYear, nowMonth, getMonthDays(nowMonth));
          return formatDate(monthEndDate);
        },

        //获得上月开端时候
        getLastMonthStartDate:function getLastMonthStartDate(){
          var lastMonthStartDate = new Date(nowYear, lastMonth, 1);
          return formatDate(lastMonthStartDate);
        },

        //获得上月停止时候
        getLastMonthEndDate:function getLastMonthEndDate(){
          var lastMonthEndDate = new Date(nowYear, lastMonth, getMonthDays(lastMonth));
          return formatDate(lastMonthEndDate);
        },

        //获得本季度的开端日期
        getQuarterStartDate:function getQuarterStartDate(){

          var quarterStartDate = new Date(nowYear, getQuarterStartMonth(), 1);
          return formatDate(quarterStartDate);
        },

        //或的本季度的停止日期
        getQuarterEndDate:function getQuarterEndDate(){
          var quarterEndMonth = getQuarterStartMonth() + 2;
          var quarterStartDate = new Date(nowYear, quarterEndMonth, getMonthDays(quarterEndMonth));
          return formatDate(quarterStartDate);
        }
      };
    })
