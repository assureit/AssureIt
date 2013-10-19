var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
function selectStrongColor(color1, color2) {
    if (parseInt(color1.replace(/#/g, ""), 16) < parseInt(color2.replace(/#/g, ""), 16)) {
        return color1;
    } else {
        return color2;
    }
}

function showNode(caseViewer, nodeModel, HTMLRenderFunctions, SVGRenderFunctions) {
    var element = caseViewer.ViewMap[nodeModel.Label].HTMLDoc.DocBase;
    var view = caseViewer.ViewMap[nodeModel.Label];
    for (var i = 0; i < HTMLRenderFunctions.length; i++) {
        HTMLRenderFunctions[i](caseViewer, nodeModel, element);
    }
    for (var i = 0; i < SVGRenderFunctions.length; i++) {
        SVGRenderFunctions[i](caseViewer, view);
    }
}

var ActionNode = (function () {
    function ActionNode(Location, EvidenceNode) {
        this.Location = Location;
        this.EvidenceNode = EvidenceNode;
        this.Fault = 0;
        this.Status = true;
        this.IsRecovered = false;
    }
    ActionNode.prototype.SetLocation = function (location) {
        this.Location = location;
    };

    ActionNode.prototype.UpdateStatus = function (RECAPI) {
        var latestFaultData = RECAPI.getLatestData(this.Location, this.EvidenceNode.Label);

        if (latestFaultData == null) {
            return;
        }

        var fault = latestFaultData.data;

        if (fault == 0) {
            if (this.Status == false) {
                this.IsRecovered = true;
            }
            this.Status = true;
        } else {
            this.Status = false;
        }
        this.Fault = fault;
    };

    ActionNode.prototype.BlushAllAncestor = function (caseViewer, nodeView, fill, stroke) {
        if (nodeView == null)
            return;

        nodeView.SetTemporaryColor(fill, stroke);

        if (nodeView.ParentShape != null) {
            var brotherModels = nodeView.ParentShape.Source.Children;

            for (var i = 0; i < brotherModels.length; i++) {
                var view = caseViewer.ViewMap[brotherModels[i].Label];

                if (view.GetTemporaryColor() != null) {
                    var tmpFill = view.GetTemporaryColor()["fill"];
                    fill = selectStrongColor(fill, tmpFill);
                }
            }
        }

        this.BlushAllAncestor(caseViewer, nodeView.ParentShape, fill, stroke);
    };

    ActionNode.prototype.Show = function (caseViewer, HTMLRenderFunctions, SVGRenderFunctions) {
        showNode(caseViewer, this.EvidenceNode, HTMLRenderFunctions, SVGRenderFunctions);
    };
    return ActionNode;
})();

var MonitorNode = (function (_super) {
    __extends(MonitorNode, _super);
    function MonitorNode(Location, Item, Condition, EvidenceNode) {
        _super.call(this, Location, EvidenceNode);
        this.Item = Item;
        this.Condition = Condition;
        this.LatestData = null;
        this.PastData = [];
        this.IsActive = false;
    }
    MonitorNode.prototype.SetItem = function (item) {
        this.Item = item;
    };

    MonitorNode.prototype.SetCondition = function (condition) {
        this.Condition = condition;
    };

    MonitorNode.prototype.UpdatePastData = function (latestData) {
        if (this.PastData.length < 10) {
            this.PastData.unshift(latestData);
        } else {
            this.PastData.pop();
            this.PastData.unshift(latestData);
        }
    };

    MonitorNode.prototype.UpdateLatestData = function (RECAPI) {
        var latestData = RECAPI.getLatestData(this.Location, this.Item);

        if (latestData == null) {
            console.log("latest data is null");
        } else {
            if (JSON.stringify(this.LatestData) != JSON.stringify(latestData)) {
                this.LatestData = latestData;
                this.UpdatePastData(latestData);
            }
        }
    };

    MonitorNode.prototype.UpdateStatus = function (RECAPI) {
        this.UpdateLatestData(RECAPI);

        if (this.LatestData == null)
            return;

        var status;
        var script = "var " + this.Item + "=" + this.LatestData.data + ";";

        script += this.Condition + ";";
        status = eval(script);

        if (status == true) {
            if (this.Status == false) {
                this.IsRecovered = true;
            }
            this.Fault = 0;
        } else {
            var latestFaultData = RECAPI.getLatestData(this.Location, this.EvidenceNode.Label);
            if (latestFaultData) {
                this.Fault = latestFaultData.data;
            }
        }

        this.Status = status;
    };

    MonitorNode.prototype.Show = function (caseViewer, HTMLRenderFunctions, SVGRenderFunctions) {
        var data = "{ " + this.LatestData.type + " = " + this.LatestData.data + " }";
        this.EvidenceNode.Notes["LatestData"] = data;
        showNode(caseViewer, this.EvidenceNode, HTMLRenderFunctions, SVGRenderFunctions);
    };
    return MonitorNode;
})(ActionNode);
