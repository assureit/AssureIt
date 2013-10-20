/* This file is needed to move DScript plugin directory */


function extractItemFromCondition(condition: string): string {
	var text: string = condition
						.replace(/\{/g, " ")
						.replace(/\}/g, " ")
						.replace(/\(/g, " ")
						.replace(/\)/g, " ")
						.replace(/==/g, " ")
						.replace(/<=/g, " ")
						.replace(/>=/g, " ")
						.replace(/</g, " ")
						.replace(/>/g, " ");

	var words: string[] = text.split(" ");
	var items: string[] = [];

	for(var i: number = 0; i < words.length; i++) {
		if(words[i] != "" && !$.isNumeric(words[i])) {
			items.push(words[i]);
		}
	}

	if(items.length != 1) {
		// TODO: alert
	}

	return items[0];
}

function appendNode(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel, type: AssureIt.NodeType): AssureIt.NodeModel {
	var viewMap: { [index: string]: AssureIt.NodeView } = caseViewer.ViewMap;
	var view: AssureIt.NodeView = viewMap[nodeModel.Label];
	var case0: AssureIt.Case = caseViewer.Source;
	var newNodeModel = new AssureIt.NodeModel(case0, nodeModel, type, null, null, {});
	case0.SaveIdCounterMax(case0.ElementTop);
	viewMap[newNodeModel.Label] = new AssureIt.NodeView(caseViewer, newNodeModel);
	viewMap[newNodeModel.Label].ParentShape = viewMap[nodeModel.Label];
	return newNodeModel;
}


class ActionNodeManager {

	RECAPI: AssureIt.RECAPI;
	Timer: number;
	ActionNodeMap: { [index: string]: ActionNode };
	CaseViewer: AssureIt.CaseViewer;
	HTMLRenderFunctions: Function[];
	SVGRenderFunctions: Function[];

	constructor() {
		this.ActionNodeMap = {};
	}

	Init(caseViewer: AssureIt.CaseViewer, recpath: string) {
		this.RECAPI = new AssureIt.RECAPI(recpath);
		this.CaseViewer = caseViewer;
		this.HTMLRenderFunctions = [];
		this.HTMLRenderFunctions.push(this.CaseViewer.GetPlugInHTMLRender("note"));
		this.HTMLRenderFunctions.push(this.CaseViewer.GetPlugInHTMLRender("monitor"));
		this.SVGRenderFunctions = [];
		this.SVGRenderFunctions.push(this.CaseViewer.GetPlugInSVGRender("monitor"));
	}

	StartMonitoring(interval: number) {
		console.log("start monitoring");
		var self = this;

		this.Timer = setInterval(function() {
			for(var key in self.ActionNodeMap) {
				var monitorNode = self.ActionNodeMap[key];

				if(self.CaseViewer.Source.ElementMap[key] == null) {
					self.RemoveActionNode(key);   // delete monitor
					continue;
				}

				if(monitorNode == null) {
					console.log("monitor:'"+key+"' is not registered");
				}

				try {
					monitorNode.UpdateStatus(self.RECAPI);
					monitorNode.Show(self.CaseViewer, self.HTMLRenderFunctions, self.SVGRenderFunctions);
				}
				catch(e) {
					self.RemoveAllActionNode();
					return;
				}
			}

			self.CaseViewer.Draw();
		}, interval);
	}

	StopMonitoring() {
		console.log("stop monitoring");
		clearTimeout(this.Timer);
	}

	RemoveActionNode(label: string) {
		delete this.ActionNodeMap[label];
		if(Object.keys(this.ActionNodeMap).length == 0) {   // manager has no moniotr
			this.StopMonitoring();
		}
	}

	RemoveAllActionNode() {
		for(var label in this.ActionNodeMap) {
			this.RemoveActionNode(label);
		}
	}

	SetActionNode(evidenceNode: AssureIt.NodeModel) {
		var location: string = getContextNode(evidenceNode.Parent).Notes["Location"];
		var actionNode = this.ActionNodeMap[evidenceNode.Label];

		if(actionNode == null) {
			this.ActionNodeMap[evidenceNode.Label] = new ActionNode(location, evidenceNode);
		}
		else {
			actionNode.SetLocation(location);
		}

		if(Object.keys(this.ActionNodeMap).length == 1) {   // manager has one monitor
			this.StartMonitoring(5000);
		}
	}

}
