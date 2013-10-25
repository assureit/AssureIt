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
		var case0 = this.RootNode.Case;
		var elementMap: { [index: string]: AssureIt.NodeModel } = case0.ElementMap;
		for (var key in elementMap) {
			var node = elementMap[key];
			if (node.Type != AssureIt.NodeType.Context) continue;
			var nodeRelation = this.GenNodeRelation(node);
			if (nodeRelation == null) continue;
			this.AddNodeRelation(nodeRelation);
		}

		//for ActionRelation
		var riskRelation = {};
		for (var key in this.NodeRelation) {
			if (!(key in elementMap)) { // key is risk
				var reactionNodes: AssureIt.NodeModel[] = this.SearchNodeByType(elementMap[this.NodeRelation[key]["reaction"]], AssureIt.NodeType.Evidence);
				riskRelation[key] = reactionNodes;
			}
			else { // key is Node
				var actionNodes: AssureIt.NodeModel[] = this.SearchNodeByType(elementMap[this.NodeRelation[key]["action"]], AssureIt.NodeType.Evidence);
				var reactionNodes: AssureIt.NodeModel[] = this.SearchNodeByType(elementMap[this.NodeRelation[key]["reaction"]], AssureIt.NodeType.Evidence);
				for (var i: number = 0; i < actionNodes.length; i++) {
					var actionNode: AssureIt.NodeModel = actionNodes[i];
					var location: string = actionNode.Environment.Location;
					for (var j: number = 0; j < reactionNodes.length; j++) {
						var reactionNode = reactionNodes[j];
						var actionRelation = this.GenActionRelation(actionNode, reactionNode, "*", location != null ? location : "*");
						if (actionRelation == null) continue;
						this.AddActionRelation(actionRelation);
						reactionNode.Case = null; // used as flag
					}
					actionNode.Case = null; // used as flag
				}
			}
		}

		for (var key in elementMap) {
			var node = elementMap[key];
			if (node.Type != AssureIt.NodeType.Evidence) continue;
			if (node.Case == null) {
				node.Case = case0;
				continue;
			}
			var risk: string = node.Environment.Risk;
			var location: string = node.Environment.Location;
			location = (location != null ? location : "*");
			if (risk != null && risk in riskRelation) {
				var reactionNodes: AssureIt.NodeModel[] = riskRelation[risk];
				for (var i: number = 0; i < reactionNodes.length; i++) {
					var reactionNode: AssureIt.NodeModel = reactionNodes[i];
					var actionRelation = this.GenActionRelation(node, reactionNode, risk, location);
					if (actionRelation == null) continue;
					this.AddActionRelation(actionRelation);
					if (reactionNode.GetNote("Action") in this.ActionRelation) {
						delete this.ActionRelation[reactionNode.GetNote("Action")];
					}
					else {
						reactionNode.Case = null; // used as flag
						this.NodeRelation[key] = this.NodeRelation[risk];
						this.NodeRelation[key]["action"] = node.Label;
						this.NodeRelation[key]["risk"] = risk;
						delete this.NodeRelation[risk];
					}
				}
			}
			else {
				var actionRelation = this.GenActionRelation(node, null, "*", location);
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
