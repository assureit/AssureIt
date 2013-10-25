/// <reference path="../ActionNode/ActionNode.ts" />


function isMonitorNode(nodeModel: AssureIt.NodeModel): boolean {
	return nodeModel.Type == AssureIt.NodeType.Evidence
		&& nodeModel.Environment.Monitor != null
		&& nodeModel.Environment.Location != null;
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
