/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/PlugInManager.ts" />

class MenuBar {

	caseViewer: AssureIt.CaseViewer;
	case0: AssureIt.Case;
	node: JQuery;
	serverApi: AssureIt.ServerAPI;
	model: AssureIt.NodeModel;
	menu: JQuery;

	constructor(caseViewer: AssureIt.CaseViewer, model: AssureIt.NodeModel, case0: AssureIt.Case, node: JQuery, serverApi: AssureIt.ServerAPI, public plugIn: MenuBarActionPlugIn) {
		this.caseViewer = caseViewer;
		this.model = model;
		this.case0 = case0;
		this.node = node;
		this.serverApi = serverApi;
		this.Init();
	}

	Init(): void {

		var thisNodeType: AssureIt.NodeType = this.model.Type;

		$('#menu').remove();
		this.menu = $('<div id="menu">' +
			'<a href="#" ><img id="scale"  src="'+this.serverApi.basepath+'images/scale.png" title="Scale" alt="scale" /></a>' +
			'</div>');

		//if(this.case0.IsLogin()) { //TODO login
		this.menu.append('<a href="#" ><img id="commit" src="'+this.serverApi.basepath+'images/commit.png" title="Commit" alt="commit" /></a>');
		this.menu.append('<a href="#" ><img id="remove" src="'+this.serverApi.basepath+'images/remove.png" title="Remove" alt="remove" /></a>');
		var hasContext: boolean = false;

		for(var i: number = 0; i < this.model.Children.length; i++) {
			if(this.model.Children[i].Type == AssureIt.NodeType.Context) {
				hasContext = true;
			}
		}
		switch(thisNodeType) {
			case AssureIt.NodeType.Goal:
				if(!hasContext) {
					this.menu.append('<a href="#" ><img id="context"  src="'+this.serverApi.basepath+'images/context.png" title="Context" alt="context" /></a>');
				}
				this.menu.append('<a href="#" ><img id="strategy" src="'+this.serverApi.basepath+'images/strategy.png" title="Strategy" alt="strategy" /></a>');
				this.menu.append('<a href="#" ><img id="evidence" src="'+this.serverApi.basepath+'images/evidence.png" title="Evidence" alt="evidence" /></a>');
				break;
			case AssureIt.NodeType.Strategy:
				this.menu.append('<a href="#" ><img id="goal"     src="'+this.serverApi.basepath+'images/goal.png" title="Goal" alt="goal" /></a>');
				if (!hasContext) {
					this.menu.append('<a href="#" ><img id="context"  src="'+this.serverApi.basepath+'images/context.png" title="Context" alt="context" /></a>');
				}
				break;
			case AssureIt.NodeType.Evidence:
				if (!hasContext) {
					this.menu.append('<a href="#" ><img id="context"  src="'+this.serverApi.basepath+'images/context.png" title="Context" alt="context" /></a>');
				}
				break;
			default:
				break;
		}
		//}
	}

	AddNode(nodeType: AssureIt.NodeType): void {
		var thisNodeView: AssureIt.NodeView = this.caseViewer.ViewMap[this.node.children("h4").text()];
		var newNodeModel: AssureIt.NodeModel = new AssureIt.NodeModel(this.case0, thisNodeView.Source, nodeType, null, null);
		this.case0.SaveIdCounterMax(this.case0.ElementTop);
		this.caseViewer.ViewMap[newNodeModel.Label] = new AssureIt.NodeView(this.caseViewer, newNodeModel);
		this.caseViewer.ViewMap[newNodeModel.Label].ParentShape = this.caseViewer.ViewMap[newNodeModel.Parent.Label];
		this.caseViewer.Resize();
		this.caseViewer.ReDraw();
	}

	GetDescendantLabels(labels: string[], children: AssureIt.NodeModel[]): string[] {
		for(var i: number = 0; i < children.length; i++) {
			labels.push(children[i].Label);
			this.GetDescendantLabels(labels, children[i].Children);
		}
		return labels;
	}

	RemoveNode(): void {
		var thisLabel: string = this.node.children("h4").text();
		var thisNodeView: AssureIt.NodeView = this.caseViewer.ViewMap[thisLabel];
		var thisNodeModel: AssureIt.NodeModel = thisNodeView.Source;
		var brotherNodeModels: AssureIt.NodeModel[] = thisNodeModel.Parent.Children;
		var parentLabel: string = thisNodeModel.Parent.Label;
		var parentOffSet = $("#"+parentLabel).offset();

		for(var i: number = 0; i < brotherNodeModels.length; i++) {
			if(brotherNodeModels[i].Label == thisLabel) {
				brotherNodeModels.splice(i, 1);
			}
		}

		var labels: string[] = [thisLabel];
		labels = this.GetDescendantLabels(labels, thisNodeModel.Children);

		for(var i: number = 0; i < labels.length; i++) {
			delete this.case0.ElementMap[labels[i]];
			var nodeView: AssureIt.NodeView = this.caseViewer.ViewMap[labels[i]];
			nodeView.DeleteHTMLElementRecursive(null, null);
			delete this.caseViewer.ViewMap[labels[i]];
		}

		this.caseViewer.Resize();
		this.caseViewer.ReDraw();
		this.caseViewer.Screen.SetOffset(0, 0);
		var CurrentParentView = this.caseViewer.ViewMap[parentLabel];
		this.caseViewer.Screen.SetOffset(parentOffSet.left-CurrentParentView.AbsX, parentOffSet.top-CurrentParentView.AbsY);
	}

	Commit(): void {
		(<any>$('#modal')).dialog('open');
	}

	Scale(): void {
		var timers: number[] = [];
		var screenManager = this.caseViewer.Screen;
		var caseViewer = this.caseViewer;
		var editorIsActive: boolean = false;

		var startZoom = (start: number, target: number, duration: number) => {
			var delta = (target - start) / (30 * duration / 1000);
			var current = start;
			var zoom = ()=>{
				if(Math.abs(current - target) > Math.abs(delta)){
					current += delta;
					screenManager.SetScale(current);
					setTimeout(zoom, 1000/30);
				}else{
					screenManager.SetScale(target);
				}
			}
			zoom();
		}

		var svgwidth = $("#layer0")[0].getBoundingClientRect().width;
		var bodywidth = $("body").width();
		startZoom(1.0, bodywidth / svgwidth, 500);

		$(".node").unbind();

		var CancelClickEvent: (ev: JQueryEventObject) => void = function(ev: JQueryEventObject): void {
			var timer: number = timers.pop();

			while(timer) {
				clearTimeout(timer);
				timer = timers.pop();
			}

			if(ev.type == "dblclick") {
				editorIsActive = true;
			}
		}

		var EscapeFromEditor: (ev: JQueryEventObject) => void = function(ev: JQueryEventObject): void {
			if(ev.keyCode = 27 /* ESC */) {
				editorIsActive = false;
			}
		}

		var ScaleDown: () => void = function(): void {
			if(!editorIsActive) {
				timers.push(setTimeout(function() {
					startZoom(bodywidth/svgwidth, 1.0, 500);
					$("#background").unbind("click", ScaleDown);
					$("#background").unbind("dblclick", CancelClickEvent);
					$("#background").unbind("mousemove", CancelClickEvent);
					$("#fullscreen-editor-wrapper").unbind("keydown", EscapeFromEditor);
					caseViewer.ReDraw();
				}, 500));
			}
			else {
				editorIsActive = false;
			}
		}

		$("#background").click(ScaleDown);
		$("#background").dblclick(CancelClickEvent);
		$("#background").mousemove(CancelClickEvent);
		$("#fullscreen-editor-wrapper").keydown(EscapeFromEditor);
	}

	SetEventHandlers(): void {

		$('#goal').click(() => {
			this.AddNode(AssureIt.NodeType.Goal);
		});

		$('#context').click(() => {
			this.AddNode(AssureIt.NodeType.Context);
		});

		$('#strategy').click(() => {
			this.AddNode(AssureIt.NodeType.Strategy);
		});

		$('#evidence').click(() => {
			this.AddNode(AssureIt.NodeType.Evidence);
		});

		$('#remove').click(() => {
			this.RemoveNode();
		});

		$('#commit').click(() => {
			this.Commit();
		});

		$('#scale').click(() => {
			this.Scale();
		});
	}

}

class CommitWindow {

	defaultMessage: string = "Type your commit message...";

	constructor() {
		this.Init();
	}

	Init(): void {
		$('#modal').remove();
		var modal = $('<div id="modal" title="Commit Message" />');
		(<any>modal).dialog({
			autoOpen: false,
			modal: true,
			resizable: false,
			draggable: false,
			show: "clip",
			hide: "fade"
		});

		var messageBox = $('<p align="center"><input id="message_box" type="text" size="30" value="' + this.defaultMessage + '" /></p>');
		messageBox.css('color', 'gray');

		var commitButton  = $('<p align="right"><input id="commit_button" type="button" value="commit"/></p>');
		modal.append(messageBox);
		modal.append(commitButton);
		modal.appendTo($('layer2'));
	}

	SetEventHandlers(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): void {
		var self = this;

		$('#message_box').focus(function() {
			if($(this).val() == self.defaultMessage) {
				$(this).val("");
				$(this).css('color', 'black');
			}
		});

		$('#message_box').blur(function() {
			if($(this).val() == "") {
				$(this).val(self.defaultMessage);
				$(this).css('color', 'gray');
			}
		});

		$('#commit_button').click(function() {
			var encoder   = new AssureIt.CaseEncoderDeprecated();
			var converter = new AssureIt.Converter();
			var contents = converter.GenOldJson(encoder.ConvertToOldJson(case0));
			serverApi.Commit(contents, $(this).val, case0.CommitId);
			window.location.reload(); //FIXME
		});
	}

}

class MenuBarPlugIn extends AssureIt.PlugIn {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.ActionPlugIn = new MenuBarActionPlugIn(plugInManager);
	}

}

class MenuBarActionPlugIn extends AssureIt.ActionPlugIn {
	timeoutId: number;

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case): boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): boolean {
		var self = this;

		$('.node').unbind('mouseenter').unbind('mouseleave'); // FIXME: this line may cause other plugin's event handler.
		$('.node').hover(function () {
			var node = $(this);

			var label: string = node.children('h4').text();
			//console.log(label);
			var model: AssureIt.NodeModel = case0.ElementMap[label];
			var menuBar: MenuBar = new MenuBar(caseViewer, model, case0, node, serverApi, self);
			menuBar.menu.appendTo($('#layer2'));
			menuBar.menu.css({ position: 'absolute', top: node.position().top + node.height() + 5 , display: 'block', opacity: 0 });
			menuBar.menu.hover(function () {
				clearTimeout(self.timeoutId);
			}, function () {
				$(menuBar.menu).remove();
			});
			self.plugInManager.UseUILayer(self);
			menuBar.SetEventHandlers();

			var commitWindow: CommitWindow = new CommitWindow();
			commitWindow.SetEventHandlers(caseViewer, case0, serverApi);
			self.plugInManager.InvokePlugInMenuBarContents(caseViewer, model, menuBar.menu, serverApi);

			(<any>menuBar.menu).jqDock({
				align: 'bottom',
				fadeIn: 200,
				idle: 1500,
				size: 45,
				distance: 60,
				labels: 'tc',
				duration: 500,
				fadeIn: 1000,
				source: function () { return this.src.replace(/(jpg|gif)$/, 'png'); },
				onReady: function () {
					menuBar.menu.css({ left: node.position().left+(node.outerWidth()-menuBar.menu.width()) / 2 });
				},
			});
		}, function () { /* FIXME: don't use setTimeout() */
			self.timeoutId = setTimeout(function() {
				$('#menu').remove();
			}, 10);
		});
		return true;
	}

	DeleteFromDOM(): void {
		$('#menu').remove();
	}
}
