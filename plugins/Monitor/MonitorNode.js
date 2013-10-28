var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
function isMonitorNode(nodeModel) {
    return nodeModel.Type == AssureIt.NodeType.Evidence && nodeModel.Environment.Monitor != null && nodeModel.Environment.Location != null;
}

var MonitorNode = (function (_super) {
    __extends(MonitorNode, _super);
    function MonitorNode(Location, Item, Condition, EvidenceNode) {
        _super.call(this, Location, EvidenceNode);
        this.Item = Item;
        this.Condition = Condition;
        this.LatestData = null;
        this.PastData = [];
    }
    MonitorNode.prototype.SetItem = function (item) {
        this.Item = item;
    };

    MonitorNode.prototype.SetCondition = function (condition) {
        this.Condition = condition;
    };

    MonitorNode.prototype.UpdatePastData = function (latestData) {
        if (this.PastData.length < 10) {
            this.PastData.unshift(latestData);
        } else {
            this.PastData.pop();
            this.PastData.unshift(latestData);
        }
    };

    MonitorNode.prototype.UpdateLatestData = function (RECAPI) {
        var latestData = RECAPI.getLatestData(this.Location, this.Item);

        if (latestData == null) {
            console.log("latest data is null");
        } else {
            if (JSON.stringify(this.LatestData) != JSON.stringify(latestData)) {
                this.LatestData = latestData;
                this.UpdatePastData(latestData);
            }
        }
    };

    MonitorNode.prototype.UpdateStatus = function (RECAPI) {
        this.UpdateLatestData(RECAPI);

        if (this.LatestData == null)
            return;

        var status;
        var script = "var " + this.Item + "=" + this.LatestData.data + ";";

        script += this.Condition + ";";
        status = eval(script);

        if (status == true) {
            if (this.Status == false) {
                this.IsRecovered = true;
            }
            this.Fault = 0;
        } else {
            var latestFaultData = RECAPI.getLatestData(this.Location, this.EvidenceNode.Label);
            if (latestFaultData) {
                this.Fault = latestFaultData.data;
            }
        }

        this.Status = status;
    };

    MonitorNode.prototype.Show = function (caseViewer, HTMLRenderFunctions, SVGRenderFunctions) {
        if (this.LatestData == null) {
            return;
        }

        var data = "{ " + this.LatestData.type + " = " + this.LatestData.data + " }";
        this.EvidenceNode.Notes["LatestData"] = data;
        showNode(caseViewer, this.EvidenceNode, HTMLRenderFunctions, SVGRenderFunctions);
    };
    return MonitorNode;
})(ActionNode);
