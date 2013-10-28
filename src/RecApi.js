///<reference path='../d.ts/jquery.d.ts'/>
var AssureIt;
(function (AssureIt) {
    function RemoteProcedureCall(uri, method, params) {
        var defaultSuccessCallback = function (res) {
            // do nothing
        };

        var defaultErrorCallback = function (req, stat, err) {
            alert("ajax error");
        };

        var cmd = {
            jsonrpc: "2.0",
            method: method,
            id: 1,
            params: params
        };

        var ret = JSON.parse($.ajax({
            type: "POST",
            url: uri,
            async: false,
            data: cmd,
            //dataType: "json",   // FIXME
            //contentType: "application/json; charset=utf-8",   // FIXME
            success: defaultSuccessCallback,
            error: defaultErrorCallback
        }).responseText);

        return ret;
    }

    var RECAPI = (function () {
        function RECAPI(path) {
            this.uri = path;
            this.basepath = path;
        }
        RECAPI.prototype.pushRawData = function (location, type, data, authid, context) {
            var params = {
                location: location,
                type: type,
                data: data,
                authid: authid,
                context: context
            };

            var res = RemoteProcedureCall(this.uri, "pushRawData", params);

            if ('result' in res) {
                return res.result;
            } else {
                console.log(res.error);
                return null;
            }
        };

        RECAPI.prototype.getRawData = function (recid) {
            var params = { recid: recid };

            var res = RemoteProcedureCall(this.uri, "getRawData", params);

            if ('result' in res) {
                return res.result;
            } else {
                console.log(res.error);
                return null;
            }
        };

        RECAPI.prototype.getLatestData = function (location, type) {
            var params = {
                location: location,
                type: type
            };

            var res = RemoteProcedureCall(this.uri, "getLatestData", params);

            if ('result' in res) {
                return res.result;
            } else {
                console.log(res.error);
                return null;
            }
        };

        RECAPI.prototype.getRawDataList = function (location, type, limit, beginTimestamp, endTimestamp) {
            var params = {
                location: location,
                type: type,
                limit: limit,
                beginTimestamp: beginTimestamp,
                endTimestamp: endTimestamp
            };

            var res = RemoteProcedureCall(this.uri, "getRawtDataList", params);

            if ('result' in res) {
                return res.result;
            } else {
                console.log(res.error);
                return null;
            }
        };

        RECAPI.prototype.getMonitorList = function () {
            var params = {};

            var res = RemoteProcedureCall(this.uri, "getMonitorList", params);

            if ('result' in res) {
                return res.result;
            } else {
                console.log(res.error);
                return null;
            }
        };
        return RECAPI;
    })();
    AssureIt.RECAPI = RECAPI;
})(AssureIt || (AssureIt = {}));
