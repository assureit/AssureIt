function extractTypeFromCondition(condition) {
    var text = condition.replace(/\{/g, " ").replace(/\}/g, " ").replace(/\(/g, " ").replace(/\)/g, " ").replace(/==/g, " ").replace(/<=/g, " ").replace(/>=/g, " ").replace(/</g, " ").replace(/>/g, " ");

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

function appendNode(caseViewer, nodeModel, type) {
    var viewMap = caseViewer.ViewMap;
    var view = viewMap[nodeModel.Label];
    var case0 = caseViewer.Source;
    var newNodeModel = new AssureIt.NodeModel(case0, nodeModel, type, null, null, {});
    case0.SaveIdCounterMax(case0.ElementTop);
    viewMap[newNodeModel.Label] = new AssureIt.NodeView(caseViewer, newNodeModel);
    viewMap[newNodeModel.Label].ParentShape = viewMap[nodeModel.Label];
    return newNodeModel;
}

var MonitorManager = (function () {
    function MonitorManager() {
        this.MonitorNodeMap = {};
    }
    MonitorManager.prototype.Init = function (caseViewer, recpath) {
        this.RECAPI = new AssureIt.RECAPI(recpath);
        this.CaseViewer = caseViewer;
        this.HTMLRenderFunctions = [];
        this.HTMLRenderFunctions.push(this.CaseViewer.GetPlugInHTMLRender("note"));
        this.HTMLRenderFunctions.push(this.CaseViewer.GetPlugInHTMLRender("monitor"));
        this.SVGRenderFunctions = [];
        this.SVGRenderFunctions.push(this.CaseViewer.GetPlugInSVGRender("monitor"));
        this.ActiveMonitors = 0;
    };

    MonitorManager.prototype.StartMonitors = function (interval) {
        console.log("start monitoring");
        var self = this;

        this.Timer = setInterval(function () {
            for (var key in self.MonitorNodeMap) {
                var monitorNode = self.MonitorNodeMap[key];

                if (self.CaseViewer.Source.ElementMap[key] == null) {
                    self.RemoveMonitor(key);
                    continue;
                }

                if (monitorNode == null) {
                    console.log("monitor:'" + key + "' is not registered");
                }

                if (!monitorNode.IsActive) {
                    continue;
                }

                try  {
                    monitorNode.UpdateLatestData(self.RECAPI);
                } catch (e) {
                    self.DeactivateAllMonitor();
                    return;
                }

                if (monitorNode.LatestData == null)
                    continue;

                monitorNode.UpdateStatus();
                monitorNode.Show(self.CaseViewer, self.HTMLRenderFunctions, self.SVGRenderFunctions);
            }

            self.CaseViewer.Draw();
        }, interval);
    };

    MonitorManager.prototype.StopMonitors = function () {
        console.log("stop monitoring");
        clearTimeout(this.Timer);
    };

    MonitorManager.prototype.SetMonitor = function (evidenceNode) {
        var location = getContextNode(evidenceNode.Parent).Notes["Location"];
        var condition = getContextNode(evidenceNode.Parent).Notes["Monitor"];
        var type = extractTypeFromCondition(condition);
        var monitorNode = this.MonitorNodeMap[evidenceNode.Label];

        if (monitorNode == null) {
            this.MonitorNodeMap[evidenceNode.Label] = new MonitorNode(location, type, condition, evidenceNode);
        } else {
            monitorNode.SetLocation(location);
            monitorNode.SetType(type);
            monitorNode.SetCondition(condition);
        }
    };

    MonitorManager.prototype.RemoveMonitor = function (label) {
        if (this.MonitorNodeMap[label].IsActive) {
            this.ActiveMonitors -= 1;

            if (this.ActiveMonitors == 0) {
                this.StopMonitors();
            }
        }

        delete this.MonitorNodeMap[label];
        if (Object.keys(this.MonitorNodeMap).length == 0) {
            this.StopMonitors();
        }
    };

    MonitorManager.prototype.ActivateMonitor = function (label) {
        var monitorNode = this.MonitorNodeMap[label];

        if (!monitorNode.IsActive) {
            monitorNode.IsActive = true;
            this.ActiveMonitors += 1;
            if (this.ActiveMonitors == 1) {
                this.StartMonitors(5000);
            }
        }
    };

    MonitorManager.prototype.ActivateAllMonitor = function () {
        for (var label in this.MonitorNodeMap) {
            this.ActivateMonitor(label);
        }
    };

    MonitorManager.prototype.DeactivateMonitor = function (label) {
        var monitorNode = this.MonitorNodeMap[label];

        if (monitorNode.IsActive) {
            monitorNode.IsActive = false;
            this.ActiveMonitors -= 1;
            if (this.ActiveMonitors == 0) {
                this.StopMonitors();
            }
        }
    };

    MonitorManager.prototype.DeactivateAllMonitor = function () {
        for (var label in this.MonitorNodeMap) {
            this.RemoveMonitor(label);
        }
    };

    MonitorManager.prototype.IsRegisteredMonitor = function (label) {
        if (label in this.MonitorNodeMap) {
            return true;
        }
        return false;
    };
    return MonitorManager;
})();
