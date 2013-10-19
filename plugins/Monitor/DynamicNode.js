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

var DynamicNode = (function () {
    function DynamicNode(Location, EvidenceNode) {
        this.Location = Location;
        this.EvidenceNode = EvidenceNode;
        this.Fault = 0;
        this.Status = true;
        this.IsRecovered = false;
    }
    DynamicNode.prototype.SetLocation = function (location) {
        this.Location = location;
    };

    DynamicNode.prototype.UpdateStatus = function (RECAPI) {
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

    DynamicNode.prototype.BlushAllAncestor = function (caseViewer, nodeView, fill, stroke) {
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

    DynamicNode.prototype.Show = function (caseViewer, HTMLRenderFunctions, SVGRenderFunctions) {
        showNode(caseViewer, this.EvidenceNode, HTMLRenderFunctions, SVGRenderFunctions);
    };
    return DynamicNode;
})();
