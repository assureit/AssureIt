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

var DynamicNodeManager = (function () {
    function DynamicNodeManager() {
        this.DynamicNodeMap = {};
    }
    DynamicNodeManager.prototype.Init = function (caseViewer, recpath) {
        this.RECAPI = new AssureIt.RECAPI(recpath);
        this.CaseViewer = caseViewer;
        this.HTMLRenderFunctions = [];
        this.HTMLRenderFunctions.push(this.CaseViewer.GetPlugInHTMLRender("note"));
        this.HTMLRenderFunctions.push(this.CaseViewer.GetPlugInHTMLRender("monitor"));
        this.SVGRenderFunctions = [];
        this.SVGRenderFunctions.push(this.CaseViewer.GetPlugInSVGRender("monitor"));
    };

    DynamicNodeManager.prototype.StartMonitoring = function (interval) {
        console.log("start monitoring");
        var self = this;

        this.Timer = setInterval(function () {
            for (var key in self.DynamicNodeMap) {
                var monitorNode = self.DynamicNodeMap[key];

                if (self.CaseViewer.Source.ElementMap[key] == null) {
                    self.RemoveDynamicNode(key);
                    continue;
                }

                if (monitorNode == null) {
                    console.log("monitor:'" + key + "' is not registered");
                }

                try  {
                    monitorNode.UpdateStatus(self.RECAPI);
                    monitorNode.Show(self.CaseViewer, self.HTMLRenderFunctions, self.SVGRenderFunctions);
                } catch (e) {
                    self.RemoveAllMonitorNode();
                    return;
                }
            }

            self.CaseViewer.Draw();
        }, interval);
    };

    DynamicNodeManager.prototype.StopMonitoring = function () {
        console.log("stop monitoring");
        clearTimeout(this.Timer);
    };

    DynamicNodeManager.prototype.RemoveDynamicNode = function (label) {
        delete this.DynamicNodeMap[label];
        if (Object.keys(this.DynamicNodeMap).length == 0) {
            this.StopMonitoring();
        }
    };

    DynamicNodeManager.prototype.RemoveAllMonitorNode = function () {
        for (var label in this.DynamicNodeMap) {
            this.RemoveDynamicNode(label);
        }
    };
    return DynamicNodeManager;
})();
