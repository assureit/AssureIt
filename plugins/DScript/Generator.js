var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var DScriptGenerator = (function () {
    function DScriptGenerator() {
        this.Indent = "\t";
        this.LineFeed = "\n";
        this.LibraryManager = new DScriptLibraryManager();
        this.LibraryManager.DefaultFuncTpl = "";
    }
    DScriptGenerator.prototype.VisitGoalNode = function (node) {
        return "";
    };
    DScriptGenerator.prototype.VisitStrategyNode = function (node) {
        return "";
    };
    DScriptGenerator.prototype.VisitEvidenceNode = function (node) {
        return "";
    };
    DScriptGenerator.prototype.VisitContextNode = function (node) {
        return "";
    };
    DScriptGenerator.prototype.GeneratePreface = function () {
        return "";
    };
    DScriptGenerator.prototype.GenerateMainFunction = function (dscriptActionMap) {
        return "";
    };
    return DScriptGenerator;
})();
;

var DShellCodeGenerator = (function (_super) {
    __extends(DShellCodeGenerator, _super);
    function DShellCodeGenerator() {
        _super.call(this);
        this.LibraryManager.DefaultFuncTpl = "DFault ${funcName}() { return null; }";
    }
    DShellCodeGenerator.prototype.VisitGoalOrStrategyNode = function (node) {
        var ret = "";
        ret += "DFault " + node.Label + "() {" + this.LineFeed;
        ret += this.Indent + "return ";
        var children = node.Children;
        if (children.length > 0) {
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                ret += child.Label + "()";
                break;
            }
        } else {
            ret += "null/*undevelopped*/";
        }
        ret += ";" + this.LineFeed;
        ret += "}" + this.LineFeed;
        return ret;
    };
    DShellCodeGenerator.prototype.GenerateLocalVariable = function (node) {
        var ret = "";
        var env = node.Environment;
        for (var key in env) {
            if (key == "prototype" || key == "Reaction") {
                continue;
            } else {
                ret += this.Indent + "let " + key + " = \"" + env[key] + "\";" + this.LineFeed;
            }
        }
        return ret;
    };
    DShellCodeGenerator.prototype.GenerateAction = function (node) {
        var ret = "";

        ret += this.GenerateLocalVariable(node);
        var funcName = node.GetNote("Action");
        var actionFunctionDef = this.LibraryManager.GetLibraryFunction(funcName.replace("()", ""));
        var monitor_raw = node.Environment["Monitor"];
        if (monitor_raw != null) {
            var monitor_fixed = monitor_raw.replace(/\{|\}/g, "").replace(/[a-zA-Z]+/g, function (matchedStr) {
                return "GetDataFromRec(Location, \"" + matchedStr + "\")";
            }).trim();
            actionFunctionDef = actionFunctionDef.replace(/[\(\w]Monitor[\)\w]/g, function (matchedStr) {
                return matchedStr.replace("Monitor", monitor_fixed);
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

    DShellCodeGenerator.prototype.VisitGoalNode = function (node) {
        return this.VisitGoalOrStrategyNode(node);
    };
    DShellCodeGenerator.prototype.VisitStrategyNode = function (node) {
        return this.VisitGoalOrStrategyNode(node);
    };
    DShellCodeGenerator.prototype.VisitEvidenceNode = function (node) {
        var ret = "";
        ret += "DFault " + node.Label + "() {" + this.LineFeed;
        if (node.GetNote("Action") != null) {
            ret += this.GenerateAction(node);
        } else {
            ret += this.Indent + "return null/*static evidence*/;";
        }
        ret += "}" + this.LineFeed;
        return ret;
    };
    DShellCodeGenerator.prototype.VisitContextNode = function (node) {
        var ret = "";
        ret += "DFault " + node.Label + "() {" + this.LineFeed;
        ret += this.Indent + "return null;" + this.LineFeed;
        ret += "}" + this.LineFeed;
        return ret;
    };

    DShellCodeGenerator.prototype.GenerateMainFunction = function (dscriptActionMap) {
        var ret = "";
        return ret;
    };
    return DShellCodeGenerator;
})(DScriptGenerator);

var ErlangCodeGenerator = (function (_super) {
    __extends(ErlangCodeGenerator, _super);
    function ErlangCodeGenerator() {
        _super.call(this);
        this.LibraryManager.DefaultFuncTpl = "${funcName}()";
    }
    ErlangCodeGenerator.prototype.GenNodeFuncName = function (node) {
        return node.Label.toLowerCase();
    };
    ErlangCodeGenerator.prototype.VisitGoalOrStrategyNode = function (node) {
        var ret = "";
        ret += this.GenNodeFuncName(node) + "() ->" + this.LineFeed;
        ret += this.Indent;
        var children = node.Children;
        if (children.length > 0) {
            ret += "lists:foldl(fun add/2, null, [";
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                ret += this.GenNodeFuncName(child) + "()";
                if (i < children.length - 1)
                    ret += ", ";
            }
            ret += "]).";
        } else {
            ret += "null.%%undevelopped";
        }
        ret += this.LineFeed;
        return ret;
    };
    ErlangCodeGenerator.prototype.GenerateLocalVariable = function (node) {
        var ret = "";
        var env = node.Environment;
        for (var key in env) {
            if (key == "prototype" || key == "Reaction") {
                continue;
            } else {
                ret += this.Indent + "let " + key + " = \"" + env[key] + "\";" + this.LineFeed;
            }
        }
        return ret;
    };
    ErlangCodeGenerator.prototype.GenerateAction = function (node) {
        var ret = "";

        ret += this.GenerateLocalVariable(node);
        var funcName = node.GetNote("Action");
        var actionFunctionDef = this.LibraryManager.GetLibraryFunction(funcName.replace("()", ""));
        var monitor_raw = node.Environment["Monitor"];
        if (monitor_raw != null) {
            var monitor_fixed = monitor_raw.replace(/\{|\}/g, "").replace(/[a-zA-Z]+/g, function (matchedStr) {
                return "GetDataFromRec(Location, \"" + matchedStr + "\")";
            }).trim();
            actionFunctionDef = actionFunctionDef.replace(/[\(\w]Monitor[\)\w]/g, function (matchedStr) {
                return matchedStr.replace("Monitor", monitor_fixed);
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

    ErlangCodeGenerator.prototype.VisitGoalNode = function (node) {
        return this.VisitGoalOrStrategyNode(node);
    };
    ErlangCodeGenerator.prototype.VisitStrategyNode = function (node) {
        return this.VisitGoalOrStrategyNode(node);
    };
    ErlangCodeGenerator.prototype.VisitEvidenceNode = function (node) {
        var ret = "";
        ret += this.GenNodeFuncName(node) + "() ->" + this.LineFeed;
        if (node.GetNote("Action") != null) {
            ret += this.Indent + "null.%%static evidence";
        } else {
            ret += this.Indent + "null.%%static evidence";
        }
        ret += this.LineFeed;
        return ret;
    };
    ErlangCodeGenerator.prototype.VisitContextNode = function (node) {
        var ret = "";
        ret += this.GenNodeFuncName(node) + "() ->" + this.LineFeed;
        ret += this.Indent + "null." + this.LineFeed;
        return ret;
    };
    ErlangCodeGenerator.prototype.GeneratePreface = function () {
        var ret = "";
        ret += "-module(dscript)." + this.LineFeed;
        ret += "-export([main/0])." + this.LineFeed;
        ret += this.LineFeed;
        ret += "main() -> null." + this.LineFeed;
        ret += "add(null, null) -> null;" + this.LineFeed;
        ret += "add(null, Ret) -> Ret;" + this.LineFeed;
        ret += "add(X, null) -> X;" + this.LineFeed;
        ret += "add(_X, _Ret) -> dfault." + this.LineFeed;
        ret += this.LineFeed;
        return ret;
    };
    ErlangCodeGenerator.prototype.GenerateMainFunction = function (dscriptActionMap) {
        return "";
    };
    return ErlangCodeGenerator;
})(DScriptGenerator);
;

var DScriptLibraryManager = (function () {
    function DScriptLibraryManager() {
        this.ServerApi = null;
        this.Cache = {};
        this.DefaultFuncTpl = "";
    }
    DScriptLibraryManager.prototype.GetLibraryFunction = function (funcName) {
        var ret = this.DefaultFuncTpl.replace(/\$\{funcName\}/g, funcName);
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
