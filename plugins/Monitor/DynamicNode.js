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

var MonitorNode = (function () {
    function MonitorNode(Location, Type, Condition, EvidenceNode) {
        this.Location = Location;
        this.Type = Type;
        this.Condition = Condition;
        this.LatestData = null;
        this.TurningPointData = null;
        this.PastData = [];
        this.Status = true;
        this.EvidenceNode = EvidenceNode;
        this.IsActive = false;
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

    MonitorNode.prototype.UpdatePastData = function (latestData) {
        if (this.PastData.length < 10) {
            this.PastData.unshift(latestData);
        } else {
            this.PastData.pop();
            this.PastData.unshift(latestData);
        }
    };

    MonitorNode.prototype.UpdateLatestData = function (RECAPI) {
        var latestData = RECAPI.getLatestData(this.Location, this.Type);

        if (latestData == null) {
            console.log("latest data is null");
        } else {
            if (JSON.stringify(this.LatestData) != JSON.stringify(latestData)) {
                this.LatestData = latestData;
                this.UpdatePastData(latestData);
            }
        }
    };

    MonitorNode.prototype.UpdateStatus = function () {
        var status;
        var script = "var " + this.Type + "=" + this.LatestData.data + ";";

        script += this.Condition + ";";
        status = eval(script);

        if (!status && !this.TurningPointData) {
            this.TurningPointData = this.LatestData;
        }

        this.Status = status;
    };

    MonitorNode.prototype.BlushAllAncestor = function (caseViewer, nodeView, fill, stroke) {
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

    MonitorNode.prototype.Show = function (caseViewer, HTMLRenderFunctions, SVGRenderFunctions) {
        var data = "{ " + this.LatestData.type + " = " + this.LatestData.data + " }";
        this.EvidenceNode.Notes["LatestData"] = data;
        showNode(caseViewer, this.EvidenceNode, HTMLRenderFunctions, SVGRenderFunctions);
    };
    return MonitorNode;
})();
