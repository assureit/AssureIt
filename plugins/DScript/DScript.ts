/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../../src/EditorUtil.ts" />
/// <reference path="../../src/RecApi.ts" />
/// <reference path="../../src/AssureItAgentApi.ts" />
/// <reference path="./Generator.ts" />
/// <reference path="./ActionMap.ts" />
/// <reference path="./PaneManager.ts" />
/// <reference path="../ActionNode/ActionNode.ts" />
/// <reference path="../ActionNode/ActionNodeManager.ts" />

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
		return false;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel, element: JQuery, serverApi: AssureIt.ServerAPI): boolean {
		element.append('<a href="#" ><img id="dscript"  src="' + serverApi.basepath + 'images/dse.png" title="DScript" alt="dscript" /></a>');
		$('#dscript').unbind('click');
		$('#dscript').bind('click', function() {
			this.editorPlugIn.ShowEditor(nodeModel);
		});
		return true;
	}
}

class DScriptEditorPlugIn extends AssureIt.ActionPlugIn {
	ASNEditor; //CodeMirror Object
	DScriptViewer; //CodeMirror Object
	NodeRelationTable: JQuery;
	ActionRelationTable: JQuery;
	PaneManager: DScriptPaneManager;

//	Highlighter: ErrorHighlight;
	CaseViewer: AssureIt.CaseViewer;
	RootNodeModel: AssureIt.NodeModel;
	Generator: DScriptGenerator;

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		var self = this;

		this.Generator = new DShellCodeGenerator();
		//this.Generator = new ErlangCodeGenerator();

		this.ASNEditor = new CodeMirror($("<div/>").get(0), {
			lineNumbers: true,
			mode: "text/x-csrc",
			lineWrapping: true,
		});
		this.DScriptViewer = new CodeMirror($("<div/>").get(0), {
			lineNumbers: true,
			mode: "text/x-csrc",
			readOnly: true,
			placeholder: "Generated DScript code goes here.",
			lineWrapping: true,
		});
		this.NodeRelationTable = this.CreateTable(
			["Node", "Reaction", "Presume"],
			{
				bAutoWidth : false,
				aoColumns : [
					{ sWidth: '10%' },
					{ sWidth: '45%' },
					{ sWidth: '45%' }
				],
			}
		);
		this.ActionRelationTable = this.CreateTable(
			["Location", "Goal", "FailureRisk", "Action"],
			{
				bAutoWidth : false,
				fnRowCallback : function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
					var location = aData[0];
					var action = aData[3];
					if (location == "Undefined" ||
						action.match(/Undefined : E[0-9]+/) != null ||
						action == "NotExists") {
						var $nRow = $(nRow);
						if ($nRow.hasClass("odd")) {
							$nRow.children().css("background-color", "#FFDDDD");
						}
						else if ($nRow.hasClass("even")) {
							$nRow.children().css("background-color", "#FFC4C4");
						}
					}
					return nRow;
				},
				aoColumns : [
					{ sWidth: '15%' },
					{ sWidth: '45%' },
					{ sWidth: '20%' },
					{ sWidth: '20%' }
				],
			}
		);
		this.ASNEditor.on("change", function(e: JQueryEventObject) {
			self.UpdateAll();
		});
//		this.Highlighter = new ErrorHighlight(this.ASNEditor);

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
		paneManager.AddToOptionsList($(this.DScriptViewer.getWrapperElement()), "DScript Viewer", false);
		paneManager.AddToOptionsList(this.NodeRelationTable.parent().css({
			width : "100%",
			height : "100%",
			overflow : "scroll",
		}), "Node Relation Table", false, false);
		paneManager.AddToOptionsList(this.ActionRelationTable.parent().css({
			width : "100%",
			height : "100%",
			overflow : "scroll",
		}), "Action Relation Table", false, false);
		paneManager.SetRefreshFunc(function() {
			self.UpdateASNEditor(null);
			self.UpdateDScriptViewer(null);
		});
		paneManager.ShowWidget("Action Relation Table");
 		paneManager.AddWidgetOnBottom(
			paneManager.Options["Action Relation Table"],
			paneManager.Options["Node Relation Table"]
		);
		paneManager.AddWidgetOnRight(
			paneManager.Options["Node Relation Table"],
			paneManager.Options["DScript Viewer"]
		);
		this.PaneManager = paneManager;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): boolean {
		this.RootNodeModel = case0.ElementTop; // will be chenged in ShowEditor
		this.CaseViewer = caseViewer;
		this.Generator.LibraryManager.ServerApi = serverApi;
		return true;
	}

    ShowEditor(rootNodeModel) { // callback function on DScriptMenu click event
        var self = this;
		if (rootNodeModel != null) self.RootNodeModel = rootNodeModel;

		var wrapper = $("#dscript-editor-wrapper");
		wrapper
			.css("display", "block")
			.addClass("animated fadeInDown")
			.focus()
			.one("blur", function(e: JQueryEventObject, node: JQuery) {
				/*
				  ASN is already decoded in DecodeASN method.
				  Just update CaseViewer here.
				 */
				self.plugInManager.UseUILayer(self);
				var caseViewer = self.CaseViewer;
				var rootNodeModel: AssureIt.NodeModel = self.RootNodeModel;
				var rootNodeView: AssureIt.NodeView = new AssureIt.NodeView(caseViewer, rootNodeModel);
				var Parent: AssureIt.NodeModel = rootNodeModel.Parent;
				if (Parent != null) {
					rootNodeView.ParentShape = caseViewer.ViewMap[Parent.Label];
				} else {
					caseViewer.ElementTop = rootNodeModel;
					rootNodeModel.Case.ElementTop = rootNodeModel;
				}
				caseViewer.DeleteViewsRecursive(caseViewer.ViewMap[rootNodeModel.Label]);
				(function(model: AssureIt.NodeModel, view: AssureIt.NodeView): void {
					caseViewer.ViewMap[model.Label] = view;
					for (var i = 0; i < model.Children.length; i++) {
						var childModel = model.Children[i];
						var childView : AssureIt.NodeView = new AssureIt.NodeView(caseViewer, childModel);
						arguments.callee(childModel, childView);
					}
					if (model.Parent != null) view.ParentShape = caseViewer.ViewMap[model.Parent.Label];
				})(rootNodeModel, rootNodeView);

				wrapper.addClass("animated fadeOutUp");
				window.setTimeout(function() {
					wrapper.removeClass();
					wrapper.css("display", "none");
				}, 1300);
				rootNodeModel.EnableEditFlag();
				caseViewer.Draw();
				/* TODO We need to Draw twice for some unknown reason */
				caseViewer.Draw();
			});
		//hide screen
		var hideByClick = function() {
			wrapper.blur();
			wrapper.unbind("keydown", hideByKey);
			$('#background').unbind("click", hideByClick);
		};
		var hideByKey = function(e: JQueryEventObject) {
			if(e.keyCode == 27 /* ESC */){
				e.stopPropagation();
				wrapper.blur();
				wrapper.unbind("keydown", hideByKey);
				$('#background').unbind("click", hideByClick);
			}
		};
		$('#background').click(hideByClick);
		wrapper.on("keydown", hideByKey);
		window.setTimeout(function() {
			wrapper.removeClass();
		}, 1300);

		var encoder: AssureIt.CaseEncoder = new AssureIt.CaseEncoder();
		var encoded: string = encoder.ConvertToASN(self.RootNodeModel, false);
		self.ASNEditor.setValue(encoded); //call self.UpdateAll();
		if (self.RootNodeModel.Case.IsEditable()) {
			self.ASNEditor.setOption("readOnly", false);
		} else {
			self.ASNEditor.setOption("readOnly", true);
		}
		self.PaneManager.Refresh();
		self.DScriptViewer.focus();
	}

	CreateTable(columnNames: string[], initializationData = null): JQuery {
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
		return (<any>table).dataTable(initializationData);
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

	UpdateASNEditor(ASNData: string): void {
		if (ASNData != null) {
			this.ASNEditor.setValue(ASNData);
		}
		this.ASNEditor.refresh();
	}
	UpdateDScriptViewer(script: string): void {
		if (script != null) {
			this.DScriptViewer.setValue(script);
		}
		this.DScriptViewer.refresh();
	}
	UpdateNodeRelationTable(nodeRelationMap: { [index: string]: DScriptNodeRelation }): void {
		(<any>this.NodeRelationTable).fnClearTable();
		for (var key in nodeRelationMap) {
			var relation: DScriptNodeRelation = nodeRelationMap[key];
			var data = [
				relation.BaseNode,
				relation.ReactionsToString(),
				relation.PresumesToString()
			];
			(<any>this.NodeRelationTable).fnAddData(data);
		}
	}
	UpdateActionRelationTable(actionRelations: DScriptActionRelation[]): void {
		(<any>this.ActionRelationTable).fnClearTable();
		for (var j: number = 0; j < actionRelations.length; j++) {
			var actionRelation: DScriptActionRelation = actionRelations[j];
			var targetNode: AssureIt.NodeModel = actionRelation.GetTargetNode();
			var reactionNodes: AssureIt.NodeModel[] = actionRelation.GetReactionNodes();
			if (reactionNodes.length == 0) {
				var data: string[] = [
					reactionNode.Environment.Location != null ? reactionNode.Environment.Location : "Undefined",
					(targetNode.Statement != null ? targetNode.Statement : "NoStatement") + " : " + targetNode.Label,
					actionRelation.Risk != null ? actionRelation.Risk : "*",
					"NotExists",
				];
				(<any>this.ActionRelationTable).fnAddData(data);
			}
			else {
				for (var i: number = 0; i < reactionNodes.length; i++) {
					var reactionNode: AssureIt.NodeModel = reactionNodes[i];
					var data: string[] = [
						reactionNode.Environment.Location != null ? reactionNode.Environment.Location : "Undefined",
						(targetNode.Statement != null ? targetNode.Statement : "NoStatement") + " : " + targetNode.Label,
						actionRelation.Risk != null ? actionRelation.Risk : "*",
						(reactionNode.GetNote("Action") != null ? reactionNode.GetNote("Action") : "Undefined") + " : " + reactionNode.Label
					];
					(<any>this.ActionRelationTable).fnAddData(data);
				}
			}
		}
	}

	DecodeASN(): void {
//		self.ErrorHighlight.ClearHighlight();
		var case0: AssureIt.Case = this.RootNodeModel.Case;
		var origModel: AssureIt.NodeModel = this.RootNodeModel;

		/* In order to keep labels the same as much as possible */
		var origIdCounters = case0.ReserveIdCounters(origModel);
		var origElementMap = case0.ReserveElementMap(origModel);

		var decoder: AssureIt.CaseDecoder = new AssureIt.CaseDecoder();
		var newModel: AssureIt.NodeModel = decoder.ParseASN(case0, this.ASNEditor.getValue(), origModel);

		if (newModel != null) {
			var Parent: AssureIt.NodeModel = origModel.Parent;
			if (Parent != null) {
				newModel.Parent = Parent;
				for (var j in Parent.Children) {
					if (Parent.Children[j].Label == origModel.Label) {
						Parent.Children[j] = newModel;
					}
				}
			} else {
				case0.ElementTop = newModel;
			}
			newModel.EnableEditFlag();
			this.RootNodeModel = newModel;
		} else {
			/* Show an error */
//			self.ErrorHighlight.Highlight(decoder.GetASNError().line,"");
			case0.ElementMap = origElementMap;
			case0.IdCounters = origIdCounters;
		}
	}

	UpdateAll(): any {
		var ret = {
			script : {
				main : "",
				lib : {},
			},
			meta : {
				actionmap : {},
			},
		};
		try {
			this.DecodeASN();
 			this.RootNodeModel.UpdateEnvironment();
			var dscriptActionMap: DScriptActionMap = new DScriptActionMap(this.RootNodeModel);
			console.log(dscriptActionMap);
 			var nodeRelationMap: { [index: string]: DScriptNodeRelation } = dscriptActionMap.GetNodeRelationMap();
 			var actionRelations: DScriptActionRelation[] = dscriptActionMap.GetActionRelations();
 			var script = ""
				+ this.Generator.GeneratePreface()
				+ this.RootNodeModel.CodeGen(this.Generator)
				+ this.Generator.GenerateMainFunction(dscriptActionMap);
  			ret.script.main = script;
//  			ret.meta.actionmap = nodeRelation;
			this.UpdateASNEditor(null);
 			this.UpdateDScriptViewer(script);
  			this.UpdateNodeRelationTable(nodeRelationMap);
 			this.UpdateActionRelationTable(actionRelations);
//			this.UpdateLineComment(this.ASNEditor, this.Widgets, generator);
//			(<any>this).TypeCheck();
		}
		catch(e) {
			//TODO:
			console.log("DScript plugin : error occured in UpdateAll");
			console.log(e);
		}
		return ret;
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

	AddMenus(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): AssureIt.SideMenuModel[] {
		var ret: AssureIt.SideMenuModel[] = [];
		var self = this;
		this.AssureItAgentAPI = new AssureIt.AssureItAgentAPI(serverApi.agentpath);
		ret.push(new AssureIt.SideMenuModel('#', 'Deploy', "deploy", "glyphicon-list-alt"/* TODO: change icon */, (ev:Event)=>{
			self.editorPlugIn.RootNodeModel = case0.ElementTop;
			var data = self.editorPlugIn.UpdateAll();
			var actionNodeManager: ActionNodeManager = caseViewer.pluginManager.GetPlugInEnv("monitor").ActionNodeManager;
			var ElementMap = caseViewer.Source.ElementMap;
			data.script.lib["GetDataFromRec"] = ""
				+ "int GetDataFromRec(String l, String t) {"
				+ "\tcommand rec;\n"
				+ "\tString data = rec -m getLatestData -t $t -l $l;\n"
				+ "\treturn (int)data.replaceAll(\"\\n\", \"\");\n"
				+ "}\n";
			console.log(data);
			for(var label in ElementMap) {
				var nodeModel: AssureIt.NodeModel = ElementMap[label];

				if(isActionNode(nodeModel)) {
					actionNodeManager.SetActionNode(nodeModel);
					var actionNode = actionNodeManager.ActionNodeMap[nodeModel.Label];
					actionNodeManager.RECAPI.pushRawData(actionNode.Location, nodeModel.Label, 0, "test@gmail.com"/* imple me */, ""/* imple me */);
				}
			}

			try {
				this.AssureItAgentAPI.Deploy(data);
			}
			catch(e) {
				alert("Assure-It Agent is not active.");
				console.log(e);
			}
			serverApi.ExecDScript("dshell", self.editorPlugIn.DScriptViewer.getValue());
		}));
		ret.push(new AssureIt.SideMenuModel('#', 'Actions', "actions", "glyphicon-list-alt", (ev:Event)=>{
			self.editorPlugIn.ShowEditor(case0.ElementTop);
		}));
		return ret;
	}
}
