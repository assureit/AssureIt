var DScriptActionMap = (function () {
    function DScriptActionMap(rootNode) {
        this.body = {};
        this.rootNode = rootNode;
        this.Extract();
    }
    DScriptActionMap.prototype.SearchNodeByType = function (root, type) {
        var ret = [];
        for (var i = 0; i < root.Children.length; i++) {
            var child = root.Children[i];
            if (child.Type == type) {
                ret.push(child);
            } else {
                ret = ret.concat(this.SearchNodeByType(child, type));
            }
        }
        return ret;
    };

    DScriptActionMap.prototype.GenActionMap = function (node) {
        var ret = null;
        var action = node.GetNote("Reaction");
        if (!(action == null)) {
            var reaction = node.Parent.Label;
            ret = {
                "action": action,
                "reaction": reaction,
                "actiontype": null
            };
        }
        return ret;
    };
    DScriptActionMap.prototype.AddActionMap = function (actionMap) {
        this.body[actionMap["action"]] = actionMap;
    };

    DScriptActionMap.prototype.Extract = function () {
        var contexts = this.SearchNodeByType(this.rootNode, AssureIt.NodeType.Context);
        var elementMap = this.rootNode.Case.ElementMap;

        for (var i = 0; i < contexts.length; i++) {
            var context = contexts[i];
            var actionMap = this.GenActionMap(context);
            if (actionMap == null)
                continue;

            this.AddActionMap(actionMap);
        }
    };
    DScriptActionMap.prototype.GetBody = function () {
        return this.body;
    };
    return DScriptActionMap;
})();
