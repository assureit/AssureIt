var DScriptGenerator = (function () {
    function DScriptGenerator(genMainFunctionFlag) {
        if (typeof genMainFunctionFlag === "undefined") { genMainFunctionFlag = false; }
        this.Indent = "\t";
        this.LineFeed = "\n";
        this.Env = {};
        this.GenMainFunctionFlag = genMainFunctionFlag;
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
        return "require dshell;" + this.LineFeed + this.LineFeed;
    };
    DScriptGenerator.prototype.GenerateRuntimeContextDecl = function () {
        return "class RuntimeContext {" + this.LineFeed + "}" + this.LineFeed + this.LineFeed;
    };
    DScriptGenerator.prototype.GenerateLocalVariable = function () {
        var ret = "";
        var env = this.GetEnvironment();
        for (var key in env) {
            if (key == "prototype" || key == "Reaction") {
                continue;
            } else if (key == "Monitor") {
                var condStr = env[key];
                condStr = condStr.replace(/[a-zA-Z]+/g, function (matchedStr) {
                    return "GetDataFromRec(Location, \"" + matchedStr + "\")";
                });
                condStr = condStr.replace(/[0-9]+/g, function (matchedStr) {
                    return "\"" + matchedStr + "\"";
                });
                condStr = condStr.replace(/[\{\}]/g, "").trim();
                ret += this.Indent + "let Monitor = " + condStr + ";" + this.LineFeed;
            } else {
                ret += this.Indent + "let " + key + " = \"" + env[key] + "\";" + this.LineFeed;
            }
        }
        return ret;
    };
    DScriptGenerator.prototype.GenerateAction = function (funcName) {
        funcName = funcName.replace("()", "");
        var ret = "";
        ret += this.GenerateLocalVariable();

        ret += this.Indent + "DFault " + funcName + " {" + this.LineFeed;

        ret += this.Indent + "}" + this.LineFeed;

        ret += this.Indent + "DFault ret = null;" + this.LineFeed;
        ret += this.Indent + "if(Location == LOCATION) {" + this.LineFeed;
        ret += this.Indent + this.Indent + "ret = dlog " + funcName + "();" + this.LineFeed;
        ret += this.Indent + "}" + this.LineFeed;
        ret += this.Indent + "return ret;" + this.LineFeed;

        return ret;
    };

    DScriptGenerator.prototype.GetEnvironment = function () {
        return this.Env;
    };
    DScriptGenerator.prototype.PushEnvironment = function (node) {
        var contexts = this.SearchChildrenByType(node, AssureIt.NodeType.Context);
        var envConstructor = null;
        if (contexts.length == 0) {
            envConstructor = function () {
            };
        } else if (contexts.length == 1) {
            var context = contexts[0];
            envConstructor = function () {
                for (var key in context.Notes) {
                    this[key] = context.Notes[key];
                }
            };
        } else {
            envConstructor = function () {
            };
        }
        envConstructor.prototype = this.Env;
        var newEnv = new envConstructor();
        newEnv.prototype = this.Env;
        this.Env = newEnv;
    };
    DScriptGenerator.prototype.PopEnvironment = function () {
        this.Env = this.Env.prototype;
    };

    DScriptGenerator.prototype.GenerateNodeFunction_GoalOrStrategy = function (node) {
        var children = node.Children;
        var ret = "";
        ret += "DFault " + node.Label + "() {" + this.LineFeed;
        ret += "{" + this.LineFeed;
        ret += this.Indent + "return ";
        if (children.length > 0) {
            var funcCall = "";
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (child.Type == AssureIt.NodeType.Context || this.SearchAnnotationByName(child, "OnlyIf") != null) {
                    continue;
                } else {
                    if (funcCall != "")
                        funcCall += " && ";
                    funcCall += child.Label + "()";
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
        ret += "{" + this.LineFeed;
        if (action != null) {
            ret += this.GenerateAction(action);
        } else {
            ret += this.Indent + "return null;";
        }
        ret += "}" + this.LineFeed;
        return ret;
    };

    DScriptGenerator.prototype.GenerateNodeFunction = function (node) {
        var ret = "";
        this.PushEnvironment(node);
        for (var i = 0; i < node.Children.length; i++) {
            ret += this.GenerateNodeFunction(node.Children[i]);
            ret += this.LineFeed;
        }
        switch (node.Type) {
            case AssureIt.NodeType.Context:
                break;
            case AssureIt.NodeType.Goal:
            case AssureIt.NodeType.Strategy:
                ret += this.GenerateNodeFunction_GoalOrStrategy(node);
                break;
            case AssureIt.NodeType.Evidence:
                ret += this.GenerateNodeFunction_Evidence(node);
                break;
            default:
                console.log("DScriptGenerator: invalid Node Type");
                console.log(node);
        }
        this.PopEnvironment();
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
