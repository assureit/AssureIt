/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../../src/RecApi.ts" />
/// <reference path="./MonitorNode.ts" />
/// <reference path="./MonitorNodeManager.ts" />


var monitorNodeManager: MonitorNodeManager = null;
var monitorWindow = null;


class MonitorPlugIn extends AssureIt.PlugInSet {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.HTMLRenderPlugIn = new MonitorHTMLRenderPlugIn(plugInManager);
		this.SVGRenderPlugIn = new MonitorSVGRenderPlugIn(plugInManager);
		//this.MenuBarContentsPlugIn = new MonitorMenuBarPlugIn(plugInManager);
		this.SideMenuPlugIn = new MonitorSideMenuPlugIn(plugInManager);
		monitorNodeManager = new MonitorNodeManager();
		this.PlugInEnv = { "ActionNodeManager": monitorNodeManager };
	}

}


class MonitorHTMLRenderPlugIn extends AssureIt.HTMLRenderPlugIn {

	IsEnabled(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel): boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel, element: JQuery) : boolean {
		var proto = (nodeModel.Parent != null ? nodeModel.Parent.Environment : {})
		nodeModel.UpdateEnvironment(proto);
		if(!isMonitorNode(nodeModel)) return;
		monitorNodeManager.SetMonitorNode(nodeModel);

		var monitorNode = monitorNodeManager.ActionNodeMap[nodeModel.Label];
		if(monitorNode == null || !("Item" in <any>monitorNode)) return;   // not MonitorNode

		this.RenderPastMonitoringData(<MonitorNode>monitorNode, element);
	}

	RenderPastMonitoringData(monitorNode: MonitorNode, element: JQuery) {
		element.children("#monitor-logs").remove();

		var $logs = $('<div id="monitor-logs"></div>');
		if(monitorNode.PastData.length < 1) {
			return true;
		}

		var linkColor: string;
		if(monitorNode.Status == true) {
			if(monitorNode.IsRecovered) {
				linkColor = 'orange';
			}
			else {
				linkColor = 'blue';
			}
		}
		else {
			linkColor = 'red';
		}

		var $link = $('<a href="#"><p align="right" style="color: '+linkColor+'">Monitor Log</p></a>');
		$link.click(function(ev: Event) {
			ev.stopPropagation();
			monitorWindow.ShowMonitorLogTable(monitorNode.EvidenceNode.Label);
		});

		$link.appendTo($logs);
		$logs.appendTo(element);
	}

}


class MonitorSVGRenderPlugIn extends AssureIt.SVGRenderPlugIn {

	IsEnabled(caseViewer: AssureIt.CaseViewer, nodeView: AssureIt.NodeView) : boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, nodeView: AssureIt.NodeView) : boolean {
		var nodeModel: AssureIt.NodeModel = nodeView.Source;
		var monitorNode: MonitorNode = <MonitorNode>monitorNodeManager.ActionNodeMap[nodeModel.Label];

		if(!monitorNode) return true;

		if(monitorNode.Status) {
			if(monitorNode.IsRecovered) {
				var fill: string = "#FFFF99";   // FIXME: allow any color
				var stroke: string = "none";
				monitorNode.BlushAllAncestor(caseViewer, nodeView, fill, stroke);
			}
		}
		else {
			var fill: string = "#FF9999";   // FIXME: allow any color
			var stroke: string = "none";
			monitorNode.BlushAllAncestor(caseViewer, nodeView, fill, stroke);
		}

		return true;
	}

}


class MonitorWindow {

	constructor() {}

	InitWindow(tableTitle: string): JQuery {
		$('#modal-monitors').remove();
		var $modal = $('<div id="modal-monitors" title="'+tableTitle+'"/>');

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

		return $modal;
	}

	ShowMonitorTable() {
		var self = this;
		var $modal = this.InitWindow("Monitors");

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
					+ '</table>');

		var $tbody = $('<tbody></tbody>');
		for(var key in monitorNodeManager.ActionNodeMap) {
			var monitorNode: MonitorNode = <MonitorNode>monitorNodeManager.ActionNodeMap[key];

			if(!("Item" in <any>monitorNode)) continue;

			if(monitorNode.LatestData != null) {
				var $tr = $('<tr id="monitorlog-'+monitorNode.EvidenceNode.Label+'"></tr>');
				$tr.unbind('click');

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
				}

				$tr.click(function() {
					self.ShowMonitorLogTable(monitorNode.EvidenceNode.Label);
				});

				$tr.appendTo($tbody);
			}
		}

		$tbody.appendTo($table);
		$table.appendTo($modal);
		$modal.appendTo('layer2');

		(<any>$('#monitor-table')).dataTable({
				"bPaginate": true,
				"bLengthChange": true,
				"bFilter": true,
				"bSort": true,
				"bInfo": true,
				"bAutoWidth": true
		});

		self.Open();
	}

	ShowMonitorLogTable(label: string) {
		var $modal = this.InitWindow(label+" Logs");

		var $table = $('<table id="monitor-table" bgcolor="#999999">'
						+ '<thead>'
							+ '<tr>'
								+ '<th>Timestamp</th>'
								+ '<th>Type</th>'
								+ '<th>Location</th>'
								+ '<th>Latest Data</th>'
								+ '<th>Auth ID</th>'
							+ '</tr>'
						+ '</thead>'
					+ '</table>');

		var $tbody = $('<tbody></tbody>');
		var pastData = (<MonitorNode>monitorNodeManager.ActionNodeMap[label]).PastData;
		for(var i: number = 0; i < pastData.length; i++) {
			var $tr = $('<tr></tr>');
			$tr.append('<td>'+pastData[i]['timestamp']+'</td>');
			$tr.append('<td>'+pastData[i]['type']+'</td>');
			$tr.append('<td>'+pastData[i]['location']+'</td>');
			$tr.append('<td>'+pastData[i]['data']+'</td>');
			$tr.append('<td>'+pastData[i]['authid']+'</td>');
			$tr.appendTo($tbody);
		}

		$tbody.appendTo($table);
		$table.appendTo($modal);
		$modal.appendTo('layer2');

		(<any>$('#monitor-table')).dataTable({
				"bPaginate": true,
				"bLengthChange": true,
				"bFilter": true,
				"bSort": true,
				"bInfo": true,
				"bAutoWidth": true
		});

		this.Open();
	}

	Open() {
		(<any>$('#modal-monitors')).dialog('open');
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
		monitorNodeManager.Init(caseViewer, serverApi.recpath);
		monitorWindow = new MonitorWindow();

		return new AssureIt.SideMenuModel('#', 'Monitors', "monitors", "glyphicon-list-alt", (ev:Event)=>{
			monitorWindow.ShowMonitorTable();
		});
	}

}
