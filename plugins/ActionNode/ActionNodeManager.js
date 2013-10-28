function extractItemFromCondition(condition) {
    var text = condition.replace(/\{/g, " ").replace(/\}/g, " ").replace(/\(/g, " ").replace(/\)/g, " ").replace(/==/g, " ").replace(/<=/g, " ").replace(/>=/g, " ").replace(/</g, " ").replace(/>/g, " ");

    var words = text.split(" ");
    var items = [];

    for (var i = 0; i < words.length; i++) {
        if (words[i] != "" && !$.isNumeric(words[i])) {
            items.push(words[i]);
        }
    }

    if (items.length != 1) {
    }

    return items[0];
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

var ActionNodeManager = (function () {
    function ActionNodeManager() {
        this.ActionNodeMap = {};
    }
    ActionNodeManager.prototype.Init = function (caseViewer, recpath) {
        this.RECAPI = new AssureIt.RECAPI(recpath);
        this.CaseViewer = caseViewer;
        this.HTMLRenderFunctions = [];
        this.HTMLRenderFunctions.push(this.CaseViewer.GetPlugInHTMLRender("note"));
        this.HTMLRenderFunctions.push(this.CaseViewer.GetPlugInHTMLRender("monitor"));
        this.SVGRenderFunctions = [];
        this.SVGRenderFunctions.push(this.CaseViewer.GetPlugInSVGRender("monitor"));
    };

    ActionNodeManager.prototype.StartMonitoring = function (interval) {
        console.log("start monitoring");
        var self = this;

        this.Timer = setInterval(function () {
            for (var key in self.ActionNodeMap) {
                var monitorNode = self.ActionNodeMap[key];

                if (self.CaseViewer.Source.ElementMap[key] == null) {
                    self.RemoveActionNode(key);
                    continue;
                }

                if (monitorNode == null) {
                    console.log("monitor:'" + key + "' is not registered");
                }

                try  {
                    monitorNode.UpdateStatus(self.RECAPI);
                    monitorNode.Show(self.CaseViewer, self.HTMLRenderFunctions, self.SVGRenderFunctions);
                } catch (e) {
                    self.RemoveAllActionNode();
                    return;
                }
            }

            self.CaseViewer.Draw();
        }, interval);
    };

    ActionNodeManager.prototype.StopMonitoring = function () {
        console.log("stop monitoring");
        clearTimeout(this.Timer);
    };

    ActionNodeManager.prototype.RemoveActionNode = function (label) {
        delete this.ActionNodeMap[label];
        if (Object.keys(this.ActionNodeMap).length == 0) {
            this.StopMonitoring();
        }
    };

    ActionNodeManager.prototype.RemoveAllActionNode = function () {
        for (var label in this.ActionNodeMap) {
            this.RemoveActionNode(label);
        }
    };

    ActionNodeManager.prototype.SetActionNode = function (evidenceNode) {
        var location = evidenceNode.Environment.Location;
        var actionNode = this.ActionNodeMap[evidenceNode.Label];

        if (actionNode == null) {
            this.ActionNodeMap[evidenceNode.Label] = new ActionNode(location, evidenceNode);
        } else {
            actionNode.SetLocation(location);
        }

        if (Object.keys(this.ActionNodeMap).length == 1) {
            this.StartMonitoring(5000);
        }
    };
    return ActionNodeManager;
})();
