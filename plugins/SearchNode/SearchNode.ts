///<reference path="../../src/CaseModel.ts" />
///<reference path="../../src/CaseEncoder.ts" />
///<reference path="../../src/ServerApi.ts" />
///<reference path="../../src/PlugInManager.ts" />
///<reference path="../Editor/Editor.ts" />

class SearchNodePlugIn extends AssureIt.PlugInSet {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		//var plugin: SearchNodeActionPlugIn = new SearchNodeActionPlugIn(plugInManager);
		//this.ActionPlugIn = plugin;
		this.MenuBarContentsPlugIn = new SearchNodeMenuPlugIn(plugInManager);
		this.ShortcutKeyPlugIn = new SearchWordKeyPlugIn(plugInManager);
	}
}

class SearchNodeMenuPlugIn extends AssureIt.MenuBarContentsPlugIn {
	element: JQuery;
	caseViewer: AssureIt.CaseViewer;
	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.element = null;
		this.caseViewer = null;
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel): boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel, element: JQuery, serverApi: AssureIt.ServerAPI): boolean {
		this.caseViewer = caseViewer;
		this.element = element;
		element.append('<a href="#" ><img id="center" src="' + serverApi.basepath + 'images/scale.png" title="Search" alt="Search" /></a>');
		$('#center').unbind('click');
		$('#center').click(() => { this.Center(); });

		//element.append('<a href="#" ><img id="SearchNode-xml" src="' + serverApi.basepath + 'images/icon.png" title="SearchNode XML" alt="XML" /></a>');
		//$('#SearchNode-xml').unbind('click');
		//$('#SearchNode-xml').click(this.editorPlugIn.SearchNodeXml);
		return true;
	}

	Center() : void {
		var thisLabel: string = this.element.children('h4').text();
		var thisNodeView: AssureIt.NodeView = this.caseViewer.ViewMap[thisLabel];
		return;
	}
}

class SearchWordKeyPlugIn extends AssureIt.ShortcutKeyPlugIn {

	caseViewer: AssureIt.CaseViewer;

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	RegisterKeyEvents(Case0: AssureIt.Case, caseViewer: AssureIt.CaseViewer, serverApi: AssureIt.ServerAPI) : boolean {
		this.caseViewer = caseViewer;
		$("body").keydown((e)=>{
			if (e.keyCode == 70) {
				console.log("here");
				this.Search(Case0, caseViewer,serverApi);
			}
		});
		return true;
	}

	Search(Case0: AssureIt.Case, caseViewer: AssureIt.CaseViewer ,serverApi: AssureIt.ServerAPI): void {
		var Keyword: string = prompt("Enter some words you want to search");
		var TopNodeModel: AssureIt.NodeModel = Case0.ElementTop;

		var HitNodes: AssureIt.NodeModel[] = [];

		console.log(TopNodeModel.SearchNode(Keyword, HitNodes));

		var currentNodeColor: {[index: string]: string}[] = [];

		for (var i = 0; i < HitNodes.length; i++) {
			var thisNodeLabel: string = HitNodes[i].Label;
			currentNodeColor[i] = caseViewer.ViewMap[thisNodeLabel].SVGShape.GetColor();
			console.log("before");
			caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor("#ffff00", "#ffff00");
		}

		console.log("after");
		var nodeIndex: number = 0;

		var screenManager = caseViewer.Screen;

		var NodePosX    = caseViewer.ViewMap[HitNodes[nodeIndex].Label].AbsX;
		var NodePosY    = caseViewer.ViewMap[HitNodes[nodeIndex].Label].AbsY;
		var currentHTML = caseViewer.ViewMap[HitNodes[nodeIndex].Label].HTMLDoc;

		var destinationX = screenManager.ConvertX(NodePosX, currentHTML);
		var destinationY = screenManager.ConvertY(NodePosY, currentHTML);

		this.Move(destinationX, destinationY, 500);

		$("body").keydown((e: JQueryEventObject)=> {
			console.log(e.keyCode);
			if (e.keyCode == 81/*q*/) {
				for (var i = 0; i < HitNodes.length; i++) {
					var thisNodeLabel: string = HitNodes[i].Label;
					caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(currentNodeColor[i]["fill"], currentNodeColor[i]["stroke"]);
				}
			} else if (e.keyCode == 13/*Enter*/) {
				if (HitNodes.length == 1) {
					return;
				}

				nodeIndex++;
				if (nodeIndex == HitNodes.length) {
					nodeIndex = 0;
				}

				NodePosX    = caseViewer.ViewMap[HitNodes[nodeIndex].Label].AbsX;
				NodePosY    = caseViewer.ViewMap[HitNodes[nodeIndex].Label].AbsY;
				currentHTML = caseViewer.ViewMap[HitNodes[nodeIndex].Label].HTMLDoc;
				var destinationX = screenManager.ConvertX(NodePosX, currentHTML);
				var destinationY = screenManager.ConvertY(NodePosY, currentHTML);

				this.Move(destinationX, destinationY, 500);
			}
		});
	}

	Move(logicalOffsetX: number, logicalOffsetY: number, duration: number) {
		var cycle = 1000/30;
		var cycles = duration/cycle;
		var screenManager = this.caseViewer.Screen;
		var initialX = screenManager.GetOffsetX();
		var initialY = screenManager.GetOffsetY();

		var deltaX = (logicalOffsetX - initialX) / cycles;
		var deltaY = (logicalOffsetY - initialY) / cycles;

		var currentX = initialX;
		var currentY = initialY;
		var count = 0;

		var move = ()=> {
			if(count < cycles) {
				count += 1;
				currentX += deltaX;
				currentY += deltaY;
				screenManager.SetLogicalOffset(currentX, currentY, 1);
				setTimeout(move, cycle);
			} else {
				screenManager.SetScale(1);
				screenManager.SetLogicalOffset(logicalOffsetX, logicalOffsetY, 1);
			}
		}
		move();
	}
}


