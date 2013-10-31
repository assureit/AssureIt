function selectStrongColor(color1, color2) {
    if (color1 == AssureIt.Color.Danger || color2 == AssureIt.Color.Danger) {
        return AssureIt.Color.Danger;
    } else {
        return AssureIt.Color.Default;
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

function isActionNode(nodeModel) {
    return nodeModel.Type != AssureIt.NodeType.Evidence && nodeModel.Environment.Action != null && nodeModel.Environment.Location != null;
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

    ActionNode.prototype.BlushAllAncestor = function (caseViewer, nodeView, color) {
        if (nodeView == null)
            return;

        if (nodeView.SVGShape.GetColor() != AssureIt.Color.Searched) {
            nodeView.SVGShape.SetColor(color);
        }

        if (nodeView.ParentShape != null) {
            var brotherModels = nodeView.ParentShape.Source.Children;

            for (var i = 0; i < brotherModels.length; i++) {
                var view = caseViewer.ViewMap[brotherModels[i].Label];

                if (view.SVGShape.GetColor() != null) {
                    var currentColor = view.SVGShape.GetColor();
                    color = selectStrongColor(color, currentColor);
                }
            }
        }

        this.BlushAllAncestor(caseViewer, nodeView.ParentShape, color);
    };

    ActionNode.prototype.Show = function (caseViewer, HTMLRenderFunctions, SVGRenderFunctions) {
        showNode(caseViewer, this.EvidenceNode, HTMLRenderFunctions, SVGRenderFunctions);
    };
    return ActionNode;
})();
