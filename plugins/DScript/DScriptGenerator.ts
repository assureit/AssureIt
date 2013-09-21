/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/PlugInManager.ts" />

class Edge {
	src: number;
	dst: number;
	constructor(src: number, dst: number) {
		this.src = src;
		this.dst = dst;
	}
}

function visit(g: Edge[][], v: number, order: number[], color: number[]) : boolean {
	color[v] = 1;
	for (var i=0; i < g[v].length; i = i + 1) {
		var e = g[v][i];
		if (color[e.dst] == 2/*visited*/) {
			continue;
		}
		if (color[e.dst] == 1) {
			return false;
		}
		if (!visit(g, e.dst, order, color)) {
			return false;
		}
	}
	order.push(v);
	color[v] = 2;
	return true;
}

function tsort(g: Edge[][]) : number[] {
	var n = g.length;
	var color : number[] = [];
	var order : number[] = [];
	for (var i=0; i < n; i = i + 1) {
		color.push(0);
	}
	for (i=0; i < n; i = i + 1) {
		if (!color[i] && !visit(g, i, order, color)) {
			return null;
		}
	}
	return order.reverse();
}

class DScriptError {
	NodeName : string;
	LineNumber: number;
	Message : string;
	constructor(NodeName: string, LineNumber: number, Message: string) {
		this.NodeName = NodeName;
		this.LineNumber = LineNumber;
		this.Message = Message;
	}
}

class DScriptGenerator {
	indent: string;
	linefeed: string;
	errorMessage: DScriptError[];
	Env : { [key: string]: string;}[];
	constructor() {
		this.indent = "\t";
		this.linefeed = "\n";
		this.errorMessage = [];
		this.Env = [];
	}

	GetGoalList(List: AssureIt.NodeModel[]): AssureIt.NodeModel[] {
		return List.filter(function (Node : AssureIt.NodeModel) {
			return Node.Type == AssureIt.NodeType.Goal;
		});
	}

	GetContextList(List: AssureIt.NodeModel[]): AssureIt.NodeModel[] {
		return List.filter(function (Node : AssureIt.NodeModel) {
			return Node.Type == AssureIt.NodeType.Context;
		});
	}

	GetEvidenceList(List: AssureIt.NodeModel[]): AssureIt.NodeModel[] {
		return List.filter(function (Node : AssureIt.NodeModel) {
			return Node.Type == AssureIt.NodeType.Evidence;
		});
	}

	GetStrategyList(List: AssureIt.NodeModel[]): AssureIt.NodeModel[] {
		return List.filter(function (Node : AssureIt.NodeModel) {
			return Node.Type == AssureIt.NodeType.Strategy;
		});
	}

	GetContextIndex(Node: AssureIt.NodeModel): number {
		for (var i: number = 0; i < Node.Children.length; i++) {
			if (Node.Children[i].Type == AssureIt.NodeType.Context) {
				return i;
			}
		}
		return -1; 
	}


	GetParentContextEnvironment(ParentNode: AssureIt.NodeModel): AssureIt.NodeModel {
		while(ParentNode != null) {
			var contextindex: number = this.GetContextIndex(ParentNode);
			if(contextindex != -1) {
				return ParentNode.Children[contextindex];
			}
			ParentNode = ParentNode.Parent;
		}
		return null;
	}

	GetContextEnvironment(Node: AssureIt.NodeModel): { [key: string]: string;} {
		if(Node.Parent == null) {
			return;
		}
		var ParentNode: AssureIt.NodeModel = Node.Parent;
		var ParentContextNode: AssureIt.NodeModel = this.GetParentContextEnvironment(ParentNode);
		return ParentContextNode.Notes;
	}

	PushEnvironment(ContextList: AssureIt.NodeModel[]): void {
		var env : { [key: string]: string;} = {};
		for (var i=0; i < ContextList.length; ++i) {
			var Node = ContextList[i];
			if(Node.Type != AssureIt.NodeType.Context) {
				continue;
			}
			var DeclKeys: string[] = Object.keys(Node.Notes);
			for (var j=0; j < DeclKeys.length; j++) {
				var DeclKey: string = DeclKeys[j];
				var DeclValue: string = Node.Notes[DeclKey];
				env[DeclKey] = DeclValue;
			}
		}
		this.Env.push(env);
	}

	PopEnvironment(): void {
		this.Env.pop();
	}

	GetEnvironment(Key : string): string {
		for (var i=this.Env.length - 1; i >= 0; --i) {
			var env : { [key: string] : string } = this.Env[i];
			if(env.hasOwnProperty(Key)) {
				return env[Key];
			}
		}
		return null;
	}

	GetMonitor(Node: AssureIt.NodeModel) : string {
		if(Node.Type == AssureIt.NodeType.Evidence) {
			return Node.Notes["Monitor"];
		}
		return "";
	}

	GetMonitorName(Text : string) : string[] {
		// (E3.Monitor == true) => ["(E3", "E3", "Monitor"]
		var res : string[] = Text.match(/^\(+([A-Za-z0-9]+).([A-Za-z0-9]+)/);
		if(res.length == 3) {
			return res.splice(1);
		}
		return []
	}

	GetAction(Node: AssureIt.NodeModel) : string {
		if(Node.Type == AssureIt.NodeType.Evidence) {
			return Node.Notes["Action"];
		}
		return "";
	}

	GetLocation(Node: AssureIt.NodeModel) : string {
		if(Node.Type == AssureIt.NodeType.Evidence) {
			return Node.Notes["Laction"];
		}
		return "";
	}

	GenerateOrder(GoalList: AssureIt.NodeModel[]): AssureIt.NodeModel[] {
		var ListLen: number = GoalList.length;
		var newGoalList: AssureIt.NodeModel[] = [];

		for(var i:number = 0; i < ListLen; i++) {
			newGoalList[i] = GoalList[ListLen - 1 - i];
		}
		return newGoalList;
	}

	Generate(Node: AssureIt.NodeModel, Flow : { [key: string]: AssureIt.NodeModel[];}): string {
		switch(Node.Type) {
			case AssureIt.NodeType.Goal:
				return this.GenerateGoal(Node, Flow);
			case AssureIt.NodeType.Context:
				return this.GenerateContext(Node, Flow);
			case AssureIt.NodeType.Strategy:
				return this.GenerateStrategy(Node, Flow);
			case AssureIt.NodeType.Evidence:
				return this.GenerateEvidence(Node, Flow);
		}
		return "";
	}

	GenerateFunctionHeader(Node: AssureIt.NodeModel) : string {
		//return "boolean Invoke(" + Node.Label + " self)";
		return "boolean " + Node.Label + "(RuntimeContext ctx)";
	}
	GenerateFunctionCall(Node: AssureIt.NodeModel) : string {
		//return "Invoke(new " + Node.Label + "())";
		return Node.Label + "(ctx)";
	}

	GenerateHeader(Node: AssureIt.NodeModel) : string {
		var program : string = "";
		program += this.GenerateFunctionHeader(Node) + " {" + this.linefeed;
		var statement = Node.Statement.replace(/\n+$/g,'');
		if(statement.length > 0) {
			var description : string[] = statement.split(this.linefeed);
			for (var i=0; i < description.length; ++i) {
				if(description[i].indexOf("Monitor=") == 0) {
					continue;
				}
				if(description[i].indexOf("Action=") == 0) {
					continue;
				}
				program += this.indent + "// " + description[i] + this.linefeed;
			}
		}
		return program;
	}

	GenerateFooter(Node: AssureIt.NodeModel, program : string) : string {
		return program + "}";
	}

	GenerateDefault(Node: AssureIt.NodeModel, Flow : { [key: string]: AssureIt.NodeModel[];}) : string {
		var program : string = this.GenerateHeader(Node);
		var child : AssureIt.NodeModel[] = Flow[Node.Label];
		program += this.indent + "return ";
		if(child.length > 0) {
			for (var i=0; i < child.length; ++i) {
				var node : AssureIt.NodeModel = child[i];
				if(i != 0) {
					program += " && ";
				}
				program += this.GenerateFunctionCall(node);
			}
		} else {
			program += "true";
		}
		program += ";" + this.linefeed;
		return this.GenerateFooter(Node, program);
	}

	GenerateGoal(Node: AssureIt.NodeModel, Flow : { [key: string]: AssureIt.NodeModel[];}): string {
		var program : string = this.GenerateHeader(Node);
		var child : AssureIt.NodeModel[] = Flow[Node.Label];

		program += this.indent + "return ";
		if(child.length > 0) {
			for (var i=0; i < child.length; ++i) {
				var node : AssureIt.NodeModel = child[i];
				if(i != 0) {
					program += " && ";
				}
				program += this.GenerateFunctionCall(node);
			}
		} else {
			program += "false/*Undevelopped Goal*/";
		}
		program += ";" + this.linefeed;
		return this.GenerateFooter(Node, program);

	}

	GenerateContext(Node: AssureIt.NodeModel, Flow : { [key: string]: AssureIt.NodeModel[];}): string {
		var program : string = this.GenerateHeader(Node);
		var child : AssureIt.NodeModel[] = Flow[Node.Label];

		var Statements = Node.Statement.split("\n");
		var after : AssureIt.CaseAnnotation = Node.GetAnnotation("after");
		if(after != null) {
			if(after.Body == null || after.Body.length == 0) {
				this.errorMessage.push(new DScriptError(Node.Label, Node.LineNumber, "@after needs parameter"));
			} else {
				program += this.indent + "defined(" + after.Body + ");" + this.linefeed;
			}
		}
		program += this.indent + "return true;" + this.linefeed;
		return this.GenerateFooter(Node, program);
	}

	GenerateStrategy(Node: AssureIt.NodeModel, Flow : { [key: string]: AssureIt.NodeModel[];}): string {
		var program : string = this.GenerateHeader(Node);
		var child : AssureIt.NodeModel[] = Flow[Node.Label];
		child = this.GenerateOrder(child);
		program += this.indent + "return ";

		if(child.length > 0) {
			for (var i=0; i < child.length; ++i) {
				var node : AssureIt.NodeModel = child[i];
				if(i != 0) {
					program += " && ";
				}
				program += this.GenerateFunctionCall(node);
			}
		} else {
			program += "false";
		}
		program += ";" + this.linefeed;

		return this.GenerateFooter(Node, program);

	}

	GenerateLetDecl(ContextEnv: { [key: string]: string;}): string {
		var program: string = "";
		var DeclKeys: string[] = Object.keys(ContextEnv);
		for (var j=0; j < DeclKeys.length; j++) {
			var DeclKey: string = DeclKeys[j];
			var DeclValue: string = ContextEnv[DeclKey];
			program += this.indent + "let " + DeclKey+ " = " + DeclValue + ";" + this.linefeed;
		}

		return program;
	}


	GenerateEvidence(Node: AssureIt.NodeModel, Flow : { [key: string]: AssureIt.NodeModel[];}): string {
		var program : string = this.GenerateHeader(Node);
		var child : AssureIt.NodeModel[] = Flow[Node.Label];

		var Statements = Node.Statement.split("\n");
		var Monitor : string = this.GetMonitor(Node);
		
		if(Monitor != null) {
			var contextenv: { [key: string]: string;} = this.GetContextEnvironment(Node);
			program += this.GenerateLetDecl(contextenv);
			program += this.indent + "boolean ret = " + Monitor + ";" + this.linefeed;
			program += this.indent + "if(!ret) {" + this.linefeed;
			program += this.indent + this.indent + "return false;" + this.linefeed;
			program += this.indent + "}" + this.linefeed;

		}

		var Action : string = this.GetAction(Node);
		var location : string = this.GetLocation(Node);
		if(Action != null) {
			var contextenv: { [key: string]: string;} = this.GetContextEnvironment(Node);
			program += this.GenerateLetDecl(contextenv);
			program += this.indent + "boolean ret = " + Action + ";" + this.linefeed;
			program += this.indent + "if(!ret) {" + this.linefeed;
			program += this.indent + this.indent + "return false;" + this.linefeed;
			program += this.indent + "}" + this.linefeed;
		}

		var ContextList : AssureIt.NodeModel[] = this.GetContextList(child);
		if(child.length != ContextList.length) {
			this.errorMessage.push(new DScriptError(Node.Label, Node.LineNumber, "EvidenceSyntaxError"));
		}

		if(child.length == 0) {
			program += this.indent + "return true";
		} else {
			program += this.indent + "return false/*FIXME support Rebuttal*/";
		}
		program += ";" + this.linefeed;
		return this.GenerateFooter(Node, program);
	}

	GenerateCode(Node : AssureIt.NodeModel, Flow : { [key: string]: AssureIt.NodeModel[];}) : string {
		var queue : AssureIt.NodeModel[] = [];
		var program : string[] = [];
		var flow : string = "";
		program.push(this.Generate(Node, Flow));
		var child : AssureIt.NodeModel[] = Flow[Node.Label];
		Flow[Node.Label] = [];
		var ContextList : AssureIt.NodeModel[] = this.GetContextList(child);
		this.PushEnvironment(ContextList);
		for (var i=0; i < child.length; ++i) {
			program.push(this.GenerateCode(child[i], Flow));
		}
		this.PopEnvironment();
		return flow + program.reverse().join(this.linefeed);
	}

	GenerateRuntimeContext(): string {
		return "class RutimeContext {" + this.linefeed + "}" + this.linefeed + this.linefeed;
	}

	CollectNodeInfo(rootNode: AssureIt.NodeModel) : { [key: string]: AssureIt.NodeModel[]; } {
		var queue : AssureIt.NodeModel[] = [];
		var map: { [key: string]: AssureIt.NodeModel[]; } = {};
		var NodeList : AssureIt.NodeModel[] = [];
		var NodeIdxMap : {[ key: string]: number; } = {};
		queue.push(rootNode);
		NodeList.push(rootNode);
		while(queue.length != 0) {
			var Node : AssureIt.NodeModel = queue.pop();
			var childList : AssureIt.NodeModel[] = [];

			function Each(e : AssureIt.NodeModel) {
				queue.push(e);
				childList.push(e);
				NodeIdxMap[e.Label] = NodeList.length;
				NodeList.push(e);
			}

			this.GetContextList(Node.Children).map(Each);
			this.GetStrategyList(Node.Children).map(Each);
			this.GetGoalList(Node.Children).map(Each);
			this.GetEvidenceList(Node.Children).map(Each);
			map[Node.Label] = childList;
		}

		var graph : Edge[][] = [];
		for (var i=0; i < NodeList.length; ++i) {
			var Edges : Edge[] = [];
			graph.push(Edges);
		}
		for (var i=0; i < NodeList.length; ++i) {
			var Node : AssureIt.NodeModel = NodeList[i];
			var Edges : Edge[] = graph[i];
			for (var j=0; j < map[Node.Label].length; ++j) {
				var Child = map[Node.Label][j];
				Edges.push(new Edge(i, NodeIdxMap[Child.Label]));
			}
		}

		var order : number[] = tsort(graph);
		if(order != null) {
			var child : string[] = [];
			for (var i=0; i < order.length; ++i) {
				var childList : AssureIt.NodeModel[] = [];
				var Node = NodeList[order[i]];
				var labels1 = [];
				var labels2 = [];
				for (var k=0; k < Node.Children.length; ++k) {
					labels1.push(Node.Children[k].Label);
				}
				for (var j=0; j < order.length; ++j) {
					for (var k=0; k < Node.Children.length; ++k) {
						var childNode : AssureIt.NodeModel = Node.Children[k];
						if(NodeList[order[j]].Label == childNode.Label) {
							childList.push(childNode);
							labels2.push(childNode.Label);
						}
					}
				}
				map[Node.Label] = childList;
			}
		}
		return map;
	}

	codegen_(rootNode: AssureIt.NodeModel, ASNData : string): string {
		var res: string = "";
		if(rootNode == null) {
			return res;
		}
		var flow : { [key: string]: AssureIt.NodeModel[]; } = this.CollectNodeInfo(rootNode);
		var dataList : string[] = ASNData.split("\n");

		var queue : AssureIt.NodeModel[] = [];
		queue.push(rootNode);
		while(queue.length != 0) {
			var Node : AssureIt.NodeModel = queue.pop();
			for (var i=0; i < dataList.length; ++i) {
				if(new RegExp("\\*" + Node.Label).test(dataList[i])) {
					Node.LineNumber = i;
				}
			}
			for (var k=0; k < Node.Children.length; ++k) {
				var childNode : AssureIt.NodeModel = Node.Children[k];
				queue.push(childNode);
			}
		}

		res += this.GenerateRuntimeContext();
		res += this.GenerateCode(rootNode, flow) + this.linefeed;
		res += "@Export int main() {" + this.linefeed;
		res += this.indent + "RuntimeContext ctx = new RuntimeContext;" + this.linefeed;
		res += this.indent + "if(" + this.GenerateFunctionCall(rootNode) + ") { return 0; }" + this.linefeed;
		res += this.indent + "return 1;" + this.linefeed;
		res += "}" + this.linefeed;
		return res;
	}

	codegen(Node: AssureIt.NodeModel, ASNData : string): string {
		return this.codegen_(Node, ASNData);
	}
}

