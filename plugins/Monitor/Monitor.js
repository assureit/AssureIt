var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var LatestDataMap;

function extractTypeFromCondition(condition) {
    var text = condition.replace(/\{/g, " ").replace(/\}/g, " ").replace(/\(/g, " ").replace(/\)/g, " ").replace(/<=/g, " ").replace(/>=/g, " ").replace(/</g, " ").replace(/>/g, " ");

    var words = text.split(" ");
    var types = [];

    for (var i = 0; i < words.length; i++) {
        if (words[i] != "" && !$.isNumeric(words[i])) {
            types.push(words[i]);
        }
    }

    if (types.length != 1) {
    }

    return types[0];
}

function isContextNode(nodeModel) {
    if (nodeModel.Type == AssureIt.NodeType.Context) {
        return true;
    }

    return false;
}

function getContextNode(nodeModel) {
    for (var i = 0; i < nodeModel.Children.length; i++) {
        if (isContextNode(nodeModel.Children[i]))
            return nodeModel.Children[i];
    }

    return null;
}

function isMonitorNode(nodeModel) {
    if (nodeModel.Type != AssureIt.NodeType.Evidence)
        return false;
    if (!("Monitor" in nodeModel.Notes))
        return false;

    var contextNode = getContextNode(nodeModel.Parent);
    if (contextNode == null)
        return false;
    if (!("Location" in contextNode.Notes))
        return false;

    return true;
}

function appendNode(caseViewer, nodeModel, type) {
    var viewMap = caseViewer.ViewMap;
    var view = viewMap[nodeModel.Label];
    var case0 = caseViewer.Source;
    var newNodeModel = new AssureIt.NodeModel(case0, nodeModel, type, null, null);
    case0.SaveIdCounterMax(case0.ElementTop);
    viewMap[newNodeModel.Label] = new AssureIt.NodeView(caseViewer, newNodeModel);
    viewMap[newNodeModel.Label].ParentShape = viewMap[nodeModel.Label];
    return newNodeModel;
}

function showNode(caseViewer, nodeModel, HTMLRenderFunction, SVGRenderFunction) {
    var element = caseViewer.ViewMap[nodeModel.Label].HTMLDoc.DocBase;
    var view = caseViewer.ViewMap[nodeModel.Label];
    HTMLRenderFunction(caseViewer, nodeModel, element);
    SVGRenderFunction(caseViewer, view);
}

function blushAllAncestor(caseViewer, nodeModel, fill, stroke) {
    if (nodeModel == null)
        return;

    caseViewer.ViewMap[nodeModel.Label].SVGShape.SetColor(fill, stroke);

    var contextNode = getContextNode(nodeModel);

    if (contextNode != null) {
        caseViewer.ViewMap[contextNode.Label].SVGShape.SetColor(fill, stroke);
    }

    blushAllAncestor(caseViewer, nodeModel.Parent, fill, stroke);
}

var MonitorNode = (function () {
    function MonitorNode(Location, Type, Condition, EvidenceNode) {
        this.Location = Location;
        this.Type = Type;
        this.Condition = Condition;
        this.LatestData = null;
        this.Status = true;
        this.EvidenceNode = EvidenceNode;
    }
    MonitorNode.prototype.SetLocation = function (location) {
        this.Location = location;
    };

    MonitorNode.prototype.SetType = function (type) {
        this.Type = type;
    };

    MonitorNode.prototype.SetCondition = function (condition) {
        this.Condition = condition;
    };

    MonitorNode.prototype.UpdateLatestData = function () {
        if (this.Status == true) {
            this.LatestData = LatestDataMap[this.Type + "@" + this.Location];
        }
    };

    MonitorNode.prototype.UpdateStatus = function () {
        if (this.Status = true) {
            var script = "var " + this.Type + "=" + this.LatestData.data + ";";
            script += this.Condition + ";";
            this.Status = eval(script);
        }
    };

    MonitorNode.prototype.Show = function (caseViewer, HTMLRenderFunction, SVGRenderFunction) {
        var contextNode = getContextNode(this.EvidenceNode);

        if (contextNode == null) {
            contextNode = appendNode(caseViewer, this.EvidenceNode, AssureIt.NodeType.Context);
        }

        if (this.Status == true) {
            contextNode.Notes["Status"] = "Success";
            contextNode.Notes[this.Type] = this.LatestData.data;
            contextNode.Notes["Timestamp"] = this.LatestData.timestamp;
        } else {
            contextNode.Notes["Status"] = "Fail";
            contextNode.Notes[this.Type] = this.LatestData.data;
            contextNode.Notes["Timestamp"] = this.LatestData.timestamp;
            contextNode.Notes["Manager"] = this.LatestData.authid;
        }

        showNode(caseViewer, contextNode, HTMLRenderFunction, SVGRenderFunction);
    };
    return MonitorNode;
})();

var MonitorManager = (function () {
    function MonitorManager(caseViewer) {
        this.RECAPI = new AssureIt.RECAPI("http://54.250.206.119/rec");
        this.MonitorNodeMap = {};
        this.CaseViewer = caseViewer;
        this.HTMLRenderFunction = this.CaseViewer.GetPlugInHTMLRender("note");
        this.SVGRenderFunction = this.CaseViewer.GetPlugInSVGRender("monitor");
    }
    MonitorManager.prototype.StartMonitors = function (interval) {
        var self = this;

        this.Timer = setInterval(function () {
            self.CollectLatestData();

            for (var key in self.MonitorNodeMap) {
                var monitorNode = self.MonitorNodeMap[key];

                monitorNode.UpdateLatestData();
                if (monitorNode.LatestData == null)
                    continue;

                monitorNode.UpdateStatus();
                monitorNode.Show(self.CaseViewer, self.HTMLRenderFunction, self.SVGRenderFunction);
            }

            self.CaseViewer.Draw();
        }, interval);
    };

    MonitorManager.prototype.StopMonitors = function () {
        clearTimeout(this.Timer);
    };

    MonitorManager.prototype.SetMonitor = function (evidenceNode) {
        var location = getContextNode(evidenceNode.Parent).Notes["Location"];
        var condition = evidenceNode.Notes["Monitor"];
        var type = extractTypeFromCondition(condition);
        LatestDataMap[type + "@" + location] = null;
        var monitorNode = this.MonitorNodeMap[evidenceNode.Label];

        if (monitorNode == null) {
            this.MonitorNodeMap[evidenceNode.Label] = new MonitorNode(location, type, condition, evidenceNode);
        } else {
            monitorNode.SetLocation(location);
            monitorNode.SetType(type);
            monitorNode.SetCondition(condition);
        }
    };

    MonitorManager.prototype.CollectLatestData = function () {
        for (var key in LatestDataMap) {
            var type = key.split("@")[0];
            var location = key.split("@")[1];
            var latestData = this.RECAPI.getLatestData(location, type);
            if (latestData == null) {
                console.log("latest data is null");
            }
            LatestDataMap[key] = latestData;
        }
    };
    return MonitorManager;
})();

var MonitorPlugIn = (function (_super) {
    __extends(MonitorPlugIn, _super);
    function MonitorPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.HTMLRenderPlugIn = new MonitorHTMLRenderPlugIn(plugInManager);
        this.SVGRenderPlugIn = new MonitorSVGRenderPlugIn(plugInManager);
    }
    return MonitorPlugIn;
})(AssureIt.PlugInSet);

var MonitorHTMLRenderPlugIn = (function (_super) {
    __extends(MonitorHTMLRenderPlugIn, _super);
    function MonitorHTMLRenderPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.IsFirstCalled = true;
        this.MonitorManager = null;
    }
    MonitorHTMLRenderPlugIn.prototype.IsEnabled = function (caseViewer, nodeModel) {
        return true;
    };

    MonitorHTMLRenderPlugIn.prototype.Delegate = function (caseViewer, nodeModel, element) {
        if (this.IsFirstCalled) {
            LatestDataMap = {};
            this.MonitorManager = new MonitorManager(caseViewer);
            this.MonitorManager.StartMonitors(5000);
            this.IsFirstCalled = false;
        }

        if (isMonitorNode(nodeModel)) {
            this.MonitorManager.SetMonitor(nodeModel);
        }

        return true;
    };
    return MonitorHTMLRenderPlugIn;
})(AssureIt.HTMLRenderPlugIn);

var MonitorSVGRenderPlugIn = (function (_super) {
    __extends(MonitorSVGRenderPlugIn, _super);
    function MonitorSVGRenderPlugIn() {
        _super.apply(this, arguments);
    }
    MonitorSVGRenderPlugIn.prototype.IsEnabled = function (caseViewer, nodeView) {
        return true;
    };

    MonitorSVGRenderPlugIn.prototype.Delegate = function (caseViewer, nodeView) {
        var nodeModel = nodeView.Source;

        if (isMonitorNode(nodeModel)) {
            var contextNode = getContextNode(nodeModel);

            if (contextNode != null && contextNode.Notes["Status"] == "Fail") {
                var fill = "#FF9999";
                var stroke = "none";

                blushAllAncestor(caseViewer, nodeModel, fill, stroke);
            }
        }

        return true;
    };
    return MonitorSVGRenderPlugIn;
})(AssureIt.SVGRenderPlugIn);
