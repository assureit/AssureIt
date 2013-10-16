/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/PlugInManager.ts" />

/*
nodeRelation: {action: string, reaction: string, actiontype: string}
DScriptActionMap.NodeRelation: {
    ${label1}: nodeRelation,
    ${label2}: nodeRelation,
...}

actionRelation: {
    action: {node: string, func: string},
    reaction: {node: string, func: string},
    risk: string,
}
DScriptActionMap.ActionRelation: {
    ${actionFunc1}: actionRelation[],
	${actionFunc2}: actionRelation[],
...}
*/

class DScriptActionMap {
	private NodeRelation: any; //FIX ME!!
	private ActionRelation: any; //FIX ME!!
	private RootNode: AssureIt.NodeModel;

	constructor(RootNode: AssureIt.NodeModel) {
		this.NodeRelation = {};
		this.ActionRelation = {};
		this.RootNode = RootNode;
		this.Extract();
	}

	private SearchNodeByType(root: AssureIt.NodeModel, type: AssureIt.NodeType): AssureIt.NodeModel[] {
		var ret: AssureIt.NodeModel[] = [];
		if (root.Type == type) {
			ret.push(root);
		}
		for (var i: number = 0; i < root.Children.length; i++) {
			var child: AssureIt.NodeModel = root.Children[i];
			ret = ret.concat(this.SearchNodeByType(child, type));
		}
		return ret;
	}

	// gen nodeRelation from the Node which have Reaction::~ 
	private GenNodeRelation(node: AssureIt.NodeModel): any {
		var ret = null;
		var action = node.GetNote("Reaction");
		if (!(action == null)) {
			var reaction = node.Parent.Label;
			ret = {
				"action" : action,
				"reaction" : reaction,
				"actiontype" : "Monitor",
			};
		}
		return ret;
	}
	private AddNodeRelation(nodeRelation): void {
		this.NodeRelation[nodeRelation["action"]] = nodeRelation; //FIX ME!! if key is dulicated
	}

	private GenActionRelation(actionNode: AssureIt.NodeModel, reactionNode: AssureIt.NodeModel, risk: string, location: string): any {
		var ret = null;
		var action = actionNode.GetNote("Action");
		if (!(action == null)) {
			var reaction = null;
			var reactionNodeLabel = null;
			if (reactionNode != null) {
				reactionNodeLabel = reactionNode.Label;
				reaction = reactionNode.GetNote("Action");
				reaction = (reaction != null ? reaction : "-");
			}
			else {
				reactionNodeLabel = "Undefined";
				reaction = "Undefined";
			}
			ret = {
				"action" : {
					"node" : actionNode.Label,
					"func" : action,
				},
				"reaction" : {
					"node" : reactionNodeLabel,
					"func" : reaction,
				},
				"risk" : risk,
				"location" : location,
			};
		}
		return ret;
	}
	private AddActionRelation(actionRelation): void {
		this.ActionRelation[actionRelation["action"]["func"]] = actionRelation;
	}

	private Extract(): void {
		//for NodeRelation
		var contexts: AssureIt.NodeModel[] = this.SearchNodeByType(this.RootNode, AssureIt.NodeType.Context);
		var elementMap: { [index: string]: AssureIt.NodeModel } = this.RootNode.Case.ElementMap;
		for (var i: number = 0; i < contexts.length; i++) {
			var context: AssureIt.NodeModel = contexts[i];
			var nodeRelation = this.GenNodeRelation(context)
			if (nodeRelation == null) continue;
// 			var actionNode = elementMap[nodeRelation["action"]];
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
			this.AddNodeRelation(nodeRelation);
		}

		//for ActionRelation
		for (var key in this.NodeRelation) {
			var actionNodes: AssureIt.NodeModel[] = this.SearchNodeByType(elementMap[this.NodeRelation[key]["action"]], AssureIt.NodeType.Evidence);
			var reactionNodes: AssureIt.NodeModel[] = this.SearchNodeByType(elementMap[this.NodeRelation[key]["reaction"]], AssureIt.NodeType.Evidence);
			if (reactionNodes.length == 1) { //FIX ME!!
				//pass
			}
			else {
				console.log("too many reactions in " + key);
				continue;
			}
			for (var i: number = 0; i < actionNodes.length; i++) {
				var actionNode: AssureIt.NodeModel = actionNodes[i];
				var location: string = actionNode.Environment.Location;
				var actionRelation = this.GenActionRelation(actionNode, reactionNodes[0], "*", location != null ? location : "*");
				if (actionRelation == null) continue;
				this.AddActionRelation(actionRelation);
				actionNode.Type = null; // used as flag
			}
			reactionNodes[0].Type = null; // used as flag
		}
		for (var key in elementMap) {
			var node = elementMap[key];
			if (node.Type == null) {
				node.Type = AssureIt.NodeType.Evidence;
				continue;
			}
			else if (node.Type != AssureIt.NodeType.Evidence) {
				continue;
			}
			else {
				var location: string = node.Environment.Location;
				var actionRelation = this.GenActionRelation(node, null, "*", location != null ? location : "*");
				if (actionRelation == null) continue;
				this.AddActionRelation(actionRelation);
			}
		}
	}

	GetNodeRelation(): any {
		return this.NodeRelation;
	}

	GetActionRelation(): any {
		return this.ActionRelation;
	}
}
