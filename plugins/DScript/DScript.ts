/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../../src/EditorUtil.ts" />
/// <reference path="./DScriptGenerator.ts" />
/// <reference path="./DScriptActionMap.ts" />

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

	IsEnabled(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel): boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel, element: JQuery, serverApi: AssureIt.ServerAPI): boolean {
		element.append('<a href="#" ><img id="dscript"  src="' + serverApi.basepath + 'images/dse.png" title="DScript" alt="dscript" /></a>');
		$('#dscript').unbind('click');
		$('#dscript').bind('click', {
			editorPlugIn : this.editorPlugIn,
			caseViewer : caseViewer,
			caseModel : caseModel,
		}, this.editorPlugIn.ShowEditor);
		return true;
	}
}

class DScriptEditorPlugIn extends AssureIt.ActionPlugIn {
	ASNEditor; //CodeMirror Object
	DScriptEditor; //CodeMirror Object
	ActionTable: JQuery;

	Widgets: any[]; /*FIXME*/
	Highlighter: ErrorHighlight;
	CaseViewer: AssureIt.CaseViewer;
	RootCaseModel: AssureIt.NodeModel;

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
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
		this.ActionTable = $("<table>");

		this.Highlighter = new ErrorHighlight(this.ASNEditor);
		var self = this;
		this.ASNEditor.on("change", function(e: JQueryEventObject) {
			self.GenerateCode();
		});

		var wrapper = $("#dscript-editor-wrapper");
		wrapper
			.append(this.ASNEditor.getWrapperElement())
			.append(this.DScriptEditor.getWrapperElement())
			.append(this.ActionTable);

		wrapper.css({
			position: 'absolute',
			top: '5%',
			left: '5%',
			height: '90%',
			width: '90%',
			display: 'none',
			background: 'rgba(255, 255, 255, 0.85)',
		});

		/* FIXME Replace it with sophisticated style. */
		// 		if (DScriptPlugIn.Use3Pane) {
		// 			$(this.ASNEditor.getWrapperElement()).css({
		// 				width: '100%',
		// 				height: '100%',
		// 			});
		// 			$(this.DScriptEditor.getWrapperElement()).css({
		// 				width: '100%',
		// 				height: '100%',
		// 			});
		// 			this.action_table.css({
		// 				width: '100%',
		// 			});
		// 			$('#dscript-editor-left').parent()
		// 				.css({
		// 					width: '50%',
		// 					height: '50%',
		// 					float: 'left',
		// 					display: 'block',
		// 				});
		// 			$('#dscript-editor-right').parent()
		// 				.css({
		// 					width: '50%',
		// 					height: '50%',
		// 					float: 'right',
		// 					display: 'block',
		// 				});
		// 			$('#dscript-action-table').parent()
		// 				.css({
		// 					width: '100%',
		// 					height: '50%',
		// 					display: 'block',
		// 					clear: 'both',
		// 					borderTop: 'solid 1px',
		// 				});
		// 		}
		// 		else {
		// 			$(this.DScriptEditor.getWrapperElement()).css({
		// 				width: '100%',

		// 				height: '100%',
		// 			});
		// 			this.action_table.css({
		// 				width: '100%',
		// 			});
		// 			$('#dscript-editor-left').parent()
		// 				.css({
		// 					display: 'none',
		// 				});
		// 			$('#dscript-editor-right').parent()
		// 				.css({
		// 					width: '50%',
		// 					height: '100%',
		// 					float: 'right',
		// 					display: 'block',
		// 				});
		// 			$('#dscript-action-table').parent()
		// 				.css({
		// 					width: '50%',
		// 					display: 'block',
		// 					float: 'left',
		// 				});
		// 		}
	}

	Delegate(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): boolean {
		this.CaseViewer = caseViewer;
		return true;
	}

	ShowEditor(ev) { // callback function on DScriptMenu click event
		console.log("show editor");
		var self = ev.data.editorPlugIn;
		self.RootCaseModel = ev.data.caseModel;
		var encoder: AssureIt.CaseEncoder = new AssureIt.CaseEncoder();
		var encoded: string = encoder.ConvertToASN(self.RootCaseModel, false);
		self.ASNEditor.setValue(encoded);
		if(ev.data.caseModel.Case.IsEditable()) {
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
				var topNodeView = self.CaseViewer.ViewMap[self.RootCaseModel.Label];
				self.CaseViewer.DeleteViewsRecursive(topNodeView);
				if (self.RootCaseModel.Parent == null /* ElementTop */) {
					var caseView : AssureIt.NodeView = new AssureIt.NodeView(self.CaseViewer, topNodeModel);
					self.CaseViewer.ViewMap[topNodeModel.Label] = caseView;
				}
				self.CaseViewer.Draw();
				var centeringNodeView = self.CaseViewer.ViewMap[self.RootCaseModel.Label];
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
			$('#dscript-editor-wrapper').blur();
		});
		window.setTimeout(function() {
			$('#dscript-editor-wrapper').removeClass();
		}, 1300);
		self.ASNEditor.refresh();
		self.DScriptEditor.refresh();
		self.GenerateCode();
	}
	UpdateLineComment(editor: any, widgets: any[], Generator: DScriptGenerator): void {
		editor.operation(function() {
			for (var i: number = 0; i < widgets.length; ++i) {
				editor.removeLineWidget(widgets[i]);
			}
			widgets.length = 0;
			for (var i: number = 0; i < Generator.errorMessage.length; ++i) {
				var error: DScriptError = Generator.errorMessage[i];
				console.log(error);
				//this.highlighter.Highlight(error.LineNumber, error.Message);
				var msg = document.createElement("div");
				var icon = msg.appendChild(document.createElement("span"));
				msg.appendChild(document.createTextNode(error.Message));
				$(msg).css("background", "none repeat scroll 0 0 #FFAAAA");
				widgets.push(editor.addLineWidget(error.LineNumber, msg, {coverGutter: false, noHScroll: true}));
			}
		});
	}

	UpdateActionTable(actionMap): void {
		var table: JQuery = $('#dscript-action-table');
		var tableWidth: number = table.parent().width();
		var header: JQuery = $("<tr><th>action</th><th>fault</th><th>reaction</th></tr>");
		var tpl: string = "<tr><td>${action}</td><td>${fault}</td><td>${reaction}</td></tr>";
		var style = {
            maxWidth: tableWidth / 3,
			minWidth: tableWidth / 3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
			textAlign: 'center',
            whiteSpace: 'nowrap',
		}
		table.children().remove();
		header.children().css(style);
		table.append(header);
		for (var key in actionMap) {
			var rowSrc: string = tpl
				.replace("${action}", actionMap[key]["action"])
				.replace("${fault}", "*")
				.replace("${reaction}", actionMap[key]["reaction"]);
			var row: JQuery = $(rowSrc);
			row.children().css(style);
			table.append(row);
		}
	}

	GenerateCode(): void {
		var decoder: AssureIt.CaseDecoder = new AssureIt.CaseDecoder();
		var ASNData: string = this.ASNEditor.getValue();
		var Case: AssureIt.Case = this.RootCaseModel.Case;
		var orig_IdCounters = Case.ReserveIdCounters(this.RootCaseModel);
		var orig_ElementMap = Case.ReserveElementMap(this.RootCaseModel);
		var caseModel = decoder.ParseASN(Case, ASNData, this.RootCaseModel);
		if (caseModel == null) {
			this.Highlighter.Highlight(decoder.GetASNError().line, decoder.GetASNError().toString());
			Case.IdCounters = orig_IdCounters;
			Case.ElementMap = orig_ElementMap;
			caseModel = Case.ElementTop;
		} else {
			var ParentModel = this.RootCaseModel.Parent;
			if (ParentModel != null) {
				caseModel.Parent = ParentModel;
				for (var i in ParentModel.Children) {
					if (ParentModel.Children[i].Label == this.RootCaseModel.Label) {
						ParentModel.Children[i] = caseModel;
					}
				}
			} else {
				this.CaseViewer.ElementTop = caseModel;
				Case.ElementTop = caseModel;
			}
		}
		this.RootCaseModel = caseModel;
		this.Highlighter.ClearHighlight();
		var genflag: boolean = false; //generate main function flag
		var Generator: DScriptGenerator = new DScriptGenerator();
		var script = Generator.codegen(orig_ElementMap, caseModel, ASNData, genflag);

 		var DScriptMap: DScriptActionMap = new DScriptActionMap(caseModel);
		var actionMap = DScriptMap.GetBody();
 		__dscript__.script.main = script;
 		__dscript__.meta.actionmap = actionMap;
 		this.UpdateActionTable(actionMap);
		this.UpdateLineComment(this.ASNEditor, this.Widgets, Generator);
		this.DScriptEditor.setValue(script);

		this.ASNEditor.refresh();
		this.DScriptEditor.refresh();
	}
}

class DScriptSideMenuPlugIn extends AssureIt.SideMenuPlugIn {

	AssureItAgentAPI: AssureIt.AssureItAgentAPI;
	editorPlugIn: DScriptEditorPlugIn;

	constructor(plugInManager: AssureIt.PlugInManager, editorPlugIn: DScriptEditorPlugIn) {
		super(plugInManager);
		this.AssureItAgentAPI = new AssureIt.AssureItAgentAPI("http://localhost:8081");   // TODO: change agent path
		this.editorPlugIn = editorPlugIn;
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, Case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): boolean {
		return Case0.IsEditable();
	}

	AddMenu(caseViewer: AssureIt.CaseViewer, Case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): AssureIt.SideMenuModel {
		var self = this;
		return new AssureIt.SideMenuModel('#', 'Deploy', "deploy", "glyphicon-list-alt"/* TODO: change icon */, (ev:Event)=>{
			self.editorPlugIn.RootCaseModel = Case0.ElementTop;
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
			console.log(__dscript__);
			this.AssureItAgentAPI.Deploy(__dscript__);
		});
	}
}
