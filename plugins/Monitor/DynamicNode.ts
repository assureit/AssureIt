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


class ActionNode {

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


class MonitorNode extends ActionNode {

	Item: string;
	Condition: string;
	LatestData: any;
	PastData: any[];

	constructor(Location: string, Item: string, Condition: string, EvidenceNode: AssureIt.NodeModel) {
		super(Location, EvidenceNode);
		this.Item = Item;
		this.Condition = Condition;
		this.LatestData = null;
		this.PastData = [];
	}

	SetItem(item: string) {
		this.Item = item;
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
		var latestData = RECAPI.getLatestData(this.Location, this.Item);

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

	UpdateStatus(RECAPI: AssureIt.RECAPI) {
		this.UpdateLatestData(RECAPI);

		if(this.LatestData == null) return;

		var status: boolean;
		var script: string = "var "+this.Item+"="+this.LatestData.data+";";

		script += this.Condition+";";
		status = eval(script);   // FIXME: don't use eval()

		if(status == true) {
			if(this.Status == false) {
				this.IsRecovered = true;
			}
			this.Fault = 0;
		}
		else {
			var latestFaultData = RECAPI.getLatestData(this.Location, this.EvidenceNode.Label);
			if(latestFaultData) {
				this.Fault = latestFaultData.data;
			}
		}

		this.Status = status;
	}

	Show(caseViewer: AssureIt.CaseViewer, HTMLRenderFunctions: Function[], SVGRenderFunctions: Function[]) {
		var data: string =  "{ "+this.LatestData.type+" = "+this.LatestData.data+" }";
		this.EvidenceNode.Notes["LatestData"] = data;
		showNode(caseViewer, this.EvidenceNode, HTMLRenderFunctions, SVGRenderFunctions);
	}

}
