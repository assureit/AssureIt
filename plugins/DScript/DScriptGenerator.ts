/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/PlugInManager.ts" />

class DScriptGenerator {
	Indent: string;
	LineFeed: string;
	GenMainFunctionFlag: boolean;

	constructor(genMainFunctionFlag: boolean = false) {
		this.Indent = "\t";
		this.LineFeed = "\n";
		this.GenMainFunctionFlag = genMainFunctionFlag;
	}

// 	GenerateMainFunction(): string {
// 		var ret: string = "";
// 		ret += "@Export int main() {" + this.LineFeed;
// 		ret += this.indent + "RuntimeContext ctx = new RuntimeContext();" + this.LineFeed;
// 		ret += this.indent + "while(true) {" + this.LineFeed;
// 		ret += this.indent + this.indent + this.GenerateFunctionCall(rootNode) + ";" + this.LineFeed;
// 		ret += this.indent + this.indent + "sleep 30" + this.LineFeed;
// 		ret += this.indent + "}" + this.LineFeed;
// 		ret += this.indent + "return 0;" + this.LineFeed;
// 		ret += "}" + this.LineFeed;
// 		return ret;
// 	}

	SearchChildrenByType(node: AssureIt.NodeModel, type: AssureIt.NodeType): AssureIt.NodeModel[] {
		return node.Children.filter(function (child: AssureIt.NodeModel) {
			return child.Type == type;
		});
	}
	SearchAnnotationByName(node: AssureIt.NodeModel, name: string): AssureIt.CaseAnnotation {
		var ret: AssureIt.CaseAnnotation = node.GetAnnotation(name);
		if (ret != null) {
			//pass
		}
		else {
			var contexts = this.SearchChildrenByType(node, AssureIt.NodeType.Context);
			for (var i: number = 0; i < contexts.length; i++) {
				var context = contexts[i];
				ret = context.GetAnnotation(name);
				if (ret != null) break;
			}
		}
		return ret;
	}

	GenerateDShellDecl(): string {
		return "require dshell;" + this.LineFeed + this.LineFeed;
	}
	GenerateRuntimeContextDecl(): string {
		return "class RuntimeContext {" + this.LineFeed + "}" + this.LineFeed + this.LineFeed;
	}
	GenerateLocalVariable(env): string {
		var ret: string = "";
		for (var key in env) {
			if (key == "prototype" || key == "Reaction") {
				continue;
			}
			else if (key == "Monitor") {
				// lazy generation
			}
			else {
				ret += this.Indent + "let " + key + " = \"" + env[key] + "\";" + this.LineFeed;
			}
		}
		return ret;
	}
	GenerateAction(funcName: string, env): string {
		var ret: string = "";
		ret += this.GenerateLocalVariable(env);

		/* Define Action Function */
		ret += this.Indent + "DFault " + funcName + " {" + this.LineFeed;

		if("Monitor" in env) {
			var condStr = env["Monitor"]
							.replace(/\{|\}/g, "")
							.replace(/[a-zA-Z]+/g, function(matchedStr) {
									return "GetDataFromRec(Location, \"" + matchedStr + "\")";
							})
							.trim();
			ret += this.Indent + this.Indent + "boolean Monitor = " + condStr + ";" + this.LineFeed;
		}

 		ret += __dscript__.script.funcdef[funcName]
 			.replace(/\n/g, this.LineFeed + this.Indent + this.Indent)   // FIXME
		ret += this.LineFeed;
		ret = ret.replace(/\t\t\n/, "");
		ret += this.Indent + "}" + this.LineFeed;

		/* Call Action Function */
		ret += this.Indent + "DFault ret = null;" + this.LineFeed;
		ret += this.Indent + "if(Location == LOCATION) {" + this.LineFeed;
		ret += this.Indent + this.Indent + "ret = dlog " + funcName + ";" + this.LineFeed;
		ret += this.Indent + "}" + this.LineFeed;
		ret += this.Indent + "return ret;" + this.LineFeed;

		return ret;
	}

	GenerateNodeFunction_GoalOrStrategy(node: AssureIt.NodeModel): string {
		var children = node.Children;
		var ret: string = "";
		ret += "DFault " + node.Label + "() {" + this.LineFeed;
		ret += this.Indent + "return ";
		if (children.length > 0) {
			var funcCall: string = "";
			for (var i: number = 0; i < children.length; i++) {
				var child = children[i];
				if (child.Type == AssureIt.NodeType.Context ||
					this.SearchAnnotationByName(child, "OnlyIf") != null) {
					continue;
				}
				else {
					if (funcCall != "") funcCall += " && ";
					funcCall += child.Label + "()"
				}
			}
			ret += funcCall;
		}
		else {
			ret += "null/*Undevelopped*/";
		}
		ret += ";" + this.LineFeed;
		ret += "}" + this.LineFeed;
		ret = ret.replace(/\$\{Label\}/g, node.Label);
		return ret;
	}
	GenerateNodeFunction_Evidence(node: AssureIt.NodeModel): string {
		var action: string = node.GetNote("Action");
		var ret: string = "";
		ret += "DFault " + node.Label + "() {" + this.LineFeed;
		if (action != null) {
			ret += this.GenerateAction(action, node.Environment);
		}
		else {
			ret += this.Indent + "return null;";
		}
		ret += "}" + this.LineFeed;
		return ret;
	}

	GenerateNodeFunction(node: AssureIt.NodeModel): string {
		var ret: string = "";
		for (var i: number = 0; i < node.Children.length; i++) {
			ret += this.GenerateNodeFunction(node.Children[i]);
			ret += this.LineFeed;
		}
		switch(node.Type) {
 		case AssureIt.NodeType.Context:
// 			ret += this.GenerateNodeFunction_Context(node);
			break;
		case AssureIt.NodeType.Goal:
		case AssureIt.NodeType.Strategy:
			ret += this.GenerateNodeFunction_GoalOrStrategy(node);
			break;
		case AssureIt.NodeType.Evidence:
			ret += this.GenerateNodeFunction_Evidence(node);
			break;
		default:
			console.log("DScriptGenerator: invalid Node Type")
			console.log(node);
		}
		return ret;
	}

	CodeGen(rootNode: AssureIt.NodeModel): string {
		var ret: string = "";
		if(rootNode == null) {
			//pass
		}
		else {
			//res += this.GenerateDShellDecl();
			//res += this.GenerateRuntimeContextDecl();
			ret += this.GenerateNodeFunction(rootNode);
// 			if (this.genMainFunctionFlag) {
// 				ret += GenerateMainFunction();
// 			}
		}
		return ret;
	}
}
