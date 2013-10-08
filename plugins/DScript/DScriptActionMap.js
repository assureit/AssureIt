var DScriptActionMap = (function () {
    function DScriptActionMap(RootNode) {
        this.NodeRelation = {};
        this.ActionRelation = {};
        this.RootNode = RootNode;
        this.Extract();
    }
    DScriptActionMap.prototype.SearchNodeByType = function (root, type) {
        var ret = [];
        if (root.Type == type) {
            ret.push(root);
        }
        for (var i = 0; i < root.Children.length; i++) {
            var child = root.Children[i];
            ret = ret.concat(this.SearchNodeByType(child, type));
        }
        return ret;
    };

    DScriptActionMap.prototype.GenNodeRelation = function (node) {
        var ret = null;
        var action = node.GetNote("Reaction");
        if (!(action == null)) {
            var reaction = node.Parent.Label;
            ret = {
                "action": action,
                "reaction": reaction,
                "actiontype": "Monitor"
            };
        }
        return ret;
    };
    DScriptActionMap.prototype.AddNodeRelation = function (nodeRelation) {
        this.NodeRelation[nodeRelation["action"]] = nodeRelation;
    };

    DScriptActionMap.prototype.GenActionRelation = function (actionNode, reactionNode, fault) {
        if (typeof fault === "undefined") { fault = "*"; }
        var ret = null;
        var action = actionNode.GetNote("Action");
        if (!(action == null)) {
            var reaction = reactionNode.GetNote("Action");
            ret = {
                "action": {
                    "node": actionNode.Label,
                    "func": action
                },
                "reaction": {
                    "node": reactionNode.Label,
                    "func": reaction
                },
                "fault": fault
            };
        }
        return ret;
    };
    DScriptActionMap.prototype.AddActionRelation = function (actionRelation) {
        this.ActionRelation[actionRelation["action"]["func"]] = actionRelation;
    };

    DScriptActionMap.prototype.Extract = function () {
        var contexts = this.SearchNodeByType(this.RootNode, AssureIt.NodeType.Context);
        var elementMap = this.RootNode.Case.ElementMap;
        for (var i = 0; i < contexts.length; i++) {
            var context = contexts[i];
            var nodeRelation = this.GenNodeRelation(context);
            if (nodeRelation == null)
                continue;

            this.AddNodeRelation(nodeRelation);
        }

        for (var key in this.NodeRelation) {
            var actionEvidences = this.SearchNodeByType(elementMap[this.NodeRelation[key]["action"]], AssureIt.NodeType.Evidence);
            var reactionEvidences = this.SearchNodeByType(elementMap[this.NodeRelation[key]["reaction"]], AssureIt.NodeType.Evidence);
            if (reactionEvidences.length == 1) {
            } else {
                console.log("too many reactions in " + key);
                continue;
            }
            for (var i = 0; i < actionEvidences.length; i++) {
                var actionNode = actionEvidences[i];
                var actionRelation = this.GenActionRelation(actionNode, reactionEvidences[0]);
                if (actionRelation == null)
                    continue;
                this.AddActionRelation(actionRelation);
            }
        }
    };

    DScriptActionMap.prototype.GetNodeRelation = function () {
        return this.NodeRelation;
    };

    DScriptActionMap.prototype.GetActionRelation = function () {
        return this.ActionRelation;
    };
    return DScriptActionMap;
})();
