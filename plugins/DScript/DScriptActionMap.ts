/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/PlugInManager.ts" />


/*
actionMap : {action: string, reaction : string, actiontype : string}
DScriptActinMap.body : {
	${label1} : actionMap,
	${label2} : actionMap,
...}
*/

class DScriptActionMap {
	private body : any; //FIX ME!!
	private rootNode : AssureIt.NodeModel;

	constructor(rootNode : AssureIt.NodeModel) {
		this.body = {};
		this.rootNode = rootNode;
		this.Extract();
	}

	private SearchNodeByType(root : AssureIt.NodeModel, type : AssureIt.NodeType) : AssureIt.NodeModel[] {
		var ret : AssureIt.NodeModel[] = [];
		for (var i : number = 0; i < root.Children.length; i++) {
			var child : AssureIt.NodeModel = root.Children[i];
			if (child.Type == type) {
				ret.push(child);
			}
			else {
				ret = ret.concat(this.SearchNodeByType(child, type));
			}
		}
		return ret;
	}

	// gen actionMap from the Node which have Reaction::~ 
	private GenActionMap(node : AssureIt.NodeModel) : any {
		var ret = null;
		var action = node.GetNote("Reaction");
		if (!(action == null)) {
			var reaction = node.Parent.Label;
			ret = {
				"action" : action,
				"reaction" : reaction,
				"actiontype" : null,
			};
		}
		return ret;
	}
	private AddActionMap(actionMap) : void {
		this.body[actionMap["action"]] = actionMap; //FIX ME!! if key is dulicated
	}

	private Extract() : void {
		var contexts : AssureIt.NodeModel[] = this.SearchNodeByType(this.rootNode, AssureIt.NodeType.Context);
		var elementMap : { [index: string]: AssureIt.NodeModel } = this.rootNode.Case.ElementMap;

		for (var i : number = 0; i < contexts.length; i++) {
			var context : AssureIt.NodeModel = contexts[i];
			var actionMap = this.GenActionMap(context)
			if (actionMap == null) continue;

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
	}
	GetBody(): any {
		return this.body;
	}
}
