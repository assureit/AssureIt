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

        $.ajax({
            type: "POST",
            url: uri,
            async: false,
            data: JSON.stringify(cmd),
            success: defaultSuccessCallback,
            error: defaultErrorCallback
        });
    }

    var AssureItAgentAPI = (function () {
        function AssureItAgentAPI(path) {
            this.uri = path;
            this.basepath = path;
        }
        AssureItAgentAPI.prototype.Deploy = function (dscript) {
            var params = {
                script: dscript
            };

            RemoteProcedureCall(this.uri, "Deploy", params);
        };
        return AssureItAgentAPI;
    })();
    AssureIt.AssureItAgentAPI = AssureItAgentAPI;
})(AssureIt || (AssureIt = {}));
