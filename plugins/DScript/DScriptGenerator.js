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

    DScriptGenerator.prototype.GenerateOrder = function (GoalList) {
        var ListLen = GoalList.length;
        var newGoalList = [];
        for (var i = 0; i < ListLen; i++) {
            newGoalList[i] = GoalList[ListLen - 1 - i];
        }
        return newGoalList;
    };

    DScriptGenerator.prototype.Generate = function (Node, Flow) {
        switch (Node.Type) {
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
    };

    DScriptGenerator.prototype.GenerateFunctionHeader = function (Node) {
        return "boolean " + Node.Label + "(RuntimeContext ctx)";
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
            program += "true";
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
        program += this.indent + "return true;" + this.linefeed;
        return this.GenerateFooter(Node, program);
    };

    DScriptGenerator.prototype.GenerateStrategy = function (Node, Flow) {
        var program = this.GenerateHeader(Node);
        var child = Flow[Node.Label];
        child = this.GenerateOrder(child);
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

        return this.GenerateFooter(Node, program);
    };

    DScriptGenerator.prototype.GenerateLetDecl = function (ContextEnv) {
        var program = "";
        var DeclKeys = Object.keys(ContextEnv);
        for (var j = 0; j < DeclKeys.length; j++) {
            var DeclKey = DeclKeys[j];
            var DeclValue = ContextEnv[DeclKey];
            program += this.indent + "let " + DeclKey + " = " + DeclValue + ";" + this.linefeed;
        }

        return program;
    };

    DScriptGenerator.prototype.GenerateFunction = function (Node, Function) {
        var program = "";
        var contextenv = this.GetContextEnvironment(Node);
        program += this.GenerateLetDecl(contextenv);
        program += this.indent + "boolean ret = " + Function + ";" + this.linefeed;
        program += this.indent + "ctx.curl(id, " + Node.Label + ", " + "ret);" + this.linefeed;
        program += this.indent + "if(!ret) {" + this.linefeed;
        program += this.indent + this.indent + "return false;" + this.linefeed;
        program += this.indent + "}" + this.linefeed;
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

        if (child.length == 0) {
            program += this.indent + "return true";
        } else {
            program += this.indent + "return false/*FIXME support Rebuttal*/";
        }
        program += ";" + this.linefeed;
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

    DScriptGenerator.prototype.codegen_ = function (rootNode, ASNData) {
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

        res += this.GenerateRuntimeContext();
        res += this.GenerateCode(rootNode, flow) + this.linefeed;
        res += "@Export int main() {" + this.linefeed;
        res += this.indent + "RuntimeContext ctx = new RuntimeContext;" + this.linefeed;
        res += this.indent + "if(" + this.GenerateFunctionCall(rootNode) + ") { return 0; }" + this.linefeed;
        res += this.indent + "return 1;" + this.linefeed;
        res += "}" + this.linefeed;
        return res;
    };

    DScriptGenerator.prototype.codegen = function (Node, ASNData) {
        return this.codegen_(Node, ASNData);
    };
    return DScriptGenerator;
})();
