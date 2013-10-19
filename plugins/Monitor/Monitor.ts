/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../../src/RecApi.ts" />
/// <reference path="./DynamicNode.ts" />
/// <reference path="./DynamicNodeManager.ts" />


var monitorManager: MonitorManager = null;


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

	var contextNode = getContextNode(nodeModel.Parent);
	if(contextNode == null) return false;
	if(!("Monitor" in contextNode.Notes)) return false
	if(!("Location" in contextNode.Notes)) return false;

	return true;
}


class MonitorPlugIn extends AssureIt.PlugInSet {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.HTMLRenderPlugIn = new MonitorHTMLRenderPlugIn(plugInManager);
		this.SVGRenderPlugIn = new MonitorSVGRenderPlugIn(plugInManager);
		this.MenuBarContentsPlugIn = new MonitorMenuBarPlugIn(plugInManager);
		this.SideMenuPlugIn = new MonitorSideMenuPlugIn(plugInManager);
		monitorManager = new MonitorManager();
		this.PlugInEnv = { "MonitorManager": monitorManager };
	}

}


class MonitorHTMLRenderPlugIn extends AssureIt.HTMLRenderPlugIn {

	IsEnabled(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel): boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel, element: JQuery) : boolean {
		if(!isMonitorNode(nodeModel)) return;
		if(!monitorManager.IsRegisteredMonitor(nodeModel.Label)) {
			monitorManager.SetMonitor(nodeModel);
		}

		var monitorNode = monitorManager.MonitorNodeMap[nodeModel.Label];
		if(monitorNode == null) return;

		this.RenderPastMonitoringData(monitorNode, element);
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

		var $link = $('<a href="#"><p align="right" style="color: '+linkColor+'">past data</p></a>');
		$link.click(function(ev: Event) {
			ev.stopPropagation();
			if(monitorNode.PastData.length < 1) {
				return;
			}

			var childWindow = window.open();
			for(var i: number = 0; i < monitorNode.PastData.length; i++) {
				var log: string = JSON.stringify(monitorNode.PastData[i]);
				$(childWindow.document.body).append($('<p>'+log+'</p>'));
			}
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
		var monitorNode: MonitorNode = monitorManager.MonitorNodeMap[nodeModel.Label];

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
		if(!monitorManager.IsRegisteredMonitor(caseModel.Label)) {
			return true;
		}

		var monitorNode = monitorManager.MonitorNodeMap[caseModel.Label];

		if(!monitorNode.IsActive) {
			element.append('<a href="#" ><img id="monitor-tgl" src="'+serverApi.basepath+'images/monitor.png" title="Activate monitor" alt="monitor-tgl" /></a>');
		}
		else {
			element.append('<a href="#" ><img id="monitor-tgl" src="'+serverApi.basepath+'images/monitor.png" title="Deactivate monitor" alt="monitor-tgl" /></a>');
		}

		$('#monitor-tgl').unbind('click');
		$('#monitor-tgl').click(function() {
			if(!monitorNode.IsActive) {
				monitorManager.ActivateMonitor(caseModel.Label);
			}
			else {
				monitorManager.DeactivateMonitor(caseModel.Label);
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
		monitorManager.Init(caseViewer, serverApi.recpath);

		return new AssureIt.SideMenuModel('#', 'Monitors', "monitors", "glyphicon-list-alt", (ev:Event)=>{
			var monitorTableWindow = new MonitorTableWindow();
			monitorTableWindow.UpdateTable();
			monitorTableWindow.Open();
		});
	}

}
