/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/*
actionMap : {action: string, reaction : string, actiontype : string}
DScriptActinMap.body : {
${label1} : actionMap,
${label2} : actionMap,
...}
*/
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

    // gen actionMap from the Node which have Reaction::~
    DScriptActionMap.prototype.GenActionMap = function (node) {
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

            // 			var actionNode = elementMap[actionMap["action"]];
            // 			if (actionNode.GetAnnotation("OnlyIf") != null) {
            // 				//
            // 			}
            // 			else if (actionNode.GetAnnotation("Boot") != null) {
            // 				//
            // 			}
            // 			else {
            // 				//
            // 			}
            // 			if (actionNode.GetAnnotation("Once") != null) {
            // 				//
            // 			}
            this.AddActionMap(actionMap);
        }
    };
    DScriptActionMap.prototype.GetBody = function () {
        return this.body;
    };
    return DScriptActionMap;
})();
