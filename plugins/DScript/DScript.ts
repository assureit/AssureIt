/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../../src/EditorUtil.ts" />
/// <reference path="./DScriptGenerator.ts" />
/// <reference path="./DScriptActionMap.ts" />


var generatedScript: string = "";

class DScriptPlugIn extends AssureIt.PlugInSet {
	static Use3Pane : boolean = true;

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		var plugin: DScriptEditorPlugIn = new DScriptEditorPlugIn(plugInManager);
		this.ActionPlugIn = plugin;
		this.MenuBarContentsPlugIn = new DScriptMenuPlugIn(plugInManager, plugin);
		this.SideMenuPlugIn = new DScriptSideMenuPlugIn(plugInManager);
	}
}

class DScriptMenuPlugIn extends AssureIt.MenuBarContentsPlugIn {
	editorPlugIn: DScriptEditorPlugIn;
	constructor(plugInManager: AssureIt.PlugInManager, editorPlugIn: DScriptEditorPlugIn) {
		super(plugInManager);
		this.editorPlugIn = editorPlugIn;
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel) : boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel, element: JQuery, serverApi: AssureIt.ServerAPI): boolean {
		var self = this;
		element.append('<a href="#" ><img id="dscript"  src="'+serverApi.basepath+'images/dse.png" title="DScript" alt="dscript" /></a>');

		$('#dscript').unbind('dblclick');
		$('#dscript').click((ev) => {
				var encoder : AssureIt.CaseEncoder = new AssureIt.CaseEncoder();
				var encoded = encoder.ConvertToASN(caseModel, false);
				this.editorPlugIn.rootCaseModel = caseModel;
				this.editorPlugIn.editor_left.setValue(encoded);
				if(caseModel.Case.IsEditable()) {
					this.editorPlugIn.editor_left.setOption("readOnly", false);
				} else {
					this.editorPlugIn.editor_left.setOption("readOnly", true);
				}
				$('#dscript-editor-wrapper')
					.css({display: 'block'})
					.addClass("animated fadeInDown")
					.focus()
					.one("blur", {node : caseModel}, function(e: JQueryEventObject, node: JQuery) {
						e.stopPropagation();
						var TopNodeModel = self.editorPlugIn.caseViewer.ElementTop;
						var TopNodeView = self.editorPlugIn.caseViewer.ViewMap[caseModel.Label];
						self.editorPlugIn.caseViewer.DeleteViewsRecursive(TopNodeView);
						if (caseModel.Parent == null /* ElementTop */) {
							var caseView : AssureIt.NodeView = new AssureIt.NodeView(self.editorPlugIn.caseViewer, TopNodeModel);
							self.editorPlugIn.caseViewer.ViewMap[TopNodeModel.Label] = caseView;
						}
						self.editorPlugIn.caseViewer.Draw();
						var centeringNodeView = self.editorPlugIn.caseViewer.ViewMap[self.editorPlugIn.rootCaseModel.Label];
						caseViewer.Screen.SetCaseCenter(centeringNodeView.AbsX, centeringNodeView.AbsY, centeringNodeView.HTMLDoc);

						var $this = $(this);
						$this.addClass("animated fadeOutUp");
						window.setTimeout(function() {
							$this.removeClass();
							$this.css({display: 'none'});
						}, 1300);
						TopNodeModel.EnableEditFlag();
					})
					.on("keydown", function(e: JQueryEventObject) {
						if(e.keyCode == 27 /* ESC */){
							e.stopPropagation();
							$('#dscript-editor-wrapper').blur();
							$('#dscript-editor-wrapper').unbind('keydown');
						}
					});
				$('#CodeMirror').focus();
				$('#background').click(function(){
					$('#dscript-editor-wrapper').blur();
				});
				window.setTimeout(function() {
					$('#dscript-editor-wrapper').removeClass();
				}, 1300);
				this.editorPlugIn.editor_left.refresh();
				this.editorPlugIn.editor_right.refresh();
				this.editorPlugIn.GenerateCode();
		});
		return true;
	}
}

class DScriptEditorPlugIn extends AssureIt.ActionPlugIn {
	editor_left:  any;
	editor_right: any;
	action_table: JQuery;
	widgets : any[]; /*FIXME*/
	highlighter : ErrorHighlight;
	rootCaseModel: AssureIt.NodeModel;
	caseViewer: AssureIt.CaseViewer;
	constructor(plugInManager: AssureIt.PlugInManager) {
		this.widgets = [];
		super(plugInManager);

		this.editor_left = CodeMirror.fromTextArea(document.getElementById('dscript-editor-left'), {
			lineNumbers: true,
			mode: "text/x-csrc",
			lineWrapping: true,
		});
		this.editor_right = CodeMirror.fromTextArea(document.getElementById('dscript-editor-right'), {
			lineNumbers: true,
			mode: "text/x-csrc",
			readOnly: true,
			placeholder: "Generated DScript code goes here.",
			lineWrapping: true,
		});
		this.action_table = $('<table id="dscript-action-table"></table>');
		$("#dscript-editor-wrapper").append($("<div>").append(this.action_table));

		$('#dscript-editor-wrapper').css({
			position: 'absolute',
			top: '5%',
			left: '5%',
			height: '90%',
			width: '90%',
			display: 'none',
			background: 'rgba(255, 255, 255, 0.85)',
		});

		/* FIXME Replace it with sophisticated style. */
		if (DScriptPlugIn.Use3Pane) {
			$(this.editor_left.getWrapperElement()).css({
				width: '100%',
				height: '100%',
			});
			$(this.editor_right.getWrapperElement()).css({
				width: '100%',
				height: '100%',
			});
			this.action_table.css({
				width: '100%',
			});
			$('#dscript-editor-left').parent()
				.css({
					width: '50%',
					height: '50%',
					float: 'left',
					display: 'block',
				});
			$('#dscript-editor-right').parent()
				.css({
					width: '50%',
					height: '50%',
					float: 'right',
					display: 'block',
				});
			$('#dscript-action-table').parent()
				.css({
					width: '100%',
					height: '50%',
					display: 'block',
					clear: 'both',
					borderTop: 'solid 1px',
				});
		}
		else {
			$(this.editor_right.getWrapperElement()).css({
				width: '100%',

				height: '100%',
			});
			this.action_table.css({
				width: '100%',
			});
			$('#dscript-editor-left').parent()
				.css({
					display: 'none',
				});
			$('#dscript-editor-right').parent()
				.css({
					width: '50%',
					height: '100%',
					float: 'right',
					display: 'block',
				});
			$('#dscript-action-table').parent()
				.css({
					width: '50%',
					display: 'block',
					float: 'left',
				});
		}

		this.highlighter = new ErrorHighlight(this.editor_left)
		var self = this;
		this.editor_left.on("change", function(e: JQueryEventObject) {
			self.GenerateCode();
		});
	}

	Delegate(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI) : boolean {
		this.caseViewer = caseViewer;
		return true;
	}

	updateLineComment(editor : any, widgets : any[], Generator: DScriptGenerator) : void{
		editor.operation(function(){
			for (var i = 0; i < widgets.length; ++i)
			editor.removeLineWidget(widgets[i]);
		widgets.length = 0;
		for (var i=0; i < Generator.errorMessage.length; ++i) {
			var error : DScriptError = Generator.errorMessage[i];
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

	updateActionTable(ActionMap : any) : void {
		var table : JQuery = $('#dscript-action-table');
		var table_width = table.parent().width();
		var header : JQuery = $("<tr><th>state</th><th>fault</th><th>action</th></tr>");
		var tpl : string = "<tr><td>${state}</td><td>${fault}</td><td>${action}</td></tr>";
		var style : any = {
            maxWidth: table_width / 3,
			minWidth: table_width / 3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
			textAlign: 'center',
            whiteSpace: 'nowrap',
		}
		table.children().remove();
		header.children().css(style);
		table.append(header);
		for (var key in ActionMap) {
			var row_src : string = tpl
				.replace("${state}", key)
				.replace("${fault}", "*")
				.replace("${action}", ActionMap[key]);
			var row : JQuery = $(row_src);
			row.children().css(style);
			table.append(row);
		}
	}

	GenerateCode() : void {
		var decoder : AssureIt.CaseDecoder = new AssureIt.CaseDecoder();
		var ASNData : string = this.editor_left.getValue();
		var Case: AssureIt.Case = this.rootCaseModel.Case;
		var orig_IdCounters = Case.ReserveIdCounters(this.rootCaseModel);
		var orig_ElementMap = Case.ReserveElementMap(this.rootCaseModel);
		var caseModel = decoder.ParseASN(Case, ASNData, this.rootCaseModel);
		if(caseModel == null) {
			this.highlighter.Highlight(decoder.GetASNError().line, decoder.GetASNError().toString());
			Case.IdCounters = orig_IdCounters;
			Case.ElementMap = orig_ElementMap;
		} else {
			var ParentModel = this.rootCaseModel.Parent;
			if (ParentModel != null) {
				caseModel.Parent = ParentModel;
				for (var i in ParentModel.Children) {
					if (ParentModel.Children[i].Label == this.rootCaseModel.Label) {
						ParentModel.Children[i] = caseModel;
					}
				}
			} else {
				this.caseViewer.ElementTop = caseModel;
				Case.ElementTop = caseModel;
			}
			this.rootCaseModel = caseModel;
			this.highlighter.ClearHighlight();
			var Generator: DScriptGenerator = new DScriptGenerator();
			var genflag: boolean = false; //generate main function flag
			generatedScript = Generator.codegen(orig_ElementMap, caseModel, ASNData, genflag);
//--------------------------------------------------------------------
			var DScriptMap: DScriptActionMap = new DScriptActionMap();
			var ActionMapScript: string = DScriptMap.GetActionMap(orig_ElementMap, caseModel, ASNData);
			this.updateActionTable(DScriptMap.ActionMap);
//--------------------------------------------------------------------
			this.updateLineComment(this.editor_left, this.widgets, Generator);
			this.editor_right.setValue(generatedScript);
		}
		this.editor_left.refresh();
		this.editor_right.refresh();
	}
}

class DScriptSideMenuPlugIn extends AssureIt.SideMenuPlugIn {

	AssureItAgentAPI: AssureIt.AssureItAgentAPI;

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.AssureItAgentAPI = new AssureIt.AssureItAgentAPI("http://localhost:8081");   // TODO: change agent path
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, Case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): boolean {
		return true;
	}

	AddMenu(caseViewer: AssureIt.CaseViewer, Case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): AssureIt.SideMenuModel {

		return new AssureIt.SideMenuModel('#', 'Deploy', "deploy", "glyphicon-list-alt"/* TODO: change icon */, (ev:Event)=>{
			var dscript: AssureIt.DScript = { 'main': '', 'lib': ''};
			dscript.main = { 'main.ds': generatedScript };
			dscript.lib = {
			"PortMonitor.ds" : "\n\
require dshell;\n\
\n\
//let Monitor = true\n\
\n\
String GetDataFromRec(String location, String type) {\n\
    command rec;\n\
    String data = rec -m getLatestData -t $type -l $location\n\
    return data;\n\
}\n\
\n\
DFault PortMonitor() {\n\
    print(\"PortMonitor called...\");\n\
    DFault ret;\n\
    if (Monitor) {\n\
	ret = new DFault._new(\"UnKnown\");\n\
    }\n\
    else {\n\
	ret = null;\n\
    }\n\
    return ret;\n\
}\n\
",
	"BlockIP.ds" : "\n\
require dshell;\n\
\n\
//let Monitor = true\n\
\n\
String GetDataFromRec(String location, String type) {\n\
    command rec;\n\
    String data = rec -m getLatestData -t $type -l $location\n\
    return data;\n\
}\n\
\n\
DFault BlockIP() {\n\
    print(\"BlockIP called...\");\n\
    DFault ret = null;\n\
    //    command iptables;\n\
    //try {\n\
    //    iptables -A INPUT -p tcp -s $ip --dport $port -j DROP\n\
    //}\n\
    //catch (Exception e) {\n\
    //}\n\
    return ret;\n\
}\n\
"
			};   // TODO: add library here !!
			this.AssureItAgentAPI.Deploy(dscript);
		});
	}

}
