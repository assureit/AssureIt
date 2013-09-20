/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../../src/RecApi.ts" />


var monitorManager: MonitorManager = null;


function extractTypeFromCondition(condition: string): string {
	var text: string = condition
						.replace(/\{/g, " ")
						.replace(/\}/g, " ")
						.replace(/\(/g, " ")
						.replace(/\)/g, " ")
						.replace(/<=/g, " ")
						.replace(/>=/g, " ")
						.replace(/</g, " ")
						.replace(/>/g, " ");

	var words: string[] = text.split(" ");
	var types: string[] = [];

	for(var i: number = 0; i < words.length; i++) {
		if(words[i] != "" && !$.isNumeric(words[i])) {
			types.push(words[i]);
		}
	}

	if(types.length != 1) {
		// TODO: alert
	}

	return types[0];
}

function isContextNode(nodeModel: AssureIt.NodeModel): boolean {
	if(nodeModel.Type == AssureIt.NodeType.Context) {
		return true;
	}

	return false;
}

function getContextNode(nodeModel: AssureIt.NodeModel): AssureIt.NodeModel {
	for(var i: number = 0; i < nodeModel.Children.length; i++) {
		if(isContextNode(nodeModel.Children[i])) return nodeModel.Children[i];
	}

	return null;
}

function isMonitorNode(nodeModel: AssureIt.NodeModel): boolean {
	if(nodeModel.Type != AssureIt.NodeType.Evidence) return false;
	if(!("Monitor" in nodeModel.Notes)) return false

	var contextNode = getContextNode(nodeModel.Parent);
	if(contextNode == null) return false;
	if(!("Location" in contextNode.Notes)) return false;

	return true;
}

function appendNode(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel, type: AssureIt.NodeType): AssureIt.NodeModel {
	var viewMap: { [index: string]: AssureIt.NodeView } = caseViewer.ViewMap;
	var view: AssureIt.NodeView = viewMap[nodeModel.Label];
	var case0: AssureIt.Case = caseViewer.Source;
	var newNodeModel = new AssureIt.NodeModel(case0, nodeModel, type, null, null);
	case0.SaveIdCounterMax(case0.ElementTop);
	viewMap[newNodeModel.Label] = new AssureIt.NodeView(caseViewer, newNodeModel);
	viewMap[newNodeModel.Label].ParentShape = viewMap[nodeModel.Label];
	return newNodeModel;
}

function showNode(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel, HTMLRenderFunction: Function, SVGRenderFunction: Function) {
	var element: JQuery = caseViewer.ViewMap[nodeModel.Label].HTMLDoc.DocBase;
	var view: AssureIt.NodeView = caseViewer.ViewMap[nodeModel.Label];
	HTMLRenderFunction(caseViewer, nodeModel, element);
	SVGRenderFunction(caseViewer, view);
}

function blushAllAncestor(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel, fill: string, stroke: string) {
	if(nodeModel == null) return;

	caseViewer.ViewMap[nodeModel.Label].SVGShape.SetColor(fill, stroke);

	var contextNode = getContextNode(nodeModel);

	if(contextNode != null) {
		caseViewer.ViewMap[contextNode.Label].SVGShape.SetColor(fill, stroke);
	}

	/* TODO: blush all ancestor node */
	//blushAllAncestor(caseViewer, nodeModel.Parent, fill, stroke);
}


class MonitorNode {

	Location: string;
	Type: string;
	Condition: string;
	LatestData: any;
	Status: boolean;
	EvidenceNode: AssureIt.NodeModel;

	constructor(Location: string, Type: string, Condition: string, EvidenceNode: AssureIt.NodeModel) {
		this.Location = Location;
		this.Type = Type;
		this.Condition = Condition;
		this.LatestData = null;
		this.Status = true;
		this.EvidenceNode = EvidenceNode;
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

	UpdateLatestData(RECAPI: AssureIt.RECAPI) {
		if(this.Status == true) {
			var latestData = RECAPI.getLatestData(this.Location, this.Type);

			if(latestData == null) {
				// TODO: alert
				console.log("latest data is null");
			}
			else {
				this.LatestData = latestData;
			}
		}
	}

	UpdateStatus() {
		if(this.Status = true) {
			var script: string = "var "+this.Type+"="+this.LatestData.data+";";
			script += this.Condition+";";
			this.Status = eval(script);   // FIXME: don't use eval()
		}
	}

	Show(caseViewer: AssureIt.CaseViewer, HTMLRenderFunction: Function, SVGRenderFunction: Function) {
		var contextNode: AssureIt.NodeModel = getContextNode(this.EvidenceNode);

		if(contextNode == null) {
			contextNode = appendNode(caseViewer, this.EvidenceNode, AssureIt.NodeType.Context);
		}

		if(this.Status == true) { /* success */
			contextNode.Notes["Status"] = "Success";
			contextNode.Notes[this.Type] = this.LatestData.data;
			contextNode.Notes["Timestamp"] = this.LatestData.timestamp;
		}
		else { /* fail */
			contextNode.Notes["Status"] = "Fail";
			contextNode.Notes[this.Type] = this.LatestData.data;
			contextNode.Notes["Timestamp"] = this.LatestData.timestamp;
			contextNode.Notes["Manager"] = this.LatestData.authid;

		}

		showNode(caseViewer, contextNode, HTMLRenderFunction, SVGRenderFunction);
	}

}


class MonitorManager {

	RECAPI: AssureIt.RECAPI;
	Timer: number;
	MonitorNodeMap: { [index: string]: MonitorNode };
	CaseViewer: AssureIt.CaseViewer;
	HTMLRenderFunction: Function;
	SVGRenderFunction: Function;

	constructor(caseViewer: AssureIt.CaseViewer) {
		this.RECAPI = new AssureIt.RECAPI("http://54.250.206.119/rec");
		this.MonitorNodeMap = {};
		this.CaseViewer = caseViewer;
		this.HTMLRenderFunction = this.CaseViewer.GetPlugInHTMLRender("note");
		this.SVGRenderFunction = this.CaseViewer.GetPlugInSVGRender("monitor");
	}

	StartMonitors(interval: number) {
		var self = this;

		this.Timer = setInterval(function() {
			for(var key in self.MonitorNodeMap) {
				var monitorNode = self.MonitorNodeMap[key];

				if(self.CaseViewer.Source.ElementMap[monitorNode.EvidenceNode.Label] == null) {
					delete self.MonitorNodeMap[key];   // delete monitor
					continue;
				}

				if(monitorNode == null) {
					console.log("monitor:'"+key+"' is not registered");
				}

				monitorNode.UpdateLatestData(self.RECAPI);
				if(monitorNode.LatestData == null) continue;

				monitorNode.UpdateStatus();
				monitorNode.Show(self.CaseViewer, self.HTMLRenderFunction, self.SVGRenderFunction);
			}

			self.CaseViewer.Draw();
		}, interval);
	}

	StopMonitors() {
		clearTimeout(this.Timer);
	}

	SetMonitor(evidenceNode: AssureIt.NodeModel) {
		var location: string = getContextNode(evidenceNode.Parent).Notes["Location"];
		var condition: string = evidenceNode.Notes["Monitor"];
		var type: string = extractTypeFromCondition(condition);
		var monitorNode = this.MonitorNodeMap[evidenceNode.Label];

		if(monitorNode == null) {
			this.MonitorNodeMap[evidenceNode.Label] = new MonitorNode(location, type, condition, evidenceNode);
		}
		else {
			monitorNode.SetLocation(location);
			monitorNode.SetType(type);
			monitorNode.SetCondition(condition);
		}

		if(Object.keys(this.MonitorNodeMap).length == 1) {   // manager has one monitor
			this.StartMonitors(5000);
		}
	}

	RemoveMonitor(label: string) {
		delete this.MonitorNodeMap[label];
		if(Object.keys(this.MonitorNodeMap).length == 0) {
			this.StopMonitors();
		}
	}

	IsRegisteredMonitor(label: string): boolean {
		if(label in this.MonitorNodeMap) {
			return true;
		}
		return false;
	}

}


class MonitorPlugIn extends AssureIt.PlugInSet {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.SVGRenderPlugIn = new MonitorSVGRenderPlugIn(plugInManager);
		this.MenuBarContentsPlugIn = new MonitorMenuBarPlugIn(plugInManager);
		this.SideMenuPlugIn = new MonitorSideMenuPlugIn(plugInManager);
	}

}


class MonitorSVGRenderPlugIn extends AssureIt.SVGRenderPlugIn {

	IsEnabled(caseViewer: AssureIt.CaseViewer, nodeView: AssureIt.NodeView) : boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, nodeView: AssureIt.NodeView) : boolean {
		var nodeModel: AssureIt.NodeModel = nodeView.Source;

		if(isMonitorNode(nodeModel)) {
			var contextNode = getContextNode(nodeModel);

			if(contextNode != null && contextNode.Notes["Status"] == "Fail") {
				var fill: string = "#FF9999";   // FIXME: allow any color
				var stroke: string = "none";

				blushAllAncestor(caseViewer, nodeModel, fill, stroke);
			}
		}

		return true;
	}

}


class MonitorTableWindow {

	constructor() {
		this.InitTable();
	}

	InitTable() {
		$('#modal-monitors').remove();
		var $modal = $('<div id="modal-monitors" title="Monitors" />');

		(<any>$modal).dialog({
			autoOpen: false,
			modal: true,
			resizable: false,
			draggable: false,
			show: "clip",
			hide: "fade",
			width: 800,
			height: 500,
		});

		var $table = $('<table id="monitor-table" bgcolor="#999999">'
						+ '<thead>'
							+ '<tr>'
								+ '<th>Monitor Node</th>'
								+ '<th>Type</th>'
								+ '<th>Location</th>'
								+ '<th>Latest Data</th>'
								+ '<th>Auth ID</th>'
								+ '<th>Timestamp</th>'
								+ '<th>Status</th>'
							+ '</tr>'
						+ '</thead>'
						+ '<tbody>'
						+ '</tbody>'
					+ '</table>');
		$modal.append($table);
		$modal.appendTo('layer2');
	}

	UpdateTable() {
		var $table = $('#monitor-table');
		$table.find('tbody').remove();
		var $tbody = $('<tbody></tbody>');

		for(var key in monitorManager.MonitorNodeMap) {
			var monitorNode = monitorManager.MonitorNodeMap[key];

			if(monitorNode.LatestData != null) {
				var $tr = $('<tr></tr>');
				$tr.append('<td>'+key+'</td>');
				$tr.append('<td>'+monitorNode.LatestData['type']+'</td>');
				$tr.append('<td>'+monitorNode.LatestData['location']+'</td>');
				$tr.append('<td>'+monitorNode.LatestData['data']+'</td>');
				$tr.append('<td>'+monitorNode.LatestData['authid']+'</td>');
				$tr.append('<td>'+monitorNode.LatestData['timestamp']+'</td>');
				if(monitorNode.Status) {
					$tr.append('<td>Success</td>');
				}
				else {
					$tr.append('<td>Fail</td>');
					$tr.attr('class', 'monitor-table-fail');
				}
				$tr.appendTo($tbody);
			}
		}

		$tbody.appendTo($table);
		$table.appendTo('#modal-monitors');

		(<any>$('#monitor-table')).dataTable({
				"bPaginate": true,
				"bLengthChange": true,
				"bFilter": true,
				"bSort": true,
				"bInfo": true,
				"bAutoWidth": true
		});

		//$('.monitor-table-fail').attr('bgcolor', '#FF9999');   // TODO: set color
	}

	Open() {
		(<any>$('#modal-monitors')).dialog('open');
	}

}


class MonitorMenuBarPlugIn extends AssureIt.MenuBarContentsPlugIn {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel): boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel, element: JQuery, serverApi: AssureIt.ServerAPI): boolean {
		if(monitorManager == null) {
			monitorManager = new MonitorManager(caseViewer);
		}

		if(!isMonitorNode(caseModel)) {
			return true;
		}

		var self = this;

		if(!monitorManager.IsRegisteredMonitor(caseModel.Label)) {
			element.append('<a href="#" ><img id="monitor-tgl" src="'+serverApi.basepath+'images/monitor.png" title="Set monitor" alt="monitor-tgl" /></a>');
		}
		else {
			element.append('<a href="#" ><img id="monitor-tgl" src="'+serverApi.basepath+'images/monitor.png" title="Remove monitor" alt="monitor-tgl" /></a>');
		}

		$('#monitor-tgl').unbind('click');
		$('#monitor-tgl').click(function() {
			if(!monitorManager.IsRegisteredMonitor(caseModel.Label)) {
				monitorManager.SetMonitor(caseModel);
			}
			else {
				monitorManager.RemoveMonitor(caseModel.Label);
			}
		});

		return true;
	}

}


class MonitorSideMenuPlugIn extends AssureIt.SideMenuPlugIn {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, Case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): boolean {
		return true;
	}

	AddMenu(caseViewer: AssureIt.CaseViewer, Case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): AssureIt.SideMenuModel {
		if(monitorManager == null) {
			monitorManager = new MonitorManager(caseViewer);
		}

		return new AssureIt.SideMenuModel('#', 'Monitors', "monitors", "glyphicon-list-alt", (ev:Event)=>{
			var monitorTableWindow = new MonitorTableWindow();
			monitorTableWindow.UpdateTable();
			monitorTableWindow.Open();
		});
	}

}
