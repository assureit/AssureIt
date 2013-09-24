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
	for (var i: number = 0; i < g[v].length; i = i + 1) {
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
	var n: number = g.length;
	var color: number[] = [];
	var order: number[] = [];
	for (var i: number = 0; i < n; i++) {
		color.push(0);
	}
	for (i = 0; i < n; i++) {
		if (!color[i] && !visit(g, i, order, color)) {
			return null;
		}
	}
	return order.reverse();
}

class DScriptError {
	NodeName: string;
	LineNumber: number;
	Message: string;
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
		return List.filter(function (Node: AssureIt.NodeModel) {
			return Node.Type == AssureIt.NodeType.Goal;
		});
	}

	GetContextList(List: AssureIt.NodeModel[]): AssureIt.NodeModel[] {
		return List.filter(function (Node: AssureIt.NodeModel) {
			return Node.Type == AssureIt.NodeType.Context;
		});
	}

	GetEvidenceList(List: AssureIt.NodeModel[]): AssureIt.NodeModel[] {
		return List.filter(function (Node: AssureIt.NodeModel) {
			return Node.Type == AssureIt.NodeType.Evidence;
		});
	}

	GetStrategyList(List: AssureIt.NodeModel[]): AssureIt.NodeModel[] {
		return List.filter(function (Node: AssureIt.NodeModel) {
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
		for (var i: number = 0; i < ContextList.length; ++i) {
			var Node: AssureIt.NodeModel = ContextList[i];
			if(Node.Type != AssureIt.NodeType.Context) {
				continue;
			}
			var DeclKeys: string[] = Object.keys(Node.Notes);
			for (var j: number = 0; j < DeclKeys.length; j++) {
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

	GetEnvironment(Key: string): string {
		for (var i:number = this.Env.length - 1; i >= 0; --i) {
			var env : { [key: string] : string } = this.Env[i];
			if(env.hasOwnProperty(Key)) {
				return env[Key];
			}
		}
		return null;
	}

	GetMonitor(Node: AssureIt.NodeModel): string {
		if(Node.Type == AssureIt.NodeType.Evidence) {
			return Node.Notes["Monitor"];
		}
		return "";
	}

	GetAction(Node: AssureIt.NodeModel): string {
		if(Node.Type == AssureIt.NodeType.Evidence) {
			return Node.Notes["Action"];
		}
		return "";
	}

	Generate(Node: AssureIt.NodeModel, Flow: { [key: string]: AssureIt.NodeModel[];}): string {
		switch(Node.Type) {
			case AssureIt.NodeType.Goal:
				return this.GenerateGoal(Node, Flow);
//			case AssureIt.NodeType.Context:
//				return this.GenerateContext(Node, Flow);
			case AssureIt.NodeType.Strategy:
				return this.GenerateStrategy(Node, Flow);
			case AssureIt.NodeType.Evidence:
				return this.GenerateEvidence(Node, Flow);
		}
		return "";
	}

	GenerateFunctionHeader(Node: AssureIt.NodeModel): string {
		return "DFault " + Node.Label + "(RuntimeContext ctx)";
	}
	GenerateFunctionCall(Node: AssureIt.NodeModel): string {
		return Node.Label + "(ctx)";
	}

	GenerateHeader(Node: AssureIt.NodeModel): string {
		var program: string = "";
		program += this.GenerateFunctionHeader(Node) + " {" + this.linefeed;
		var statement: string = Node.Statement.replace(/\n+$/g,'');
		if(statement.length > 0) {
			var description : string[] = statement.split(this.linefeed);
			for (var i: number = 0; i < description.length; ++i) {
				program += this.indent + "// " + description[i] + this.linefeed;
			}
		}
		return program;
	}

	GenerateFooter(Node: AssureIt.NodeModel, program: string): string {
		return program + "}";
	}

	GenerateDefault(Node: AssureIt.NodeModel, Flow : { [key: string]: AssureIt.NodeModel[];}) : string {
		var program: string = this.GenerateHeader(Node);
		var child: AssureIt.NodeModel[] = Flow[Node.Label];
		program += this.indent + "return ";
		if(child.length > 0) {
			for (var i: number = 0; i < child.length; ++i) {
				var node : AssureIt.NodeModel = child[i];
				if(i != 0) {
					program += " && ";
				}
				program += this.GenerateFunctionCall(node);
			}
		} else {
			program += "null";
		}
		program += ";" + this.linefeed;
		return this.GenerateFooter(Node, program);
	}

	GenerateGoal(Node: AssureIt.NodeModel, Flow : { [key: string]: AssureIt.NodeModel[];}): string {
		var program: string = this.GenerateHeader(Node);
		var child: AssureIt.NodeModel[] = Flow[Node.Label];

		program += this.indent + "return ";
		if(child.length > 0) {
			for (var i: number = 0; i < child.length; ++i) {
				var node : AssureIt.NodeModel = child[i];
				if(node.Type == AssureIt.NodeType.Context) {
					continue;
				}
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

	GenerateContext(Node: AssureIt.NodeModel, Flow: { [key: string]: AssureIt.NodeModel[];}): string {
		var program: string = this.GenerateHeader(Node);
		program += this.indent + "return null;" + this.linefeed;
		return this.GenerateFooter(Node, program);
	}

	GenerateAnnotationStrategy(child: AssureIt.NodeModel[]): string {
		var program: string = "";
		for(var i:number = 0; i < child.length; i++) {
			var goal: AssureIt.NodeModel = child[i];
			var contextindex: number = this.GetContextIndex(goal);
			var context: AssureIt.NodeModel = goal.Children[contextindex];
			if(context.GetAnnotation("OnlyIf") != null) {
				var reaction: string = context.Notes["Reaction"];
				var goallabel: string = child[0].Label;
				var parentgoallabel: string = context.Parent.Label;
				program += this.indent + "DFault ret = " + goallabel + "(ctx);" + this.linefeed;
				program += this.indent + "if (ret.getLocation() == \"" + reaction + "\") {" + this.linefeed;
				program += this.indent + this.indent + "ret = " + parentgoallabel + "(ctx);" + this.linefeed;
				program += this.indent + "}" + this.linefeed;
				program += this.indent + "return ret;" + this.linefeed;
				return program;
			}
		}
		return "";
	}

	GenerateDefaultStrategy(child: AssureIt.NodeModel[]): string {
		var program: string = "";
		program += this.indent + "return ";
		if(child.length > 0) {
			for (var i: number = 0; i < child.length; ++i) {
				var node : AssureIt.NodeModel = child[i];
				if(i != 0) {
					program += " && ";
				}
				program += this.GenerateFunctionCall(node);
			}
		}
		else {
			program += "false";
		}
		program += ";" + this.linefeed;
		return program;
	}

	GenerateStrategy(Node: AssureIt.NodeModel, Flow : { [key: string]: AssureIt.NodeModel[];}): string {
		var program: string = this.GenerateHeader(Node);
		var child: AssureIt.NodeModel[] = Flow[Node.Label].reverse();
		var code: string = this.GenerateAnnotationStrategy(child);

		if(code.length == 0) {
			program += this.GenerateDefaultStrategy(child);
		}
		return this.GenerateFooter(Node, program + code);
	}

	GenerateGetDataFromRecFunction(Node: AssureIt.NodeModel, DeclValue: string): string {
		var program: string = "";
		var monitor: string[] = DeclValue.replace("{", "").replace("}", "").split(" ");
		var monitorlen: number = monitor.length;
		for(var i: number = monitorlen; i >= 0; i--) {
			if(monitor[i] == "") {
				monitor.splice(i, 1);
			}
		}
		if(monitor.length != 3) {
			this.errorMessage.push(new DScriptError(Node.Label, Node.LineNumber, "Monitor evaluation formula error"));
		}
		else {
			var LHS: string = monitor[0];
			var operand: string = monitor[1];
			var RHS: string = monitor[2];
			program += this.indent + "boolean Monitor = GetDatafromRec(Location, " + LHS + ") " + operand + " " + RHS + ";" + this.linefeed;
		}
		return program;
	}

	GenerateLetDecl(Node: AssureIt.NodeModel, ContextEnv: { [key: string]: string;}): string {
		var program: string = "";
		var DeclKeys: string[] = Object.keys(ContextEnv);
		for (var j: number = 0; j < DeclKeys.length; j++) {
			var DeclKey: string = DeclKeys[j];
			var DeclValue: string = ContextEnv[DeclKey];
			if(DeclKey == "Monitor") {
				program += this.GenerateGetDataFromRecFunction(Node, DeclValue);
			}
			else if(DeclKey == "Reaction") {
				program += this.indent + "String " + DeclKey + " = " + "\"" + DeclValue + "\";" + this.linefeed;
			}
			else if(DeclKey == "Location") {
				program += this.indent + "let " + DeclKey+ " = \"" + DeclValue + "\";" + this.linefeed;
			}
			else {
				program += this.indent + "let " + DeclKey+ " = " + DeclValue + ";" + this.linefeed;
			}
		}

		return program;
	}

	GenerateFunction(Node: AssureIt.NodeModel, Function: string): string {
		var program: string = "";
		var contextenv: { [key: string]: string;} = this.GetContextEnvironment(Node);
		program += this.GenerateLetDecl(Node, contextenv);
		program += this.indent + "if(Location == LOCATION) {" + this.linefeed;
		program += this.indent + this.indent + "DFault ret = " + Function + ";" + this.linefeed;
		program += this.indent + this.indent + "dexec " + Function + this.linefeed;
		program += this.indent + "}" + this.linefeed;
		program += this.indent + "return ret;" + this.linefeed;
		return program;
	}


	GenerateEvidence(Node: AssureIt.NodeModel, Flow : { [key: string]: AssureIt.NodeModel[];}): string {
		var program: string = this.GenerateHeader(Node);
		var child: AssureIt.NodeModel[] = Flow[Node.Label];
		var Monitor: string = this.GetMonitor(Node);
		var Action: string = this.GetAction(Node);
		var ContextList : AssureIt.NodeModel[] = this.GetContextList(child);

		if(Monitor != null) {
			program += this.GenerateFunction(Node, Monitor);
		}

		if(Action != null) {
			program += this.GenerateFunction(Node, Action);
		}

		if(child.length != ContextList.length) {
			this.errorMessage.push(new DScriptError(Node.Label, Node.LineNumber, "EvidenceSyntaxError"));
		}

		if(Monitor == null && Action == null) {
			if(child.length == 0) {
				program += this.indent + "return null";
			} else {
				program += this.indent + "return false/*FIXME support Rebuttal*/";
			}
			program += ";" + this.linefeed;
		}

		return this.GenerateFooter(Node, program);
	}

	GenerateCode(Node: AssureIt.NodeModel, Flow: { [key: string]: AssureIt.NodeModel[];}): string {
		var queue: AssureIt.NodeModel[] = [];
		var program: string[] = [];
		var flow: string = "";
		program.push(this.Generate(Node, Flow));
		var child: AssureIt.NodeModel[] = Flow[Node.Label];
		Flow[Node.Label] = [];
		var ContextList: AssureIt.NodeModel[] = this.GetContextList(child);
		this.PushEnvironment(ContextList);
		for (var i: number = 0; i < child.length; ++i) {
			program.push(this.GenerateCode(child[i], Flow));
		}
		this.PopEnvironment();
		return flow + program.reverse().join(this.linefeed);
	}

	GenerateRuntimeContext(): string {
		return "class RutimeContext {" + this.linefeed + "}" + this.linefeed + this.linefeed;
	}

	GenerateMainFunction(rootNode: AssureIt.NodeModel, flow: { [key: string]: AssureIt.NodeModel[];}): string {
		var program: string = "";
		program += this.GenerateRuntimeContext();
		program += this.GenerateCode(rootNode, flow) + this.linefeed;
		program += "@Export int main() {" + this.linefeed;
		program += this.indent + "RuntimeContext ctx = new RuntimeContext();" + this.linefeed;
		program += this.indent + "while(true) {" + this.linefeed;
		program += this.indent + this.indent + this.GenerateFunctionCall(rootNode) + ";" + this.linefeed;
		program += this.indent + this.indent + "sleep 30" + this.linefeed;
		program += this.indent + "}" + this.linefeed;
		program += this.indent + "return 0;" + this.linefeed;
		program += "}" + this.linefeed;
		return program;
	}

	CollectNodeInfo(rootNode: AssureIt.NodeModel) : { [key: string]: AssureIt.NodeModel[]; } {
		var queue: AssureIt.NodeModel[] = [];
		var map:{ [key: string]: AssureIt.NodeModel[]; } = {};
		var NodeList: AssureIt.NodeModel[] = [];
		var NodeIdxMap: {[ key: string]: number; } = {};
		queue.push(rootNode);
		NodeList.push(rootNode);
		while(queue.length != 0) {
			var Node: AssureIt.NodeModel = queue.pop();
			var childList: AssureIt.NodeModel[] = [];

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

		var graph: Edge[][] = [];
		for (var i: number = 0; i < NodeList.length; ++i) {
			var Edges : Edge[] = [];
			graph.push(Edges);
		}
		for (var i: number = 0; i < NodeList.length; ++i) {
			var Node: AssureIt.NodeModel = NodeList[i];
			var Edges: Edge[] = graph[i];
			for (var j: number = 0; j < map[Node.Label].length; ++j) {
				var Child: AssureIt.NodeModel = map[Node.Label][j];
				Edges.push(new Edge(i, NodeIdxMap[Child.Label]));
			}
		}

		var order: number[] = tsort(graph);
		if(order != null) {
			var child: string[] = [];
			for (var i: number = 0; i < order.length; ++i) {
				var childList: AssureIt.NodeModel[] = [];
				var Node: AssureIt.NodeModel = NodeList[order[i]];
				var labels1: string[] = [];
				var labels2: string[] = [];
				for (var k: number = 0; k < Node.Children.length; ++k) {
					labels1.push(Node.Children[k].Label);
				}
				for (var j: number = 0; j < order.length; ++j) {
					for (var k: number = 0; k < Node.Children.length; ++k) {
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

	GenerateDShellDecl(): string {
		return "require dshell;" + this.linefeed + this.linefeed;
	}

	GenerateImportStatement(ViewMap: {[index: string]: AssureIt.NodeModel }, flow : { [key: string]: AssureIt.NodeModel[]; }): string {
		var program: string = "";
		var keys: string[] = Object.keys(flow);
		for(var i: number = 0; i < keys.length; i++) {
			var label: string = keys[i];
			var element: AssureIt.NodeModel = ViewMap[label];
			var action: string = this.GetAction(element);
			if(label.charAt(0) == "E" && action.length > 0) {
				program += "import " + action.replace("()", "") + ".ds" + this.linefeed;
			}
		}
		program += "import config.ds" + this.linefeed;
		program += this.linefeed;
		return program;
	}

	codegen_(ViewMap: {[index: string]: AssureIt.NodeModel }, rootNode: AssureIt.NodeModel, ASNData: string): string {
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
			for (var i: number = 0; i < dataList.length; ++i) {
				if(new RegExp("\\*" + Node.Label).test(dataList[i])) {
					Node.LineNumber = i;
				}
			}
			for (var k: number = 0; k < Node.Children.length; ++k) {
				var childNode : AssureIt.NodeModel = Node.Children[k];
				queue.push(childNode);
			}
		}
		res += this.GenerateDShellDecl();
		res += this.GenerateImportStatement(ViewMap, flow);
		res += this.GenerateMainFunction(rootNode, flow);
		return res;
	}

	codegen(ViewMap: {[index: string]: AssureIt.NodeModel }, Node: AssureIt.NodeModel, ASNData : string): string {
		return this.codegen_(ViewMap, Node, ASNData);
	}
}

