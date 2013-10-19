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


class MonitorNode {

	Location: string;
	Type: string;
	Condition: string;
	LatestData: any;
	TurningPointData: any;
	PastData: any[];
	Status: boolean;
	EvidenceNode: AssureIt.NodeModel;
	IsActive: boolean;

	constructor(Location: string, Type: string, Condition: string, EvidenceNode: AssureIt.NodeModel) {
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

	SetLocation(location: string) {
		this.Location = location;
	}

	SetType(type: string) {
		this.Type = type;
	}

	SetCondition(condition: string) {
		this.Condition = condition;
	}

	UpdatePastData(latestData: any) {
		if(this.PastData.length < 10) {
			this.PastData.unshift(latestData);
		}
		else {
			this.PastData.pop();
			this.PastData.unshift(latestData);
		}
	}

	UpdateLatestData(RECAPI: AssureIt.RECAPI) {
		var latestData = RECAPI.getLatestData(this.Location, this.Type);

		if(latestData == null) {
			// TODO: alert
			console.log("latest data is null");
		}
		else {
			if(JSON.stringify(this.LatestData) != JSON.stringify(latestData)) {
				this.LatestData = latestData;
				this.UpdatePastData(latestData);
			}
		}
	}

	UpdateStatus() {
		var status: boolean;
		var script: string = "var "+this.Type+"="+this.LatestData.data+";";

		script += this.Condition+";";
		status = eval(script);   // FIXME: don't use eval()

		if(!status && !this.TurningPointData) {
			this.TurningPointData = this.LatestData;
		}

		this.Status = status;
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
		var data: string =  "{ "+this.LatestData.type+" = "+this.LatestData.data+" }";
		this.EvidenceNode.Notes["LatestData"] = data;
		showNode(caseViewer, this.EvidenceNode, HTMLRenderFunctions, SVGRenderFunctions);
	}

}
