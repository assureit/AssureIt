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
    fault: string,
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

	private GenActionRelation(actionNode: AssureIt.NodeModel, reactionNode: AssureIt.NodeModel, fault: string = "*"): any {
		var ret = null;
		var action = actionNode.GetNote("Action");
		if (!(action == null)) {
			var reaction = reactionNode.GetNote("Action");
			ret = {
				"action" : {
					"node" : actionNode.Label,
					"func" : action,
				},
				"reaction" : {
					"node" : reactionNode.Label,
					"func" : reaction,
				},
				"fault" : fault,
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
			var actionEvidences: AssureIt.NodeModel[] = this.SearchNodeByType(elementMap[this.NodeRelation[key]["action"]], AssureIt.NodeType.Evidence);
			var reactionEvidences: AssureIt.NodeModel[] = this.SearchNodeByType(elementMap[this.NodeRelation[key]["reaction"]], AssureIt.NodeType.Evidence);
			if (reactionEvidences.length == 1) { //FIX ME!!
				//pass
			}
			else {
				console.log("too many reactions in " + key);
				continue;
			}
			for (var i: number = 0; i < actionEvidences.length; i++) {
				var actionNode: AssureIt.NodeModel = actionEvidences[i];
				var actionRelation = this.GenActionRelation(actionNode, reactionEvidences[0]);
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
