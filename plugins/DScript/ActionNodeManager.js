var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ActionNodeManager = (function (_super) {
    __extends(ActionNodeManager, _super);
    function ActionNodeManager() {
        _super.apply(this, arguments);
    }
    ActionNodeManager.prototype.SetActionNode = function (evidenceNode) {
        var location = getContextNode(evidenceNode.Parent).Notes["Location"];
        var actionNode = this.DynamicNodeMap[evidenceNode.Label];

        if (actionNode == null) {
            this.DynamicNodeMap[evidenceNode.Label] = new ActionNode(location, evidenceNode);
        } else {
            actionNode.SetLocation(location);
        }

        if (Object.keys(this.DynamicNodeMap).length == 1) {
            this.StartMonitoring(5000);
        }
    };
    return ActionNodeManager;
})(DynamicNodeManager);
