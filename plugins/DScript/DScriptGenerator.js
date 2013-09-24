var Edge = (function () {
    function Edge(src, dst) {
        this.src = src;
        this.dst = dst;
    }
    return Edge;
})();

function visit(g, v, order, color) {
    color[v] = 1;
    for (var i = 0; i < g[v].length; i = i + 1) {
        var e = g[v][i];
        if (color[e.dst] == 2) {
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

function tsort(g) {
    var n = g.length;
    var color = [];
    var order = [];
    for (var i = 0; i < n; i++) {
        color.push(0);
    }
    for (i = 0; i < n; i++) {
        if (!color[i] && !visit(g, i, order, color)) {
            return null;
        }
    }
    return order.reverse();
}

var DScriptError = (function () {
    function DScriptError(NodeName, LineNumber, Message) {
        this.NodeName = NodeName;
        this.LineNumber = LineNumber;
        this.Message = Message;
    }
    return DScriptError;
})();

var DScriptGenerator = (function () {
    function DScriptGenerator() {
        this.indent = "\t";
        this.linefeed = "\n";
        this.errorMessage = [];
        this.Env = [];
    }
    DScriptGenerator.prototype.GetGoalList = function (List) {
        return List.filter(function (Node) {
            return Node.Type == AssureIt.NodeType.Goal;
        });
    };

    DScriptGenerator.prototype.GetContextList = function (List) {
        return List.filter(function (Node) {
            return Node.Type == AssureIt.NodeType.Context;
        });
    };

    DScriptGenerator.prototype.GetEvidenceList = function (List) {
        return List.filter(function (Node) {
            return Node.Type == AssureIt.NodeType.Evidence;
        });
    };

    DScriptGenerator.prototype.GetStrategyList = function (List) {
        return List.filter(function (Node) {
            return Node.Type == AssureIt.NodeType.Strategy;
        });
    };

    DScriptGenerator.prototype.GetContextIndex = function (Node) {
        for (var i = 0; i < Node.Children.length; i++) {
            if (Node.Children[i].Type == AssureIt.NodeType.Context) {
                return i;
            }
        }
        return -1;
    };

    DScriptGenerator.prototype.GetParentContextEnvironment = function (ParentNode) {
        while (ParentNode != null) {
            var contextindex = this.GetContextIndex(ParentNode);
            if (contextindex != -1) {
                return ParentNode.Children[contextindex];
            }
            ParentNode = ParentNode.Parent;
        }
        return null;
    };

    DScriptGenerator.prototype.GetContextEnvironment = function (Node) {
        if (Node.Parent == null) {
            return;
        }
        var ParentNode = Node.Parent;
        var ParentContextNode = this.GetParentContextEnvironment(ParentNode);
        return ParentContextNode.Notes;
    };

    DScriptGenerator.prototype.PushEnvironment = function (ContextList) {
        var env = {};
        for (var i = 0; i < ContextList.length; ++i) {
            var Node = ContextList[i];
            if (Node.Type != AssureIt.NodeType.Context) {
                continue;
            }
            var DeclKeys = Object.keys(Node.Notes);
            for (var j = 0; j < DeclKeys.length; j++) {
                var DeclKey = DeclKeys[j];
                var DeclValue = Node.Notes[DeclKey];
                env[DeclKey] = DeclValue;
            }
        }
        this.Env.push(env);
    };

    DScriptGenerator.prototype.PopEnvironment = function () {
        this.Env.pop();
    };

    DScriptGenerator.prototype.GetEnvironment = function (Key) {
        for (var i = this.Env.length - 1; i >= 0; --i) {
            var env = this.Env[i];
            if (env.hasOwnProperty(Key)) {
                return env[Key];
            }
        }
        return null;
    };

    DScriptGenerator.prototype.GetMonitor = function (Node) {
        if (Node.Type == AssureIt.NodeType.Evidence) {
            return Node.Notes["Monitor"];
        }
        return "";
    };

    DScriptGenerator.prototype.GetAction = function (Node) {
        if (Node.Type == AssureIt.NodeType.Evidence) {
            return Node.Notes["Action"];
        }
        return "";
    };

    DScriptGenerator.prototype.Generate = function (Node, Flow) {
        switch (Node.Type) {
            case AssureIt.NodeType.Goal:
                return this.GenerateGoal(Node, Flow);

            case AssureIt.NodeType.Strategy:
                return this.GenerateStrategy(Node, Flow);
            case AssureIt.NodeType.Evidence:
                return this.GenerateEvidence(Node, Flow);
        }
        return "";
    };

    DScriptGenerator.prototype.GenerateFunctionHeader = function (Node) {
        return "DFault " + Node.Label + "(RuntimeContext ctx)";
    };
    DScriptGenerator.prototype.GenerateFunctionCall = function (Node) {
        return Node.Label + "(ctx)";
    };

    DScriptGenerator.prototype.GenerateHeader = function (Node) {
        var program = "";
        program += this.GenerateFunctionHeader(Node) + " {" + this.linefeed;
        var statement = Node.Statement.replace(/\n+$/g, '');
        if (statement.length > 0) {
            var description = statement.split(this.linefeed);
            for (var i = 0; i < description.length; ++i) {
                program += this.indent + "// " + description[i] + this.linefeed;
            }
        }
        return program;
    };

    DScriptGenerator.prototype.GenerateFooter = function (Node, program) {
        return program + "}";
    };

    DScriptGenerator.prototype.GenerateDefault = function (Node, Flow) {
        var program = this.GenerateHeader(Node);
        var child = Flow[Node.Label];
        program += this.indent + "return ";
        if (child.length > 0) {
            for (var i = 0; i < child.length; ++i) {
                var node = child[i];
                if (i != 0) {
                    program += " && ";
                }
                program += this.GenerateFunctionCall(node);
            }
        } else {
            program += "null";
        }
        program += ";" + this.linefeed;
        return this.GenerateFooter(Node, program);
    };

    DScriptGenerator.prototype.GenerateGoal = function (Node, Flow) {
        var program = this.GenerateHeader(Node);
        var child = Flow[Node.Label];

        program += this.indent + "return ";
        if (child.length > 0) {
            for (var i = 0; i < child.length; ++i) {
                var node = child[i];
                if (node.Type == AssureIt.NodeType.Context) {
                    continue;
                }
                if (i != 0) {
                    program += " && ";
                }
                program += this.GenerateFunctionCall(node);
            }
        } else {
            program += "false/*Undevelopped Goal*/";
        }
        program += ";" + this.linefeed;
        return this.GenerateFooter(Node, program);
    };

    DScriptGenerator.prototype.GenerateContext = function (Node, Flow) {
        var program = this.GenerateHeader(Node);
        program += this.indent + "return null;" + this.linefeed;
        return this.GenerateFooter(Node, program);
    };

    DScriptGenerator.prototype.GenerateAnnotationStrategy = function (child) {
        var program = "";
        for (var i = 0; i < child.length; i++) {
            var goal = child[i];
            var contextindex = this.GetContextIndex(goal);
            var context = goal.Children[contextindex];
            if (context.GetAnnotation("OnlyIf") != null) {
                var reaction = context.Notes["Reaction"];
                var goallabel = child[0].Label;
                var parentgoallabel = context.Parent.Label;
                program += this.indent + "DFault ret = " + goallabel + "(ctx);" + this.linefeed;
                program += this.indent + "if (ret.getLocation() == \"" + reaction + "\") {" + this.linefeed;
                program += this.indent + this.indent + "ret = " + parentgoallabel + "(ctx);" + this.linefeed;
                program += this.indent + "}" + this.linefeed;
                program += this.indent + "return ret;" + this.linefeed;
                return program;
            }
        }
        return "";
    };

    DScriptGenerator.prototype.GenerateDefaultStrategy = function (child) {
        var program = "";
        program += this.indent + "return ";
        if (child.length > 0) {
            for (var i = 0; i < child.length; ++i) {
                var node = child[i];
                if (i != 0) {
                    program += " && ";
                }
                program += this.GenerateFunctionCall(node);
            }
        } else {
            program += "false";
        }
        program += ";" + this.linefeed;
        return program;
    };

    DScriptGenerator.prototype.GenerateStrategy = function (Node, Flow) {
        var program = this.GenerateHeader(Node);
        var child = Flow[Node.Label].reverse();
        var code = this.GenerateAnnotationStrategy(child);

        if (code.length == 0) {
            program += this.GenerateDefaultStrategy(child);
        }
        return this.GenerateFooter(Node, program + code);
    };

    DScriptGenerator.prototype.GenerateGetDataFromRecFunction = function (Node, DeclValue) {
        var program = "";
        var monitor = DeclValue.replace("{", "").replace("}", "").split(" ");
        var monitorlen = monitor.length;
        for (var i = monitorlen; i >= 0; i--) {
            if (monitor[i] == "") {
                monitor.splice(i, 1);
            }
        }
        if (monitor.length != 3) {
            this.errorMessage.push(new DScriptError(Node.Label, Node.LineNumber, "Monitor evaluation formula error"));
        } else {
            var LHS = monitor[0];
            var operand = monitor[1];
            var RHS = monitor[2];
            program += this.indent + "boolean Monitor = GetDatafromRec(Location, " + LHS + ") " + operand + " " + RHS + ";" + this.linefeed;
        }
        return program;
    };

    DScriptGenerator.prototype.GenerateLetDecl = function (Node, ContextEnv) {
        var program = "";
        var DeclKeys = Object.keys(ContextEnv);
        for (var j = 0; j < DeclKeys.length; j++) {
            var DeclKey = DeclKeys[j];
            var DeclValue = ContextEnv[DeclKey];
            if (DeclKey == "Monitor") {
                program += this.GenerateGetDataFromRecFunction(Node, DeclValue);
            } else if (DeclKey == "Reaction") {
                program += this.indent + "String " + DeclKey + " = " + "\"" + DeclValue + "\";" + this.linefeed;
            } else if (DeclKey == "Location") {
                program += this.indent + "let " + DeclKey + " = \"" + DeclValue + "\";" + this.linefeed;
            } else {
                program += this.indent + "let " + DeclKey + " = " + DeclValue + ";" + this.linefeed;
            }
        }

        return program;
    };

    DScriptGenerator.prototype.GenerateFunction = function (Node, Function) {
        var program = "";
        var contextenv = this.GetContextEnvironment(Node);
        program += this.GenerateLetDecl(Node, contextenv);
        program += this.indent + "if(location == LOCATION) {" + this.linefeed;
        program += this.indent + this.indent + "DFault ret = " + Function + ";" + this.linefeed;
        program += this.indent + this.indent + "dexec " + Function + this.linefeed;
        program += this.indent + "}" + this.linefeed;
        program += this.indent + "return ret;" + this.linefeed;
        return program;
    };

    DScriptGenerator.prototype.GenerateEvidence = function (Node, Flow) {
        var program = this.GenerateHeader(Node);
        var child = Flow[Node.Label];
        var Monitor = this.GetMonitor(Node);
        var Action = this.GetAction(Node);
        var ContextList = this.GetContextList(child);

        if (Monitor != null) {
            program += this.GenerateFunction(Node, Monitor);
        }

        if (Action != null) {
            program += this.GenerateFunction(Node, Action);
        }

        if (child.length != ContextList.length) {
            this.errorMessage.push(new DScriptError(Node.Label, Node.LineNumber, "EvidenceSyntaxError"));
        }

        if (Monitor == null && Action == null) {
            if (child.length == 0) {
                program += this.indent + "return null";
            } else {
                program += this.indent + "return false/*FIXME support Rebuttal*/";
            }
            program += ";" + this.linefeed;
        }

        return this.GenerateFooter(Node, program);
    };

    DScriptGenerator.prototype.GenerateCode = function (Node, Flow) {
        var queue = [];
        var program = [];
        var flow = "";
        program.push(this.Generate(Node, Flow));
        var child = Flow[Node.Label];
        Flow[Node.Label] = [];
        var ContextList = this.GetContextList(child);
        this.PushEnvironment(ContextList);
        for (var i = 0; i < child.length; ++i) {
            program.push(this.GenerateCode(child[i], Flow));
        }
        this.PopEnvironment();
        return flow + program.reverse().join(this.linefeed);
    };

    DScriptGenerator.prototype.GenerateRuntimeContext = function () {
        return "class RutimeContext {" + this.linefeed + "}" + this.linefeed + this.linefeed;
    };

    DScriptGenerator.prototype.GenerateMainFunction = function (rootNode, flow) {
        var program = "";
        program += this.GenerateRuntimeContext();
        program += this.GenerateCode(rootNode, flow) + this.linefeed;
        program += "while(true) {" + this.linefeed;
        program += this.indent + "@Export int main() {" + this.linefeed;
        program += this.indent + this.indent + "RuntimeContext ctx = new RuntimeContext();" + this.linefeed;
        program += this.indent + this.indent + "if(" + this.GenerateFunctionCall(rootNode) + " == null) { return 0; }" + this.linefeed;
        program += this.indent + this.indent + "return 1;" + this.linefeed;
        program += this.indent + "}" + this.linefeed;
        program += this.indent + "sleep 30;" + this.linefeed;
        program += "}" + this.linefeed;
        return program;
    };

    DScriptGenerator.prototype.CollectNodeInfo = function (rootNode) {
        var queue = [];
        var map = {};
        var NodeList = [];
        var NodeIdxMap = {};
        queue.push(rootNode);
        NodeList.push(rootNode);
        while (queue.length != 0) {
            var Node = queue.pop();
            var childList = [];

            function Each(e) {
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

        var graph = [];
        for (var i = 0; i < NodeList.length; ++i) {
            var Edges = [];
            graph.push(Edges);
        }
        for (var i = 0; i < NodeList.length; ++i) {
            var Node = NodeList[i];
            var Edges = graph[i];
            for (var j = 0; j < map[Node.Label].length; ++j) {
                var Child = map[Node.Label][j];
                Edges.push(new Edge(i, NodeIdxMap[Child.Label]));
            }
        }

        var order = tsort(graph);
        if (order != null) {
            var child = [];
            for (var i = 0; i < order.length; ++i) {
                var childList = [];
                var Node = NodeList[order[i]];
                var labels1 = [];
                var labels2 = [];
                for (var k = 0; k < Node.Children.length; ++k) {
                    labels1.push(Node.Children[k].Label);
                }
                for (var j = 0; j < order.length; ++j) {
                    for (var k = 0; k < Node.Children.length; ++k) {
                        var childNode = Node.Children[k];
                        if (NodeList[order[j]].Label == childNode.Label) {
                            childList.push(childNode);
                            labels2.push(childNode.Label);
                        }
                    }
                }
                map[Node.Label] = childList;
            }
        }

        return map;
    };

    DScriptGenerator.prototype.GenerateDShellDecl = function () {
        return "require dshell;" + this.linefeed + this.linefeed;
    };

    DScriptGenerator.prototype.GenerateImportStatement = function (ViewMap, flow) {
        var program = "";
        var keys = Object.keys(flow);
        for (var i = 0; i < keys.length; i++) {
            var label = keys[i];
            var element = ViewMap[label];
            var action = this.GetAction(element);
            if (label.charAt(0) == "E" && action.length > 0) {
                program += "import " + action.replace("()", "") + ".ts" + this.linefeed;
            }
        }
        program += this.linefeed;
        return program;
    };

    DScriptGenerator.prototype.GenerateGlobalLocationDecl = function () {
        return "const LOCATION = \"\"" + this.linefeed + this.linefeed;
    };

    DScriptGenerator.prototype.codegen_ = function (ViewMap, rootNode, ASNData) {
        var res = "";
        if (rootNode == null) {
            return res;
        }
        var flow = this.CollectNodeInfo(rootNode);
        var dataList = ASNData.split("\n");
        var queue = [];
        queue.push(rootNode);
        while (queue.length != 0) {
            var Node = queue.pop();
            for (var i = 0; i < dataList.length; ++i) {
                if (new RegExp("\\*" + Node.Label).test(dataList[i])) {
                    Node.LineNumber = i;
                }
            }
            for (var k = 0; k < Node.Children.length; ++k) {
                var childNode = Node.Children[k];
                queue.push(childNode);
            }
        }
        res += this.GenerateDShellDecl();
        res += this.GenerateImportStatement(ViewMap, flow);
        res += this.GenerateGlobalLocationDecl();
        res += this.GenerateMainFunction(rootNode, flow);
        return res;
    };

    DScriptGenerator.prototype.codegen = function (ViewMap, Node, ASNData) {
        return this.codegen_(ViewMap, Node, ASNData);
    };
    return DScriptGenerator;
})();
