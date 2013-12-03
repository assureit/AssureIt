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
    return DScriptGenerator;
})();
;

var DShellCodeGenerator = (function (_super) {
    __extends(DShellCodeGenerator, _super);
    function DShellCodeGenerator() {
        _super.apply(this, arguments);
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
    return DShellCodeGenerator;
})(DScriptGenerator);

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
