/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../../src/RecApi.ts" />
/// <reference path="./MonitorNode.ts" />
/// <reference path="./MonitorNodeManager.ts" />


var monitorNodeManager: MonitorNodeManager = null;


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
		if(nodeModel.Parent == null) nodeModel.UpdateEnvironment();
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

		for(var key in monitorNodeManager.ActionNodeMap) {
			var monitorNode: MonitorNode = <MonitorNode>monitorNodeManager.ActionNodeMap[key];

			if(!("Item" in <any>monitorNode)) continue;

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


//class MonitorMenuBarPlugIn extends AssureIt.MenuBarContentsPlugIn {
//
//	constructor(plugInManager: AssureIt.PlugInManager) {
//		super(plugInManager);
//	}
//
//	IsEnabled(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel): boolean {
//		return true;
//	}
//
//	Delegate(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel, element: JQuery, serverApi: AssureIt.ServerAPI): boolean {
//		if(!monitorNodeManager.IsRegisteredMonitor(caseModel.Label)) {
//			return true;
//		}
//
//		var monitorNode = monitorNodeManager.MonitorNodeMap[caseModel.Label];
//
//		if(!monitorNode.IsActive) {
//			element.append('<a href="#" ><img id="monitor-tgl" src="'+serverApi.basepath+'images/monitor.png" title="Activate monitor" alt="monitor-tgl" /></a>');
//		}
//		else {
//			element.append('<a href="#" ><img id="monitor-tgl" src="'+serverApi.basepath+'images/monitor.png" title="Deactivate monitor" alt="monitor-tgl" /></a>');
//		}
//
//		$('#monitor-tgl').unbind('click');
//		$('#monitor-tgl').click(function() {
//			if(!monitorNode.IsActive) {
//				monitorNodeManager.ActivateMonitor(caseModel.Label);
//			}
//			else {
//				monitorNodeManager.DeactivateMonitor(caseModel.Label);
//			}
//		});
//
//		return true;
//	}
//
//}


class MonitorSideMenuPlugIn extends AssureIt.SideMenuPlugIn {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, Case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): boolean {
		return true;
	}

	AddMenu(caseViewer: AssureIt.CaseViewer, Case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): AssureIt.SideMenuModel {
		monitorNodeManager.Init(caseViewer, serverApi.recpath);

		return new AssureIt.SideMenuModel('#', 'Monitors', "monitors", "glyphicon-list-alt", (ev:Event)=>{
			var monitorTableWindow = new MonitorTableWindow();
			monitorTableWindow.UpdateTable();
			monitorTableWindow.Open();
		});
	}

}
