///<reference path="../../src/CaseModel.ts" />
///<reference path="../../src/CaseEncoder.ts" />
///<reference path="../../src/PlugInManager.ts" />

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
			//'<a href="#" ><img id="scale"  src="'+this.serverApi.basepath+'images/scale.png" title="Scale" alt="scale" /></a>' +
			'</div>');

		if(this.case0.IsEditable()) { //TODO login
		if(this.node.children("h4").text() != this.case0.ElementTop.Label) {
			this.menu.append('<a href="#" ><img id="remove" src="'+this.serverApi.basepath+'images/remove.png" title="Remove" alt="remove" /></a>');
		}
		var hasContext: boolean = false;
		this.menu.append('<a href="#" ><img id="search" src="'+this.serverApi.basepath+'images/scale.png" title="Search" alt="search" /></a>');
		}

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

	}

	AddNode(nodeType: AssureIt.NodeType): void {
		var thisNodeView: AssureIt.NodeView = this.caseViewer.ViewMap[this.node.children("h4").text()];
		var newNodeModel: AssureIt.NodeModel = new AssureIt.NodeModel(this.case0, thisNodeView.Source, nodeType, null, null);
		this.case0.SaveIdCounterMax(this.case0.ElementTop);
		this.caseViewer.ViewMap[newNodeModel.Label] = new AssureIt.NodeView(this.caseViewer, newNodeModel);
		this.caseViewer.ViewMap[newNodeModel.Label].ParentShape = this.caseViewer.ViewMap[newNodeModel.Parent.Label];

		var parentLabel: string = newNodeModel.Parent.Label;
		var parentOffSet = $("#"+parentLabel).offset();
		this.caseViewer.Draw();
//		this.caseViewer.Screen.SetOffset(0, 0);
		var CurrentParentView = this.caseViewer.ViewMap[parentLabel];
		this.caseViewer.Screen.SetOffset(parentOffSet.left-CurrentParentView.AbsX, parentOffSet.top-CurrentParentView.AbsY);
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

		this.caseViewer.Draw();
		var CurrentParentView = this.caseViewer.ViewMap[parentLabel];
		this.caseViewer.Screen.SetOffset(parentOffSet.left-CurrentParentView.AbsX, parentOffSet.top-CurrentParentView.AbsY);
	}

	Center(): void {
		var thisLabel: string = this.node.children("h4").text();
		var thisNodeView: AssureIt.NodeView = this.caseViewer.ViewMap[thisLabel];
		var screenManager = this.caseViewer.Screen;
		screenManager.SetCaseCenter(thisNodeView.AbsX, thisNodeView.AbsY, thisNodeView.HTMLDoc);
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
			$('#menu').remove();
		});
	}
}


class MenuBarPlugIn extends AssureIt.PlugInSet {

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
			if (caseViewer.Screen.GetScale() < 1) return; /* Menu bar is enable only if the scale is normal */
			var refresh = () => {
				var menutop = node.position().top / caseViewer.Screen.GetScale() + node.height() + 5;
				var menuleft = node.position().left / caseViewer.Screen.GetScale()+(node.outerWidth()-menuBar.menu.width())/ 2;
				menuBar.menu.css({ position: 'absolute', top: menutop , display: 'block', opacity: 0 });
				menuBar.menu.css(
					{ left: menuleft });
			};

			var label: string = node.children('h4').text();
			//console.log(label);
			var model: AssureIt.NodeModel = case0.ElementMap[label];
			var menuBar: MenuBar = new MenuBar(caseViewer, model, case0, node, serverApi, self);
			menuBar.menu.appendTo($('#layer2'));
			refresh();
			menuBar.menu.hover(function () {
				clearTimeout(self.timeoutId);
			}, function () {
				$(menuBar.menu).remove();
			});
			self.plugInManager.UseUILayer(self);
			menuBar.SetEventHandlers();

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
				onReady: refresh,
			});
			menuBar.menu.click(refresh);
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
