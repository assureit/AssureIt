/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/PlugInManager.ts" />

class DScriptNodeRelation {
	public BaseNode: string;
	public Presumes: string[];
	public Reactions: { dist: string; risk: string; }[];

	constructor() {
		this.BaseNode = null;
		this.Presumes = [];
		this.Reactions = [];
	}
	PresumesToString(): string {
		var ret: string = "";
		if (this.Presumes.length != 0) {
			var i: number = 0;
			for (; i < this.Presumes.length; i++) {
				ret += this.Presumes[i];
				if (i < this.Presumes.length - 1) ret += ", ";
			}
		}
		else {
			ret = "-";
		}
		return ret;
	}
	ReactionsToString(): string {
		var ret: string = "";
		if (this.Reactions.length != 0) {
			var reaction: { dist: string; risk: string; };
			var i: number = 0;
			for (; i < this.Reactions.length; i++) {
				reaction = this.Reactions[i];
				ret += reaction["dist"];
				if (reaction["risk"] != null) ret += "(" + reaction["risk"] + ")";
				if (i < this.Reactions.length - 1) ret += ", ";
			}
		}
		else {
			ret = "-";
		}
		return ret;
	}
}

class DScriptActionRelation { //for reaction
	public SrcNode: AssureIt.NodeModel;
	public DistNode: AssureIt.NodeModel;
	public Risk: string;

	constructor(src: AssureIt.NodeModel, dist: AssureIt.NodeModel, risk: string) {
		this.SrcNode = src;
		this.DistNode = dist;
		this.Risk = risk;
	}

	public GetTargetNode(): AssureIt.NodeModel {
		var ret: AssureIt.NodeModel = this.SrcNode;
		while (ret.Type != AssureIt.NodeType.Goal) {
			if (ret.Parent != null) {
				ret = ret.Parent;
			}
			else {
				throw "in DScriptPlugIn, UpdateActionRelationTable Error";
			}
		}
		return ret;
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
	public GetReactionNodes(): AssureIt.NodeModel[] {
		return this.ExtractNode(this.DistNode, function(node: AssureIt.NodeModel) {
			if (node.Type == AssureIt.NodeType.Evidence) {
				return true;
			}
			else {
				return false;
			}
		}, -1, AssureIt.Direction.Bottom);
	}
}

class DScriptActionMap {
	public ErrorInfo: string[];
	private RootNode: AssureIt.NodeModel;
	private NodeRelationMap: { [index: string]: DScriptNodeRelation };
	private ElementMap: { [index: string]: AssureIt.NodeModel };

	constructor(root: AssureIt.NodeModel) {
		this.ErrorInfo = [];
		this.RootNode = root;
		this.NodeRelationMap = {};
		this.ElementMap = this.CreateLocalElementMap(root);
		this.ExtractRelation();
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

	public GetOrCreateNodeRelation(label: string): DScriptNodeRelation {
		var relation: DScriptNodeRelation;
		if (label in this.NodeRelationMap) {
			relation = this.NodeRelationMap[label];
		}
		else {
			relation = new DScriptNodeRelation();
			relation.BaseNode = label;
			this.NodeRelationMap[label] = relation;
		}
		return relation;
	}
	public AddReaction(src: AssureIt.NodeModel, dist: AssureIt.NodeModel, risk: string): void {
		var relation: DScriptNodeRelation;
		if (src != null) {
			relation = this.GetOrCreateNodeRelation(src.Label);
		}
		else {
			relation = this.GetOrCreateNodeRelation("-");
		}
		if (risk == null) risk = "*";
		if (dist != null) {
			relation.Reactions.push({
				dist : dist.Label,
				risk : risk
			});
		}
		else {
			relation.Reactions.push({
				dist : "-",
				risk : risk,
			});
		}
	}
	public AddPresume(src: AssureIt.NodeModel, dist: AssureIt.NodeModel): void {
		var relation: DScriptNodeRelation;
		if (src != null) {
			relation = this.GetOrCreateNodeRelation(src.Label);
		}
		else {
			relation = this.GetOrCreateNodeRelation("-");
		}
		if (dist != null) {
			relation.Presumes.push(dist.Label);
		}
		else {
			relation.Presumes.push("-");
		}
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
				this.AddReaction(src, dist, null);
			}
			else { //Reaction for Risk
				var srcList: AssureIt.NodeModel[] = this.ExtractNode(this.RootNode, function(node: AssureIt.NodeModel) {
					var ret: boolean = false;
					if (node.Type == AssureIt.NodeType.Evidence && node.Environment.Risk == reactionValue) ret = true;
					return ret;
				}, -1, AssureIt.Direction.Bottom);
				if (srcList.length == 0) {
					this.ErrorInfo.push("invalid Reaction target ${TARGET} (ignored)".replace("${TARGET}", reactionValue));
				}
				else {
					for (var j: number = 0; j < srcList.length; j++) {
						this.AddReaction(srcList[j], dist, reactionValue);
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
			var targets: string[] = presumeValue.split(/[\s,]/);
			var src: AssureIt.NodeModel = presumeNode.Parent;
			for (var j: number = 0; j < targets.length; j++) {
				var target: string = targets[j];
				var dist: AssureIt.NodeModel = this.ElementMap[target];
				if (src != null) {
					this.AddPresume(src, dist);
				}
				else {
					this.ErrorInfo.push("invalid Presume target ${TARGET} (ignored)".replace("${TARGET}", target));
				}
			}
		}
	}
	private ExtractRelation(): void {
		this.ExtractReactionRelation();
		this.ExtractPresumeRelation();
	}

	GetNodeRelationMap(): { [index: string]: DScriptNodeRelation } {
		return this.NodeRelationMap;
	}
	GetActionRelations(): DScriptActionRelation[] {
		var ret: DScriptActionRelation[] = [];
		for (var key in this.NodeRelationMap) {
			var nodeRelation = this.NodeRelationMap[key];
			for (var i: number = 0; i < nodeRelation.Reactions.length; i++) {
				var actionRelation = new DScriptActionRelation(
					this.ElementMap[nodeRelation.BaseNode],
					this.ElementMap[nodeRelation.Reactions[i]["dist"]],
					nodeRelation.Reactions[i]["risk"]
				);
				ret.push(actionRelation);
			}
		}
		console.log(ret);
		return ret;
	}
}
