var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var MonitorNodeManager = (function (_super) {
    __extends(MonitorNodeManager, _super);
    function MonitorNodeManager() {
        _super.apply(this, arguments);
    }
    MonitorNodeManager.prototype.SetMonitorNode = function (evidenceNode) {
        var location = "";
        if ("Location" in evidenceNode.Notes) {
            location = evidenceNode.Notes["Location"];
        } else if ("Location" in evidenceNode.Environment) {
            location = evidenceNode.Environment["Location"];
        }

        var condition = "";
        if ("Monitor" in evidenceNode.Notes) {
            condition = evidenceNode.Notes["Monitor"];
        } else if ("Monitor" in evidenceNode.Environment) {
            condition = evidenceNode.Environment["Monitor"];
        }

        var item = extractItemFromCondition(condition);
        var monitorNode = this.ActionNodeMap[evidenceNode.Label];

        if (monitorNode == null) {
            this.ActionNodeMap[evidenceNode.Label] = new MonitorNode(location, item, condition, evidenceNode);
        } else {
            monitorNode.SetLocation(location);
            monitorNode.SetItem(item);
            monitorNode.SetCondition(condition);
            return;
        }

        if (Object.keys(this.ActionNodeMap).length == 1) {
            this.StartMonitoring(5000);
        }
    };
    return MonitorNodeManager;
})(ActionNodeManager);
