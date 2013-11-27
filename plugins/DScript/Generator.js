var DScriptLibraryManager = (function () {
    function DScriptLibraryManager() {
        this.ServerApi = null;
        this.Cache = {};
    }
    DScriptLibraryManager.prototype.GetLibraryFunction = function (funcName) {
        var ret = "DFault ${funcName}() { return null; }".replace("${funcName}", funcName);
        if (this.ServerApi == null) {
            console.log("DScriptLibraryManager error : not set ServerApi yet");
        } else if (funcName in this.Cache) {
            ret = this.Cache[funcName];
        } else {
            var script = this.ServerApi.GetDScript(funcName);
            if (script != null) {
                ret = script.script;
                this.Cache[funcName] = script.script;
            }
        }
        return ret;
    };
    return DScriptLibraryManager;
})();

var DScriptGenerator = (function () {
    function DScriptGenerator(genMainFunctionFlag) {
        if (typeof genMainFunctionFlag === "undefined") { genMainFunctionFlag = false; }
        this.Indent = "\t";
        this.LineFeed = "\n";
        this.GenMainFunctionFlag = genMainFunctionFlag;
        this.LibraryManager = new DScriptLibraryManager();
    }
    DScriptGenerator.prototype.SearchChildrenByType = function (node, type) {
        return node.Children.filter(function (child) {
            return child.Type == type;
        });
    };
    DScriptGenerator.prototype.SearchAnnotationByName = function (node, name) {
        var ret = node.GetAnnotation(name);
        if (ret != null) {
        } else {
            var contexts = this.SearchChildrenByType(node, AssureIt.NodeType.Context);
            for (var i = 0; i < contexts.length; i++) {
                var context = contexts[i];
                ret = context.GetAnnotation(name);
                if (ret != null)
                    break;
            }
        }
        return ret;
    };

    DScriptGenerator.prototype.GenerateDShellDecl = function () {
        var ret = "";
        ret += "class DFault;" + this.LineFeed;
        ret += "let LOCATION = \"ServerA\";" + this.LineFeed;
        ret += this.LineFeed;
        return ret;
    };
    DScriptGenerator.prototype.GenerateRuntimeContextDecl = function () {
        return "class RuntimeContext {" + this.LineFeed + "}" + this.LineFeed + this.LineFeed;
    };
    DScriptGenerator.prototype.GenerateLocalVariable = function (env) {
        var ret = "";
        for (var key in env) {
            if (key == "prototype" || key == "Reaction") {
                continue;
            } else if (key == "Monitor") {
            } else {
                ret += this.Indent + "let " + key + " = \"" + env[key] + "\";" + this.LineFeed;
            }
        }
        return ret;
    };
    DScriptGenerator.prototype.GenerateAction = function (funcName, env) {
        var ret = "";
        ret += this.GenerateLocalVariable(env);

        var actionFunctionDef = this.LibraryManager.GetLibraryFunction(funcName.replace("()", ""));
        if (env["Monitor"] != null) {
            var monitor = env["Monitor"].replace(/\{|\}/g, "").replace(/[a-zA-Z]+/g, function (matchedStr) {
                return "GetDataFromRec(Location, \"" + matchedStr + "\")";
            }).trim();
            actionFunctionDef = actionFunctionDef.replace(/[\(\w]Monitor[\)\w]/g, function (matchedStr) {
                return matchedStr.replace("Monitor", monitor);
            });
        }
        ret += this.Indent + actionFunctionDef.replace(/\n/g, "\n\t") + this.LineFeed;

        ret += this.Indent + "DFault ret = null;" + this.LineFeed;
        ret += this.Indent + "if(Location == LOCATION) {" + this.LineFeed;
        ret += this.Indent + this.Indent + "ret = dlog " + funcName + ";" + this.LineFeed;
        ret += this.Indent + "}" + this.LineFeed;
        ret += this.Indent + "return ret;" + this.LineFeed;

        return ret;
    };

    DScriptGenerator.prototype.GenerateNodeFunction_GoalOrStrategy = function (node) {
        var children = node.Children;
        var ret = "";
        ret += "DFault " + node.Label + "() {" + this.LineFeed;
        ret += this.Indent + "return ";
        if (children.length > 0) {
            var funcCall = "";
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (child.Type == AssureIt.NodeType.Context || this.SearchAnnotationByName(child, "OnlyIf") != null) {
                    continue;
                } else {
                    funcCall += child.Label + "()";
                    break;
                }
            }
            ret += funcCall;
        } else {
            ret += "null/*Undevelopped*/";
        }
        ret += ";" + this.LineFeed;
        ret += "}" + this.LineFeed;
        ret = ret.replace(/\$\{Label\}/g, node.Label);
        return ret;
    };
    DScriptGenerator.prototype.GenerateNodeFunction_Evidence = function (node) {
        var action = node.GetNote("Action");
        var ret = "";
        ret += "DFault " + node.Label + "() {" + this.LineFeed;
        if (action != null) {
            ret += this.GenerateAction(action, node.Environment);
        } else {
            ret += this.Indent + "return null;";
        }
        ret += "}" + this.LineFeed;
        return ret;
    };

    DScriptGenerator.prototype.GenerateNodeFunction = function (node) {
        var ret = "";
        for (var i = 0; i < node.Children.length; i++) {
            ret += this.GenerateNodeFunction(node.Children[i]);
        }
        switch (node.Type) {
            case AssureIt.NodeType.Context:
                break;
            case AssureIt.NodeType.Goal:
            case AssureIt.NodeType.Strategy:
                ret += this.GenerateNodeFunction_GoalOrStrategy(node);
                ret += this.LineFeed;
                break;
            case AssureIt.NodeType.Evidence:
                ret += this.GenerateNodeFunction_Evidence(node);
                ret += this.LineFeed;
                break;
            default:
                console.log("DScriptGenerator: invalid Node Type");
                console.log(node);
        }
        return ret;
    };

    DScriptGenerator.prototype.CodeGen = function (rootNode) {
        var ret = "";
        if (rootNode == null) {
        } else {
            ret += this.GenerateNodeFunction(rootNode);
        }
        return ret;
    };
    return DScriptGenerator;
})();
