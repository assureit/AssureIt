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
                "actiontype": "Monitor",
                "risk": "*"
            };
        }
        return ret;
    };
    DScriptActionMap.prototype.AddNodeRelation = function (nodeRelation) {
        this.NodeRelation[nodeRelation["action"]] = nodeRelation;
    };

    DScriptActionMap.prototype.GenActionRelation = function (actionNode, reactionNode, risk, location) {
        var ret = null;
        var action = actionNode.GetNote("Action");
        if (!(action == null)) {
            var reaction = null;
            var reactionNodeLabel = null;
            if (reactionNode != null) {
                reactionNodeLabel = reactionNode.Label;
                reaction = reactionNode.GetNote("Action");
                reaction = (reaction != null ? reaction : "-");
            } else {
                reactionNodeLabel = "Undefined";
                reaction = "Undefined";
            }
            ret = {
                "action": {
                    "node": actionNode.Label,
                    "func": action
                },
                "reaction": {
                    "node": reactionNodeLabel,
                    "func": reaction
                },
                "risk": risk,
                "location": location
            };
        }
        return ret;
    };
    DScriptActionMap.prototype.AddActionRelation = function (actionRelation) {
        var key = actionRelation["action"]["func"];
        if (key in this.ActionRelation) {
            var i = 1;
            do {
                var newKey = key + String(i);
                i++;
            } while(newKey in this.ActionRelation);
            this.ActionRelation[newKey] = actionRelation;
        } else {
            this.ActionRelation[key] = actionRelation;
        }
    };

    DScriptActionMap.prototype.Extract = function () {
        var case0 = this.RootNode.Case;
        var elementMap = case0.ElementMap;
        for (var key in elementMap) {
            var node = elementMap[key];
            if (node.Type != AssureIt.NodeType.Context)
                continue;
            var nodeRelation = this.GenNodeRelation(node);
            if (nodeRelation == null)
                continue;
            this.AddNodeRelation(nodeRelation);
        }

        var riskRelation = {};
        for (var key in this.NodeRelation) {
            if (!(key in elementMap)) {
                var reactionNodes = this.SearchNodeByType(elementMap[this.NodeRelation[key]["reaction"]], AssureIt.NodeType.Evidence);
                riskRelation[key] = reactionNodes;
            } else {
                var actionNodes = this.SearchNodeByType(elementMap[this.NodeRelation[key]["action"]], AssureIt.NodeType.Evidence);
                var reactionNodes = this.SearchNodeByType(elementMap[this.NodeRelation[key]["reaction"]], AssureIt.NodeType.Evidence);
                for (var i = 0; i < actionNodes.length; i++) {
                    var actionNode = actionNodes[i];
                    var location = actionNode.Environment.Location;
                    for (var j = 0; j < reactionNodes.length; j++) {
                        var reactionNode = reactionNodes[j];
                        var actionRelation = this.GenActionRelation(actionNode, reactionNode, "*", location != null ? location : "*");
                        if (actionRelation == null)
                            continue;
                        this.AddActionRelation(actionRelation);
                        reactionNode.Case = null;
                    }
                    actionNode.Case = null;
                }
            }
        }

        for (var key in elementMap) {
            var node = elementMap[key];
            if (node.Type != AssureIt.NodeType.Evidence)
                continue;
            if (node.Case == null) {
                node.Case = case0;
                continue;
            }
            var risk = node.Environment.Risk;
            var location = node.Environment.Location;
            location = (location != null ? location : "*");
            if (risk != null && risk in riskRelation) {
                var reactionNodes = riskRelation[risk];
                for (var i = 0; i < reactionNodes.length; i++) {
                    var reactionNode = reactionNodes[i];
                    var actionRelation = this.GenActionRelation(node, reactionNode, risk, location);
                    if (actionRelation == null)
                        continue;
                    this.AddActionRelation(actionRelation);
                    if (reactionNode.GetNote("Action") in this.ActionRelation) {
                        delete this.ActionRelation[reactionNode.GetNote("Action")];
                    } else {
                        reactionNode.Case = null;
                        this.NodeRelation[key] = $.extend(true, {}, this.NodeRelation[risk]);
                        this.NodeRelation[key]["action"] = node.Label;
                        this.NodeRelation[key]["risk"] = risk;
                    }
                }
            } else {
                var actionRelation = this.GenActionRelation(node, null, "*", location);
                if (actionRelation == null)
                    continue;
                this.AddActionRelation(actionRelation);
            }
        }
        for (var key in riskRelation) {
            if (key in this.NodeRelation)
                delete this.NodeRelation[key];
        }
        console.log(this);
    };

    DScriptActionMap.prototype.GetNodeRelation = function () {
        return this.NodeRelation;
    };

    DScriptActionMap.prototype.GetActionRelation = function () {
        return this.ActionRelation;
    };
    return DScriptActionMap;
})();
