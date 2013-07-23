var default_success_callback = function (result) {
};

var default_error_callback = function (req, stat, err) {
    alert("ajax error");
};

var ServerAPI = (function () {
    function ServerAPI(basepath) {
        this.uri = basepath + "/api/1.0/";
    }
    ServerAPI.prototype.RemoteCall = function (method, params) {
        var cmd = {
            jsonrpc: "2.0",
            method: method,
            id: 1,
            params: params
        };
        var async = callback != null;
        var callback = default_success_callback;
        var error_callback = default_error_callback;
        var res = $.ajax({
            type: "POST",
            url: this.uri,
            async: async,
            data: JSON.stringify(cmd),
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function (response) {
                callback(response.result);
            },
            error: error_callback
        });
        if (!async) {
            return JSON.parse(res.responseText).result;
        }
    };

    ServerAPI.prototype.GetCase = function (ProjectName, CaseId) {
        return this.RemoteCall("getDCase", { dcaseId: CaseId });
    };
    return ServerAPI;
})();
