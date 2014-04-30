'use strict';

/* Services */



angular.module('drive.services', [])
  .factory('DataGridService', function(){
        var service = {
            getData: function ( index,type,pageNo,size ,callback) {
                var options = {debug:true,forkLocal:true};
                var goodUrl = 'http://test.goodow.com:8080/eventbus';
                var goodChannel = 'realtime.search';
                var bus = new good.channel.WebSocketBus(goodUrl,options);

                bus.registerHandler("@good.bus.onOpen", function(message) {
                    console.log("Opened at: " + new Date().toString());
                });

                bus.registerHandler("@good.bus.onClose", function(message) {
                    console.log("Closed at: " + new Date().toString());
                });

                bus.registerHandler("@good.bus.onError", function(error) {
                    console.log("Error at: " + error);
                });
                var queryOptions1 = {
                    action:'search',
                    _index:index,
                    _type:type,
                    source:{
                        query:{
                            match_all:{

                            }
                        },
                        from:(pageNo-1)*size,
                        size:size
                    },
                    search_type:'query_then_fetch',
                    scroll:'5m'
                };
                console.log(queryOptions1);
                bus.send(goodChannel,queryOptions1,callback);
            }
        }
        return service;
  });
