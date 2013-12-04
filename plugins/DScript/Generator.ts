/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/PlugInManager.ts" />

class DScriptGenerator {
	Indent: string = "\t";
 	LineFeed: string = "\n";
 	LibraryManager: DScriptLibraryManager = new DScriptLibraryManager();

	VisitGoalNode(node: AssureIt.NodeModel): string {
		return "";
	}
	VisitStrategyNode(node: AssureIt.NodeModel): string {
		return "";
	}
	VisitEvidenceNode(node: AssureIt.NodeModel): string {
		return "";
	}
	VisitContextNode(node: AssureIt.NodeModel): string {
		return "";
	}
	GenerateMainFunction(): string {
		return "";
	}
};

class DShellCodeGenerator extends DScriptGenerator {
	VisitGoalOrStrategyNode(node: AssureIt.NodeModel): string {
		var ret: string = "";
		ret += "DFault " + node.Label + "() {" + this.LineFeed;
		ret += this.Indent + "return ";
		var children = node.Children;
		if (children.length > 0) {
			for (var i: number = 0; i < children.length; i++) {
				var child = children[i];
				ret += child.Label + "()";
				break;//FIX ME!!;
			}
		}
		else {
			ret += "null/*undevelopped*/";
		}
		ret += ";" + this.LineFeed;
		ret += "}" + this.LineFeed;
		return ret;
	}
	GenerateLocalVariable(node: AssureIt.NodeModel): string {
		var ret: string = "";
		var env = node.Environment;
		for (var key in env) {
			if (key == "prototype" || key == "Reaction") {
				continue;
			}
			else {
				ret += this.Indent + "let " + key + " = \"" + env[key] + "\";" + this.LineFeed;
			}
		}
		return ret;
	}
	GenerateAction(node: AssureIt.NodeModel): string {
		var ret: string = "";

 		/* Define Action Function */
		ret += this.GenerateLocalVariable(node);
		var funcName = node.GetNote("Action"); //already check whether funcName is Null
		var actionFunctionDef = this.LibraryManager.GetLibraryFunction(funcName.replace("()", ""));
		var monitor_raw = node.Environment["Monitor"];
		if (monitor_raw != null) {
			var monitor_fixed: string = monitor_raw
				.replace(/\{|\}/g, "")
				.replace(/[a-zA-Z]+/g, function(matchedStr) {
					return "GetDataFromRec(Location, \"" + matchedStr + "\")";
				}).trim();
			actionFunctionDef = actionFunctionDef
				.replace(/[\(\w]Monitor[\)\w]/g, function(matchedStr) {
					return matchedStr.replace("Monitor", monitor_fixed);
				});
		}
		ret += this.Indent + actionFunctionDef.replace(/\n/g, "\n\t") + this.LineFeed;

		/* Call Action Function */
		ret += this.Indent + "DFault ret = null;" + this.LineFeed;
		ret += this.Indent + "if(Location == LOCATION) {" + this.LineFeed;
		ret += this.Indent + this.Indent + "ret = dlog " + funcName + ";" + this.LineFeed;
		ret += this.Indent + "}" + this.LineFeed;
		ret += this.Indent + "return ret;" + this.LineFeed;

		return ret;
	}

	VisitGoalNode(node: AssureIt.NodeModel): string {
		return this.VisitGoalOrStrategyNode(node);
	}
	VisitStrategyNode(node: AssureIt.NodeModel): string {
		return this.VisitGoalOrStrategyNode(node);
	}
	VisitEvidenceNode(node: AssureIt.NodeModel): string {
		var ret: string = "";
		ret += "DFault " + node.Label + "() {" + this.LineFeed;
		if (node.GetNote("Action") != null) {
			ret += this.GenerateAction(node);
		}
		else {
			ret += this.Indent + "return null/*static evidence*/;";
		}
		ret += "}" + this.LineFeed;
		return ret;
	}
	VisitContextNode(node:AssureIt.NodeModel): string {
		var ret: string = "";
		ret += "DFault " + node.Label + "() {" + this.LineFeed;
		ret += this.Indent + "return null;" + this.LineFeed;
		ret += "}" + this.LineFeed;
		return ret;
	}

	GenerateMainFunction(): string { //TODO
		var ret: string = "";
		return ret;
	}
}

class DScriptLibraryManager {
	ServerApi: AssureIt.ServerAPI;
	Cache: { [funcName: string]: string };

	constructor() {
		this.ServerApi = null;
		this.Cache = {};
	}
	GetLibraryFunction(funcName: string): string {
		var ret = "DFault ${funcName}() { return null; }".replace("${funcName}", funcName);
		if (this.ServerApi == null) {
			console.log("DScriptLibraryManager error : not set ServerApi yet");
		}
		else if (funcName in this.Cache) {
			ret = this.Cache[funcName];
		}
		else {
			var script = this.ServerApi.GetDScript(funcName);
			if (script != null) {
				ret = script.script;
				this.Cache[funcName] = script.script;
			}
		}
		return ret;
	}
}

// class DScriptGenerator {
// 	Indent: string;
// 	LineFeed: string;
// 	GenMainFunctionFlag: boolean;
// 	LibraryManager: DScriptLibraryManager;

// 	constructor(genMainFunctionFlag: boolean = false) {
// 		this.Indent = "\t";
// 		this.LineFeed = "\n";
// 		this.GenMainFunctionFlag = genMainFunctionFlag;
// 		this.LibraryManager = new DScriptLibraryManager();
// 	}

// // 	GenerateMainFunction(): string {
// // 		var ret: string = "";
// // 		ret += "@Export int main() {" + this.LineFeed;
// // 		ret += this.indent + "RuntimeContext ctx = new RuntimeContext();" + this.LineFeed;
// // 		ret += this.indent + "while(true) {" + this.LineFeed;
// // 		ret += this.indent + this.indent + this.GenerateFunctionCall(rootNode) + ";" + this.LineFeed;
// // 		ret += this.indent + this.indent + "sleep 30" + this.LineFeed;
// // 		ret += this.indent + "}" + this.LineFeed;
// // 		ret += this.indent + "return 0;" + this.LineFeed;
// // 		ret += "}" + this.LineFeed;
// // 		return ret;
// // 	}

// 	SearchChildrenByType(node: AssureIt.NodeModel, type: AssureIt.NodeType): AssureIt.NodeModel[] {
// 		return node.Children.filter(function (child: AssureIt.NodeModel) {
// 			return child.Type == type;
// 		});
// 	}
// 	SearchAnnotationByName(node: AssureIt.NodeModel, name: string): AssureIt.CaseAnnotation {
// 		var ret: AssureIt.CaseAnnotation = node.GetAnnotation(name);
// 		if (ret != null) {
// 			//pass
// 		}
// 		else {
// 			var contexts = this.SearchChildrenByType(node, AssureIt.NodeType.Context);
// 			for (var i: number = 0; i < contexts.length; i++) {
// 				var context = contexts[i];
// 				ret = context.GetAnnotation(name);
// 				if (ret != null) break;
// 			}
// 		}
// 		return ret;
// 	}

// 	GenerateDShellDecl(): string {
// //		return "require dshell;" + this.LineFeed + this.LineFeed;
// 		var ret: string = ""
// 		ret += "class DFault;" + this.LineFeed;
// 		ret += "let LOCATION = \"ServerA\";" + this.LineFeed;
// 		ret += this.LineFeed;
// 		return ret;
// 	}
// 	GenerateRuntimeContextDecl(): string {
// 		return "class RuntimeContext {" + this.LineFeed + "}" + this.LineFeed + this.LineFeed;
// 	}
// 	GenerateLocalVariable(env): string {
// 		var ret: string = "";
// 		for (var key in env) {
// 			if (key == "prototype" || key == "Reaction") {
// 				continue;
// 			}
// 			else if (key == "Monitor") {
// 				/*lazy generation*/
// 				// var condStr = env["Monitor"]
// 				// 	.replace(/\{|\}/g, "")
// 				// 	.replace(/[a-zA-Z]+/g, function(matchedStr) {
// 				// 		return "GetDataFromRec(Location, \"" + matchedStr + "\")";
// 				// 	})
// 				// 	.trim();
// 				// ret += this.Indent + "let Monitor = " + condStr + ";" + this.LineFeed;
// 			}
// 			else {
// 				ret += this.Indent + "let " + key + " = \"" + env[key] + "\";" + this.LineFeed;
// 			}
// 		}
// 		return ret;
// 	}
// 	GenerateAction(funcName: string, env): string {
// 		var ret: string = "";
// 		ret += this.GenerateLocalVariable(env);

// 		/* Define Action Function */
// 		var actionFunctionDef =	this.LibraryManager.GetLibraryFunction(funcName.replace("()", ""));
// 		if (env["Monitor"] != null) {
// 			var monitor: string = env["Monitor"]
// 				.replace(/\{|\}/g, "")
// 				.replace(/[a-zA-Z]+/g, function(matchedStr) {
// 					return "GetDataFromRec(Location, \"" + matchedStr + "\")";
// 				}).trim();
// 			actionFunctionDef = actionFunctionDef
// 				.replace(/[\(\w]Monitor[\)\w]/g, function(matchedStr) {
// 					return matchedStr.replace("Monitor", monitor);
// 				});
// 		}
// 		ret += this.Indent + actionFunctionDef.replace(/\n/g, "\n\t") + this.LineFeed;

// 		/* Call Action Function */
// 		ret += this.Indent + "DFault ret = null;" + this.LineFeed;
// 		ret += this.Indent + "if(Location == LOCATION) {" + this.LineFeed;
// 		ret += this.Indent + this.Indent + "ret = dlog " + funcName + ";" + this.LineFeed;
// 		ret += this.Indent + "}" + this.LineFeed;
// 		ret += this.Indent + "return ret;" + this.LineFeed;

// 		return ret;
// 	}
// 	GenerateNodeFunction_GoalOrStrategy(node: AssureIt.NodeModel): string {
// 		var children = node.Children;
// 		var ret: string = "";
// 		ret += "DFault " + node.Label + "() {" + this.LineFeed;
// 		ret += this.Indent + "return ";
// 		if (children.length > 0) {
// 			var funcCall: string = "";
// 			for (var i: number = 0; i < children.length; i++) {
// 				var child = children[i];
// 				if (child.Type == AssureIt.NodeType.Context ||
// 					this.SearchAnnotationByName(child, "OnlyIf") != null) {
// 					continue;
// 				}
// 				else {
// 					//if (funcCall != "") funcCall += " && "; TODO: DFault doesn't support '&&' operator now
// 					funcCall += child.Label + "()";
// 					break;
// 				}
// 			}
// 			ret += funcCall;
// 		}
// 		else {
// 			ret += "null/*Undevelopped*/";
// 		}
// 		ret += ";" + this.LineFeed;
// 		ret += "}" + this.LineFeed;
// 		ret = ret.replace(/\$\{Label\}/g, node.Label);
// 		return ret;
// 	}
// 	GenerateNodeFunction_Evidence(node: AssureIt.NodeModel): string {
// 		var action: string = node.GetNote("Action");
// 		var ret: string = "";
// 		ret += "DFault " + node.Label + "() {" + this.LineFeed;
// 		if (action != null) {
// 			ret += this.GenerateAction(action, node.Environment);
// 		}
// 		else {
// 			ret += this.Indent + "return null;";
// 		}
// 		ret += "}" + this.LineFeed;
// 		return ret;
// 	}

// 	GenerateNodeFunction(node: AssureIt.NodeModel): string {
// 		var ret: string = "";
// 		for (var i: number = 0; i < node.Children.length; i++) {
// 			ret += this.GenerateNodeFunction(node.Children[i]);
// 		}
// 		switch(node.Type) {
//  		case AssureIt.NodeType.Context:
// // 			ret += this.GenerateNodeFunction_Context(node);
// 			break;
// 		case AssureIt.NodeType.Goal:
// 		case AssureIt.NodeType.Strategy:
// 			ret += this.GenerateNodeFunction_GoalOrStrategy(node);
// 			ret += this.LineFeed;
// 			break;
// 		case AssureIt.NodeType.Evidence:
// 			ret += this.GenerateNodeFunction_Evidence(node);
// 			ret += this.LineFeed;
// 			break;
// 		default:
// 			console.log("DScriptGenerator: invalid Node Type")
// 			console.log(node);
// 		}
// 		return ret;
// 	}

// 	CodeGen(rootNode: AssureIt.NodeModel): string {
// 		var ret: string = "";
// 		if(rootNode == null) {
// 			//pass
// 		}
// 		else {
// 			//ret += this.GenerateDShellDecl();
// 			//ret += this.GenerateRuntimeContextDecl();
// 			ret += this.GenerateNodeFunction(rootNode);
// // 			if (this.genMainFunctionFlag) {
// // 				ret += GenerateMainFunction();
// // 			}
// 		}
// 		return ret;
// 	}
// }
