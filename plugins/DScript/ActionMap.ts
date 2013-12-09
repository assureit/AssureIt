/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/PlugInManager.ts" />

/*
nodeRelation: {node: string, reaction: string, presume: string}

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
	private NodeRelations: any[]; //FIX ME!!
	private ActionRelation: any; //FIX ME!!
	private RootNode: AssureIt.NodeModel;
	public ErrorInfo: string[];
	private ElementMap: { [index: string]: AssureIt.NodeModel };

	constructor(root: AssureIt.NodeModel) {
		this.NodeRelations = [];
		this.ActionRelation = {};
		this.RootNode = root;
		this.ErrorInfo = [];
		this.ElementMap = this.CreateLocalElementMap(root);
		this.ExtractRelation();
		this.FixUpRelation();
	}

	public CreateLocalElementMap(root: AssureIt.NodeModel): { [index: string]: AssureIt.NodeModel } {
		var ret: { [index: string]: AssureIt.NodeModel } = {};
		var list: AssureIt.NodeModel[] = this.ExtractNode(root, function(node: AssureIt.NodeModel) {
			return true;
		}, -1, AssureIt.Direction.Bottom);
		for (var i: number = 0; i < list.length; i++) {
			var node = list[i];
			ret[node.Label] = node;
		}
		return ret;
	}

	public static CreateNodeRelation(src: AssureIt.NodeModel, dist: AssureIt.NodeModel, type: string): any/*FIX ME*/ {
		var ret = {};
		if (src != null) {
			ret["node"] = src.Label;
		}
		else {
			ret["node"] = "*";
		}
		if (dist != null) {
			ret[type] = dist.Label;
		}
		else {
			ret[type] = "*";
		}
		return ret;
	}

	public AddNodeRelation(relation): void {
		this.NodeRelations.push(relation);
	}

	public ExtractNode(root: AssureIt.NodeModel, thFunc: (node: AssureIt.NodeModel) => boolean, maxDepth: number, dir: AssureIt.Direction): AssureIt.NodeModel[] {
		var ret: AssureIt.NodeModel[] = [];
		if (maxDepth != 0) {
			var searchList: AssureIt.NodeModel[];
			if (dir == AssureIt.Direction.Top) {
				searchList = [root.Parent];
			}
			else if (dir == AssureIt.Direction.Bottom) {
				searchList = root.Children;
			}
			else if (dir == null) {
				searchList = root.Children.concat(root.Parent);
			}
			else {
				//undefined direction
				searchList = [];
			}
			for (var i: number = 0; i < searchList.length; i++) {
				ret = ret.concat(this.ExtractNode(searchList[i], thFunc, maxDepth - 1, dir));
			}
		}
		if (thFunc.call(this, root)) {
			ret = ret.concat(root);
		}
		return ret;
	}

	// private SearchNodeByType(root: AssureIt.NodeModel, type: AssureIt.NodeType): AssureIt.NodeModel[] {
	// 	var ret: AssureIt.NodeModel[] = [];
	// 	if (root.Type == type) {
	// 		ret.push(root);
	// 	}
	// 	for (var i: number = 0; i < root.Children.length; i++) {
	// 		var child: AssureIt.NodeModel = root.Children[i];
	// 		ret = ret.concat(this.SearchNodeByType(child, type));
	// 	}
	// 	return ret;
	// }

	// // gen nodeRelation from the Node which have Reaction::~
	// private GenNodeRelation(node: AssureIt.NodeModel): any {
	// 	var ret = null;
	// 	var action = node.GetNote("Reaction");
	// 	if (!(action == null)) {
	// 		var reaction = node.Parent.Label;
	// 		ret = {
	// 			"action" : action,
	// 			"reaction" : reaction,
	// 			"actiontype" : "Monitor",
	// 			"risk" : "*",
	// 		};
	// 	}
	// 	return ret;
	// }
	// private AddNodeRelation(nodeRelation): void {
	// 	this.NodeRelation[nodeRelation["action"]] = nodeRelation; //FIX ME!! if key is duplicated
	// }

	// private GenActionRelation(actionNode: AssureIt.NodeModel, reactionNode: AssureIt.NodeModel, risk: string, location: string): any {
	// 	var ret = null;
	// 	var action = actionNode.GetNote("Action");
	// 	if (!(action == null)) {
	// 		var reaction = null;
	// 		var reactionNodeLabel = null;
	// 		if (reactionNode != null) {
	// 			reactionNodeLabel = reactionNode.Label;
	// 			reaction = reactionNode.GetNote("Action");
	// 			reaction = (reaction != null ? reaction : "-");
	// 		}
	// 		else {
	// 			reactionNodeLabel = "*";
	// 			reaction = "ManagerCall()";
	// 		}
	// 		ret = {
	// 			"action" : {
	// 				"node" : actionNode.Label,
	// 				"func" : action,
	// 			},
	// 			"reaction" : {
	// 				"node" : reactionNodeLabel,
	// 				"func" : reaction,
	// 			},
	// 			"risk" : risk,
	// 			"location" : location,
	// 		};
	// 	}
	// 	return ret;
	// }
	// private AddActionRelation(actionRelation): void {
	// 	var key = actionRelation["action"]["func"];
	// 	if (key in this.ActionRelation) {
	// 		var i = 1;
	// 		do {
	// 			var newKey = key + String(i);
	// 			i++;
	// 		} while(newKey in this.ActionRelation);
	// 		this.ActionRelation[newKey] = actionRelation;
	// 	}
	// 	else {
	// 		this.ActionRelation[key] = actionRelation;
	// 	}
	// }

	private ExtractReactionRelation(): void {
		var reactionNodes: AssureIt.NodeModel[] = this.ExtractNode(this.RootNode, function(node: AssureIt.NodeModel) {
			var ret: boolean = false;
			if (node.GetNote("Reaction") != null) {
				if (node.Type == AssureIt.NodeType.Context) {
					ret = true;
				}
				else {
					this.ErrorInfo.push("node ${LABEL} is not Context, but has Reaction info (ignored)".replace("${LABEL}", node.Label));
				}
			}
			return ret;
		}, -1, AssureIt.Direction.Bottom);

		for (var i: number = 0; i < reactionNodes.length; i++) {
			var reactionNode: AssureIt.NodeModel = reactionNodes[i];
			var reactionValue: string = reactionNode.GetNote("Reaction");
			var src: AssureIt.NodeModel = this.ElementMap[reactionValue];
			var dist: AssureIt.NodeModel = reactionNode.Parent;
			if (src != null) { //Reaction for Node
				var relation = DScriptActionMap.CreateNodeRelation(src, dist, "reaction");
				this.AddNodeRelation(relation);
			}
			else { //Reaction for Risk
				var srcList: AssureIt.NodeModel[] = this.ExtractNode(this.RootNode, function(node: AssureIt.NodeModel) {
					var ret: boolean = false;
					if (node.Type == AssureIt.NodeType.Evidence && node.Environment["Risk"] == reactionValue) ret = true;
					return ret;
				}, -1, AssureIt.Direction.Bottom);
				if (srcList.length == 0) {
					this.ErrorInfo.push("invalid Reaction target ${TARGET} (ignored)".replace("${TARGET}", reactionValue));
				}
				else {
					for (var j: number = 0; j < srcList.length; j++) {
						var relation = DScriptActionMap.CreateNodeRelation(srcList[j], dist, "reaction");
						this.AddNodeRelation(relation);
					}
				}
			}
		}
	}
	private ExtractPresumeRelation(): void {
		var presumeNodes = this.ExtractNode(this.RootNode, function(node: AssureIt.NodeModel) {
			var ret: boolean = false;
			if (node.GetNote("Presume") != null) {
				if (node.Type == AssureIt.NodeType.Context) {
					ret = true;
				}
				else {
					this.ErrorInfo.push("node ${LABEL} is not Context, but has Presume info (ignored)".replace("${LABEL}", node.Label));
				}
			}
			return ret;
		}, -1, AssureIt.Direction.Bottom);

		for (var i: number = 0; i < presumeNodes.length; i++) {
			var presumeNode: AssureIt.NodeModel = presumeNodes[i];
			var presumeValue: string = presumeNode.GetNote("Presume");
			var src: AssureIt.NodeModel = this.ElementMap[presumeValue];
			var dist: AssureIt.NodeModel = presumeNode.Parent;
			if (src != null) {
				var relation = DScriptActionMap.CreateNodeRelation(src, dist, "presume");
				this.AddNodeRelation(relation);
			}
			else {
				this.ErrorInfo.push("invalid Presume target ${TARGET} (ignored)".replace("${TARGET}", presumeValue));
			}
		}
	}
	private ExtractRelation(): void {
		this.ExtractReactionRelation();
		this.ExtractPresumeRelation();
	}

	// private Extract(): void {
	// 	//for NodeRelation
	// 	var case0 = this.RootNode.Case;
	// 	var elementMap: { [index: string]: AssureIt.NodeModel } = case0.ElementMap;
	// 	for (var key in elementMap) {
	// 		var node = elementMap[key];
	// 		if (node.Type != AssureIt.NodeType.Context) continue;
	// 		var nodeRelation = this.GenNodeRelation(node);
	// 		if (nodeRelation == null) continue;
	// 		this.AddNodeRelation(nodeRelation);
	// 	}

	// 	//for ActionRelation
	// 	var riskRelation = {};
	// 	for (var key in this.NodeRelation) {
	// 		if (!(key in elementMap)) { // key is risk
	// 			var reactionNodes: AssureIt.NodeModel[] = this.SearchNodeByType(elementMap[this.NodeRelation[key]["reaction"]], AssureIt.NodeType.Evidence);
	// 			riskRelation[key] = reactionNodes;
	// 		}
	// 		else { // key is Node
	// 			var actionNodes: AssureIt.NodeModel[] = this.SearchNodeByType(elementMap[this.NodeRelation[key]["action"]], AssureIt.NodeType.Evidence);
	// 			var reactionNodes: AssureIt.NodeModel[] = this.SearchNodeByType(elementMap[this.NodeRelation[key]["reaction"]], AssureIt.NodeType.Evidence);
	// 			for (var i: number = 0; i < actionNodes.length; i++) {
	// 				var actionNode: AssureIt.NodeModel = actionNodes[i];
	// 				var location: string = actionNode.Environment.Location;
	// 				for (var j: number = 0; j < reactionNodes.length; j++) {
	// 					var reactionNode = reactionNodes[j];
	// 					var actionRelation = this.GenActionRelation(actionNode, reactionNode, "*", location != null ? location : "*");
	// 					if (actionRelation == null) continue;
	// 					this.AddActionRelation(actionRelation);
	// 					reactionNode.Case = null; // used as flag
	// 				}
	// 				actionNode.Case = null; // used as flag
	// 			}
	// 		}
	// 	}

	// 	for (var key in elementMap) {
	// 		var node = elementMap[key];
	// 		if (node.Type != AssureIt.NodeType.Evidence) continue;
	// 		if (node.Case == null) {
	// 			node.Case = case0;
	// 			continue;
	// 		}
	// 		var risk: string = node.Environment.Risk;
	// 		var location: string = node.Environment.Location;
	// 		location = (location != null ? location : "*");
	// 		if (risk != null && risk in riskRelation) {
	// 			var reactionNodes: AssureIt.NodeModel[] = riskRelation[risk];
	// 			for (var i: number = 0; i < reactionNodes.length; i++) {
	// 				var reactionNode: AssureIt.NodeModel = reactionNodes[i];
	// 				var actionRelation = this.GenActionRelation(node, reactionNode, risk, location);
	// 				if (actionRelation == null) continue;
	// 				this.AddActionRelation(actionRelation);
	// 				if (reactionNode.GetNote("Action") in this.ActionRelation) {
	// 					delete this.ActionRelation[reactionNode.GetNote("Action")];
	// 				}
	// 				else {
	// 					reactionNode.Case = null; // used as flag
	// 					this.NodeRelation[key] = $.extend(true, {}, this.NodeRelation[risk]);
	// 					this.NodeRelation[key]["action"] = node.Label;
	// 					this.NodeRelation[key]["risk"] = risk;
	// 				}
	// 			}
	// 		}
	// 		else {
	// 			var actionRelation = this.GenActionRelation(node, null, "*", location);
	// 			if (actionRelation == null) continue;
	// 			this.AddActionRelation(actionRelation);
	// 		}
	// 	}
	// 	for (var key in riskRelation) {
	// 		if (key in this.NodeRelation) delete this.NodeRelation[key];
	// 	}
	// }

	GetNodeRelations(): any {
		return this.NodeRelations;
	}

	GetActionRelation(): any {
		return this.ActionRelation;
	}
}
