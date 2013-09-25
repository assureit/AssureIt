/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/PlugInManager.ts" />
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
    for (var i = 0; i < n; i = i + 1) {
        color.push(0);
    }
    for (i = 0; i < n; i = i + 1) {
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

    DScriptGenerator.prototype.PushEnvironment = function (ContextList) {
        var env = {};
        for (var i = 0; i < ContextList.length; ++i) {
            var Node = ContextList[i];
            if (Node.Type != AssureIt.NodeType.Context) {
                continue;
            }
            var DeclList = Node.Statement.split("\n").filter(function (Text) {
                var regex = /^[A-Za-z][A-Z-a-z0-9]*=/;
                return regex.test(Text);
            });
            for (var j = 0; j < DeclList.length; ++j) {
                var Decl = DeclList[j].split("=");
                if (Decl.length != 2) {
                    this.errorMessage.push(new DScriptError(Node.Label, Node.LineNumber, "DeclSyntaxError"));
                }
                env[Decl[0]] = Decl[1];
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
            var Monitors = Node.Statement.split("\n").filter(function (Text) {
                return Text.indexOf("Monitor=") == 0;
            });
            for (var i = 0; i < Monitors.length; ++i) {
                var List = Monitors[i].split("Monitor=");
                if (List.length != 2 || List[1].length == 0) {
                    this.errorMessage.push(new DScriptError(Node.Label, Node.LineNumber, "Monitor has no rule"));
                } else {
                    return List[1];
                }
            }
        }
        return "";
    };

    DScriptGenerator.prototype.GetMonitorName = function (Text) {
        // (E3.Monitor == true) => ["(E3", "E3", "Monitor"]
        var res = Text.match(/^\(+([A-Za-z0-9]+).([A-Za-z0-9]+)/);
        if (res.length == 3) {
            return res.splice(1);
        }
        return [];
    };

    DScriptGenerator.prototype.GetAction = function (Node) {
        if (Node.Type == AssureIt.NodeType.Evidence) {
            var Actions = Node.Statement.split("\n").filter(function (Text) {
                return Text.indexOf("Action=") == 0;
            });
            for (var i = 0; i < Actions.length; ++i) {
                var List = Actions[i].split("Action=");
                if (List.length != 2 || List[1].length == 0) {
                    this.errorMessage.push(new DScriptError(Node.Label, Node.LineNumber, "Action has no rule"));
                } else {
                    return List[1];
                }
            }
        }
        return "";
    };

    DScriptGenerator.prototype.getMethodName = function (Node) {
        return Node.Label;
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
        //return "boolean Invoke(" + Node.Label + " self)";
        return "boolean " + Node.Label + "()";
    };
    DScriptGenerator.prototype.GenerateFunctionCall = function (Node) {
        //return "Invoke(new " + Node.Label + "())";
        return Node.Label + "()";
    };

    DScriptGenerator.prototype.GenerateHeader = function (Node) {
        var program = "";
        program += this.GenerateFunctionHeader(Node) + " {" + this.linefeed;
        var statement = Node.Statement.replace(/\n+$/g, '');
        if (statement.length > 0) {
            var description = statement.split(this.linefeed);
            for (var i = 0; i < description.length; ++i) {
                if (description[i].indexOf("Monitor=") == 0) {
                    continue;
                }
                if (description[i].indexOf("Action=") == 0) {
                    continue;
                }
                program += this.indent + "// " + description[i] + this.linefeed;
            }
        }

        //if(Node.Annotations.length > 0) {
        //	for (var i=0; i < Node.Annotations.length; ++i) {
        //		var Anno = Node.Annotations[i];
        //		program += this.indent + "// " + Anno.Name + ":" + Anno.Body + this.linefeed;
        //	}
        //}
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
        var child = Flow[Node.Label];

        var Statements = Node.Statement.split("\n");
        var after = Node.GetAnnotation("after");
        if (after != null) {
            if (after.Body == null || after.Body.length == 0) {
                this.errorMessage.push(new DScriptError(Node.Label, Node.LineNumber, "@after needs parameter"));
            } else {
                program += this.indent + "defined(" + after.Body + ");" + this.linefeed;
            }
        }
        program += this.indent + "return true;" + this.linefeed;
        return this.GenerateFooter(Node, program);
    };

    DScriptGenerator.prototype.GenerateStrategy = function (Node, Flow) {
        var program = this.GenerateHeader(Node);
        var child = Flow[Node.Label];
        var ContextList = this.GetContextList(child);
        var FaultList = [];
        var FaultAction = "";
        if (ContextList.length > 0) {
            for (var i = 0; i < ContextList.length; ++i) {
                var Statements = ContextList[i].Statement.split("\n");
                for (var j = 0; j < Statements.length; ++j) {
                    if (Statements[j].indexOf("fault=") == 0) {
                        if (j + 1 < Statements.length && Statements[j + 1].indexOf("fault=") == 0) {
                            FaultList = Statements[j].substring("fault=".length).split(",");
                            FaultAction = Statements[j + 1].substring("fault=".length);
                            FaultList = FaultList.map(function (e) {
                                return e.trim();
                            });
                        }
                    }
                }
            }
        }

        if (FaultList.length > 0) {
            var self = this;
            program += this.indent + "enum " + Node.Label + "_FaultType {" + this.linefeed;
            program += FaultList.map(function (e) {
                return self.indent + self.indent + e;
            }).join("," + this.linefeed) + this.linefeed;

            program += this.indent + "};" + this.linefeed;
            program += this.indent + "switch(" + FaultAction + ") {" + this.linefeed;
            var matched = 0;
            program += this.GetGoalList(Node.Children).map(function (e) {
                var ret = "";

                for (var i = 0; i < FaultList.length; ++i) {
                    if (e.Statement.indexOf(FaultList[i]) >= 0) {
                        matched += 1;
                        ret += self.indent + "case " + FaultList[i] + ":" + self.linefeed;
                        ret += self.indent + self.indent + "return ";
                        ret += self.GenerateFunctionCall(e) + ";";
                    }
                }
                return ret;
            }).join(this.linefeed) + this.linefeed;
            if (matched != FaultList.length) {
                this.errorMessage.push(new DScriptError(Node.Label, Node.LineNumber, Node.Label + " node does not cover some case."));
            }
            program += this.indent + "}" + this.linefeed;
            program += this.indent + "return false;" + this.linefeed;
        } else {
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
        }
        return this.GenerateFooter(Node, program);
    };

    DScriptGenerator.prototype.GenerateEvidence = function (Node, Flow) {
        var program = this.GenerateHeader(Node);
        var child = Flow[Node.Label];

        var Statements = Node.Statement.split("\n");
        var Monitor = this.GetMonitor(Node);
        if (Monitor.length > 0) {
            var env = this.GetEnvironment("Location");
            if (env == null || env.length == 0) {
                this.errorMessage.push(new DScriptError(Node.Label, Node.LineNumber, "Location is not defined"));
            } else {
                var locations = env.split(",");
                program += this.indent + "boolean ret = false;" + this.linefeed;
                for (var j = 0; j < locations.length; ++j) {
                    var Code = Monitor.replace(/([A-Za-z]+)/, locations[j] + ".$1");
                    program += this.indent + "ret = (" + Code + ");" + this.linefeed;
                }
            }
        }

        var Action = this.GetAction(Node);
        if (Action.length > 0) {
            program += this.indent + "if(!" + Action + ") {" + this.linefeed;
            program += this.indent + this.indent + "return false;" + this.linefeed;
            program += this.indent + "}" + this.linefeed;
        }

        var ContextList = this.GetContextList(child);
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
            var after = Node.GetAnnotation("after");
            if (after != null) {
                if (after.Body == null || after.Body.length == 0) {
                    this.errorMessage.push(new DScriptError(Node.Label, Node.LineNumber, Node.Label + "'s @after annotation needs parameter"));
                } else {
                    // (E3.Monitor == true) => ["(E3", "E3"]
                    var res = after.Body.match(/^\(+([A-Za-z0-9]+)/);
                    if (res != null && res.length == 2) {
                        var src = NodeIdxMap[res[1]];
                        var e = graph[src];
                        e.push(new Edge(src, i));
                    }
                }
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

        res += this.GenerateCode(rootNode, flow) + this.linefeed;
        res += "@Export int main() {" + this.linefeed;
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
