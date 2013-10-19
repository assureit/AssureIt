function selectStrongColor(color1: string, color2: string): string {
	if(parseInt(color1.replace(/#/g, ""), 16) < parseInt(color2.replace(/#/g, ""), 16)) {
		return color1;
	}
	else {
		return color2;
	}
}

function showNode(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel, HTMLRenderFunctions: Function[], SVGRenderFunctions: Function[]) {
	var element: JQuery = caseViewer.ViewMap[nodeModel.Label].HTMLDoc.DocBase;
	var view: AssureIt.NodeView = caseViewer.ViewMap[nodeModel.Label];
	for(var i: number = 0; i < HTMLRenderFunctions.length; i++) {
		HTMLRenderFunctions[i](caseViewer, nodeModel, element);
	}
	for(var i: number = 0; i < SVGRenderFunctions.length; i++) {
		SVGRenderFunctions[i](caseViewer, view);
	}
}


class DynamicNode {

	Location: string;
	EvidenceNode: AssureIt.NodeModel;
	Fault: number;
	Status: boolean;
	IsRecovered: boolean;

	constructor(Location: string, EvidenceNode: AssureIt.NodeModel) {
		this.Location = Location;
		this.EvidenceNode = EvidenceNode;
		this.Fault = 0;
		this.Status = true;
		this.IsRecovered = false;
	}

	SetLocation(location: string) {
		this.Location = location;
	}

	UpdateStatus(RECAPI: AssureIt.RECAPI) {
		var latestFaultData = RECAPI.getLatestData(this.Location, this.EvidenceNode.Label);

		if(latestFaultData == null) {
			return;
		}

		var fault: number = latestFaultData.data;

		if(fault == 0) {
			if(this.Status == false) {
				this.IsRecovered = true;
			}
			this.Status = true;
		}
		else {
			this.Status = false;
		}
		this.Fault = fault;
	}

	BlushAllAncestor(caseViewer: AssureIt.CaseViewer, nodeView: AssureIt.NodeView, fill: string, stroke: string) {
		if(nodeView == null) return;

		nodeView.SetTemporaryColor(fill, stroke);

		if(nodeView.ParentShape != null) {
			var brotherModels: AssureIt.NodeModel[] = nodeView.ParentShape.Source.Children;

			for(var i: number = 0; i < brotherModels.length; i++) {
				var view: AssureIt.NodeView = caseViewer.ViewMap[brotherModels[i].Label];

				if(view.GetTemporaryColor() != null) {
					var tmpFill: string = view.GetTemporaryColor()["fill"];
					fill = selectStrongColor(fill, tmpFill);
				}
			}
		}

		this.BlushAllAncestor(caseViewer, nodeView.ParentShape, fill, stroke);
	}

	Show(caseViewer: AssureIt.CaseViewer, HTMLRenderFunctions: Function[], SVGRenderFunctions: Function[]) {
		showNode(caseViewer, this.EvidenceNode, HTMLRenderFunctions, SVGRenderFunctions);
	}

}
