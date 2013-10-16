/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../../src/EditorUtil.ts" />
/// <reference path="./DScriptGenerator.ts" />
/// <reference path="./DScriptActionMap.ts" />
/// <reference path="./DScriptPaneManager.ts" />

var __dscript__ = {
	script : {
		main : "",
		lib : {},
		funcdef : {},
	},
	meta : {
		actionmap : {},
	},
};
__dscript__.script.funcdef = { //FIX ME!! on the assumption that function data is already extracted...
	"PortMonitor()" : "\n\
print(\"PortMonitor called...\");\n\
DFault ret = null;\n\
if (Monitor) {\n\
\tret = null;\n\
}\n\
else {\n\
\tret = fault(\"Computer is accessed by someone\");\n\
}\n\
return ret;\n\
",
	"BlockIP()" : "\n\
print(\"BlockIP called...\");\n\
DFault ret = null;\n\
//    command iptables;\n\
//try {\n\
//    iptables -A INPUT -p tcp -s $ip --dport $port -j DROP\n\
//}\n\
//catch (Exception e) {\n\
//}\n\
return ret;\n\
",
};

class DScriptPlugIn extends AssureIt.PlugInSet {
	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		var editorPlugIn: DScriptEditorPlugIn = new DScriptEditorPlugIn(plugInManager);
		this.ActionPlugIn = editorPlugIn;
		this.MenuBarContentsPlugIn = new DScriptMenuPlugIn(plugInManager, editorPlugIn);
		this.SideMenuPlugIn = new DScriptSideMenuPlugIn(plugInManager, editorPlugIn);
	}
}

class DScriptMenuPlugIn extends AssureIt.MenuBarContentsPlugIn {
	constructor(plugInManager: AssureIt.PlugInManager, public editorPlugIn: DScriptEditorPlugIn) {
		super(plugInManager);
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel): boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel, element: JQuery, serverApi: AssureIt.ServerAPI): boolean {
		element.append('<a href="#" ><img id="dscript"  src="' + serverApi.basepath + 'images/dse.png" title="DScript" alt="dscript" /></a>');
		$('#dscript').unbind('click');
		$('#dscript').bind('click', {
			editorPlugIn : this.editorPlugIn,
			nodeModel : nodeModel,
		}, this.editorPlugIn.ShowEditor);
		return true;
	}
}

class DScriptEditorPlugIn extends AssureIt.ActionPlugIn {
	ASNEditor; //CodeMirror Object
	DScriptEditor; //CodeMirror Object
	NodeRelationTable: JQuery;
	ActionRelationTable: JQuery;
	PaneManager: DScriptPaneManager;

	Widgets: any[]; /*FIXME*/
	Highlighter: ErrorHighlight;
	CaseViewer: AssureIt.CaseViewer;
	RootNodeModel: AssureIt.NodeModel;

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		var self = this;

		this.Widgets = [];
		this.ASNEditor = new CodeMirror($("<div/>").get(0), {
			lineNumbers: true,
			mode: "text/x-csrc",
			lineWrapping: true,
		});
		this.DScriptEditor = new CodeMirror($("<div/>").get(0), {
			lineNumbers: true,
			mode: "text/x-csrc",
			readOnly: true,
			placeholder: "Generated DScript code goes here.",
			lineWrapping: true,
		});
		this.NodeRelationTable = this.createTable(
			["action", "risk", "reaction"],
			function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
			}
		);
		this.ActionRelationTable = this.createTable(
			["location", "action", "risk", "reaction"],
			function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
				if (aData[3].match("Undefined") != null) {
					var $nRow = $(nRow);
					if ($nRow.hasClass("odd")) {
						$nRow.children().css("background-color", "#FFDDDD");
					}
					else if ($nRow.hasClass("even")) {
						$nRow.children().css("background-color", "#FFC4C4");
					}
				}
				return nRow;
			}
		);
		this.Highlighter = new ErrorHighlight(this.ASNEditor);

		this.ASNEditor.on("change", function(e: JQueryEventObject) {
			self.GenerateCode();
		});

		var wrapper = $("#dscript-editor-wrapper");
		wrapper.css({
			position : 'absolute',
			top : '5%',
			left : '5%',
			height : '90%',
			width : '90%',
			display : 'none',
			background : 'rgba(255, 255, 255, 0.85)',
		});

		var paneManager = new DScriptPaneManager(wrapper, $(this.ASNEditor.getWrapperElement()));
		paneManager.AddToOptionsList($(this.ASNEditor.getWrapperElement()), "ASN Editor", false);
		paneManager.AddToOptionsList($(this.DScriptEditor.getWrapperElement()), "DScript Viewer", false);
		paneManager.AddToOptionsList(this.NodeRelationTable.parent(), "Node Relation Table", false, true);
		paneManager.AddToOptionsList(this.ActionRelationTable.parent(), "Action Relation Table", false, true);
		paneManager.SetRefreshFunc(function() {
			self.ASNEditor.refresh();
			self.DScriptEditor.refresh();
		});
		this.PaneManager = paneManager;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): boolean {
		this.RootNodeModel = case0.ElementTop; // will be chenged in ShowEditor
		this.CaseViewer = caseViewer;
		return true;
	}

	ShowEditor(ev) { // callback function on DScriptMenu click event
		var self = ev.data.editorPlugIn;
		self.RootNodeModel = ev.data.nodeModel;
		var encoder: AssureIt.CaseEncoder = new AssureIt.CaseEncoder();
		var encoded: string = encoder.ConvertToASN(self.RootNodeModel, false);
		self.ASNEditor.setValue(encoded);
		if(ev.data.nodeModel.Case.IsEditable()) {
			self.ASNEditor.setOption("readOnly", false);
		} else {
			self.ASNEditor.setOption("readOnly", true);
		}

		var wrapper = $("#dscript-editor-wrapper");
		wrapper
			.css("display", "block")
			.addClass("animated fadeInDown")
			.focus()
			.one("blur", function(e: JQueryEventObject, node: JQuery) {
				e.stopPropagation();
				var topNodeModel = self.CaseViewer.ElementTop;
				var topNodeView = self.CaseViewer.ViewMap[self.RootNodeModel.Label];
				self.CaseViewer.DeleteViewsRecursive(topNodeView);
				if (self.RootNodeModel.Parent == null /* ElementTop */) {
					var caseView : AssureIt.NodeView = new AssureIt.NodeView(self.CaseViewer, topNodeModel);
					self.CaseViewer.ViewMap[topNodeModel.Label] = caseView;
				}
				self.CaseViewer.Draw();
				var centeringNodeView = self.CaseViewer.ViewMap[self.RootNodeModel.Label];
				self.CaseViewer.Screen.SetCaseCenter(centeringNodeView.AbsX, centeringNodeView.AbsY, centeringNodeView.HTMLDoc);

				wrapper.addClass("animated fadeOutUp");
				window.setTimeout(function() {
					wrapper.removeClass();
					wrapper.css("display", "none");
				}, 1300);
				topNodeModel.EnableEditFlag();
			})
			.on("keydown", function(e: JQueryEventObject) {
				if(e.keyCode == 27 /* ESC */){
					e.stopPropagation();
					wrapper.blur();
					wrapper.unbind('keydown');
				}
			});
		$('#CodeMirror').focus();
		$('#background').click(function(){
			wrapper.blur();
		});
		window.setTimeout(function() {
			wrapper.removeClass();
		}, 1300);
		self.ASNEditor.refresh();
		self.DScriptEditor.refresh();
		self.GenerateCode();
	}

	createTable(columnNames: string[], callbackFunc = null): JQuery {
		var table: JQuery = $("<table/>");
		var header: JQuery = $("<thead/>");
		var body: JQuery = $("<tbody/>");

		var tr: JQuery = $("<tr/>");
		for (var i: number = 0; i < columnNames.length; i++) {
			tr.append($("<th>").text(columnNames[i]));
		}
		header.append(tr);
		table.append(header).append(body);
		$("<div/>").append(table);
		return (<any>table).dataTable({
			"fnRowCallback" : callbackFunc,
		});
	}
// 	UpdateLineComment(editor: any, widgets: any[], generator: DScriptGenerator): void {
// 		editor.operation(function() {
// 			for (var i: number = 0; i < widgets.length; ++i) {
// 				editor.removeLineWidget(widgets[i]);
// 			}
// 			widgets.length = 0;
// 			for (var i: number = 0; i < generator.errorMessage.length; ++i) {
// 				var error: DScriptError = generator.errorMessage[i];
// 				console.log(error);
// 				//this.highlighter.Highlight(error.LineNumber, error.Message);
// 				var msg = document.createElement("div");
// 				var icon = msg.appendChild(document.createElement("span"));
// 				msg.appendChild(document.createTextNode(error.Message));
// 				$(msg).css("background", "none repeat scroll 0 0 #FFAAAA");
// 				widgets.push(editor.addLineWidget(error.LineNumber, msg, {coverGutter: false, noHScroll: true}));
// 			}
// 		});
// 	}

	UpdateNodeRelationTable(nodeRelation): void {
		(<any>this.NodeRelationTable).fnClearTable();
		for (var key in nodeRelation) {
			var relationMap = nodeRelation[key];
			var data: string[] = [
				relationMap["action"],
				"*",
				relationMap["reaction"],
			];
			(<any>this.NodeRelationTable).fnAddData(data);
		}
	}

	UpdateActionRelationTable(actionRelation): void {
		(<any>this.ActionRelationTable).fnClearTable();
		for (var key in actionRelation) {
			var relationMap = actionRelation[key];
			var data: string[] = [
				relationMap["location"],
				relationMap["action"]["node"] + ":" + relationMap["action"]["func"],
				relationMap["risk"],
				relationMap["reaction"]["node"] + ":" + relationMap["reaction"]["func"],
			];
			(<any>this.ActionRelationTable).fnAddData(data);
		}
	}

	GenerateCode(): void {
		var decoder: AssureIt.CaseDecoder = new AssureIt.CaseDecoder();
		var ASNData: string = this.ASNEditor.getValue();
		var case0: AssureIt.Case = this.RootNodeModel.Case;
		var orig_IdCounters = case0.ReserveIdCounters(this.RootNodeModel);
		var orig_ElementMap = case0.ReserveElementMap(this.RootNodeModel);
		var nodeModel = decoder.ParseASN(case0, ASNData, this.RootNodeModel);
		if (nodeModel == null) {
			this.Highlighter.Highlight(decoder.GetASNError().line, decoder.GetASNError().toString());
			case0.IdCounters = orig_IdCounters;
			case0.ElementMap = orig_ElementMap;
			nodeModel = case0.ElementTop;
		} else {
			var ParentModel = this.RootNodeModel.Parent;
			if (ParentModel != null) {
				nodeModel.Parent = ParentModel;
				for (var i in ParentModel.Children) {
					if (ParentModel.Children[i].Label == this.RootNodeModel.Label) {
						ParentModel.Children[i] = nodeModel;
					}
				}
			} else {
				this.CaseViewer.ElementTop = nodeModel;
				case0.ElementTop = nodeModel;
			}
		}
		this.RootNodeModel = nodeModel;
		this.Highlighter.ClearHighlight();

		try {
			nodeModel.UpdateEnvironment();
			var generator: DScriptGenerator = new DScriptGenerator();
			var script = generator.CodeGen(nodeModel);
 			var dscriptActionMap: DScriptActionMap = new DScriptActionMap(nodeModel);
			var nodeRelation = dscriptActionMap.GetNodeRelation();
			var actionRelation = dscriptActionMap.GetActionRelation();
 			__dscript__.script.main = script;
 			__dscript__.meta.actionmap = nodeRelation;
 			this.UpdateNodeRelationTable(nodeRelation);
 			this.UpdateActionRelationTable(actionRelation);
//			this.UpdateLineComment(this.ASNEditor, this.Widgets, generator);
			this.DScriptEditor.setValue(script);
		}
		catch(e) {
			//TODO:
			console.log("error occured in DScript Generation");
			console.log(e);
		}

		this.ASNEditor.refresh();
		this.DScriptEditor.refresh();
	}
}

class DScriptSideMenuPlugIn extends AssureIt.SideMenuPlugIn {

	AssureItAgentAPI: AssureIt.AssureItAgentAPI;
	editorPlugIn: DScriptEditorPlugIn;

	constructor(plugInManager: AssureIt.PlugInManager, editorPlugIn: DScriptEditorPlugIn) {
		super(plugInManager);
		this.AssureItAgentAPI = null;
		this.editorPlugIn = editorPlugIn;
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): boolean {
		return case0.IsEditable();
	}

	AddMenu(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): AssureIt.SideMenuModel {
		this.AssureItAgentAPI = new AssureIt.AssureItAgentAPI(serverApi.agentpath);
		var self = this;
		return new AssureIt.SideMenuModel('#', 'Deploy', "deploy", "glyphicon-list-alt"/* TODO: change icon */, (ev:Event)=>{
			self.editorPlugIn.GenerateCode();
			__dscript__.script.lib = {
				"GetDataFromRec.ds" : "\n\
int GetDataFromRec(String location, String type) {\n\
command rec;\n\
String data = rec -m getLatestData -t $type -l $location\n\
return (int)data.replaceAll(\"\\n\", \"\");\n\
}\n\
",
			};

			try {
				this.AssureItAgentAPI.Deploy(__dscript__);
			}
			catch(e) {
				alert("Assure-It Agent is not active.");
				console.log(e);
			}
			caseViewer.pluginManager.GetPlugInEnv("monitor").MonitorManager.RemoveAllMonitor();
		});
	}
}
