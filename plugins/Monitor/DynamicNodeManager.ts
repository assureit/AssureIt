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


class MonitorManager {

	RECAPI: AssureIt.RECAPI;
	Timer: number;
	MonitorNodeMap: { [index: string]: MonitorNode };
	CaseViewer: AssureIt.CaseViewer;
	HTMLRenderFunctions: Function[];
	SVGRenderFunctions: Function[];

	constructor() {
		this.MonitorNodeMap = {};
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

	StartMonitors(interval: number) {
		console.log("start monitoring");
		var self = this;

		this.Timer = setInterval(function() {
			for(var key in self.MonitorNodeMap) {
				var monitorNode = self.MonitorNodeMap[key];

				if(self.CaseViewer.Source.ElementMap[key] == null) {
					self.RemoveMonitor(key);   // delete monitor
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
					self.RemoveAllMonitor();
					return;
				}
			}

			self.CaseViewer.Draw();
		}, interval);
	}

	StopMonitors() {
		console.log("stop monitoring");
		clearTimeout(this.Timer);
	}

	SetMonitor(evidenceNode: AssureIt.NodeModel) {
		var location: string = getContextNode(evidenceNode.Parent).Notes["Location"];
		var condition: string = getContextNode(evidenceNode.Parent).Notes["Monitor"];
		var item: string = extractItemFromCondition(condition);
		var monitorNode = this.MonitorNodeMap[evidenceNode.Label];

		if(monitorNode == null) {
			this.MonitorNodeMap[evidenceNode.Label] = new MonitorNode(location, item, condition, evidenceNode);
		}
		else {
			monitorNode.SetLocation(location);
			monitorNode.SetItem(item);
			monitorNode.SetCondition(condition);
		}

		if(Object.keys(this.MonitorNodeMap).length == 1) {   // manager has one monitor
			this.StartMonitors(5000);
		}
	}

	RemoveMonitor(label: string) {
		delete this.MonitorNodeMap[label];
		if(Object.keys(this.MonitorNodeMap).length == 0) {   // manager has no moniotr
			this.StopMonitors();
		}
	}

	RemoveAllMonitor() {
		for(var label in this.MonitorNodeMap) {
			this.RemoveMonitor(label);
		}
	}

	IsRegisteredMonitor(label: string): boolean {
		if(label in this.MonitorNodeMap) {
			return true;
		}
		return false;
	}

}
