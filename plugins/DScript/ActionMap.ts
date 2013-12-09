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
}

class DScriptActionMap {
	public ErrorInfo: string[];
	private RootNode: AssureIt.NodeModel;
	private RelationMap: { [index: string]: DScriptNodeRelation };
	private ElementMap: { [index: string]: AssureIt.NodeModel };

	constructor(root: AssureIt.NodeModel) {
		this.ErrorInfo = [];
		this.RootNode = root;
		this.RelationMap = {};
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
		if (label in this.RelationMap) {
			relation = this.RelationMap[label];
		}
		else {
			relation = new DScriptNodeRelation();
			relation.BaseNode = label;
			this.RelationMap[label] = relation;
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
					if (node.Type == AssureIt.NodeType.Evidence && node.Environment["Risk"] == reactionValue) ret = true;
					return ret;
				}, -1, AssureIt.Direction.Bottom);
				if (srcList.length == 0) {
					this.ErrorInfo.push("invalid Reaction target ${TARGET} (ignored)".replace("${TARGET}", reactionValue));
					this.AddReaction(null, dist, reactionValue);
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
			var src: AssureIt.NodeModel = this.ElementMap[presumeValue];
			var dist: AssureIt.NodeModel = presumeNode.Parent;
			if (src != null) {
				this.AddPresume(src, dist);
			}
			else {
				this.ErrorInfo.push("invalid Presume target ${TARGET} (ignored)".replace("${TARGET}", presumeValue));
				this.AddPresume(null, dist);
			}
		}
	}
	private ExtractRelation(): void {
		this.ExtractReactionRelation();
		this.ExtractPresumeRelation();
	}
}
