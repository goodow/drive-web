'use strict';

/* Services */


angular.module('drive.services', [])
    .factory('DataGridService', function () {
        var options = {debug: true, forkLocal: true};
        var goodUrl = 'http://realtime.goodow.com:8080/eventbus';
        var bus = new good.channel.WebSocketBus(goodUrl, options);
        return bus;
    });
