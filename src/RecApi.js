var AssureIt;
(function (AssureIt) {
    function RemoteProcedureCall(uri, method, params) {
        var defaultSuccessCallback = function (res) {
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
            success: defaultSuccessCallback,
            error: defaultErrorCallback
        }).responseText);

        return ret;
    }

    var RECAPI = (function () {
        function RECAPI(basepath) {
            this.uri = basepath + "/api/2.0/";
            this.basepath = basepath;
        }
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
