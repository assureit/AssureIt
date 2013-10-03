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

	RegisterKeyEvents(Case0: AssureIt.Case, caseViewer: AssureIt.CaseViewer, serverApi: AssureIt.ServerAPI): boolean {
		this.caseViewer = caseViewer;
		$("body").keydown((e)=>{
			if (e.ctrlKey) {
				if (e.keyCode == 70/*f*/) {
					console.log("here");
					$("#searchform").remove();
					this.CreateSearchWindow();
					$('#searchform').show(2000);
					$('#searchbutton').click((e: JQueryEventObject)=> {
						e.preventDefault();
						this.Search(Case0, caseViewer,serverApi);
					});
				}
			}
		});
		return true;
	}

	Search(Case0: AssureIt.Case, caseViewer: AssureIt.CaseViewer ,serverApi: AssureIt.ServerAPI): void {
		var Keyword: string = $('#searchform input:first').val();

		if (Keyword == "") {
			return;
		}

		var TopNodeModel: AssureIt.NodeModel = Case0.ElementTop;
		var HitNodes: AssureIt.NodeModel[] = [];

		console.log(TopNodeModel.SearchNode(Keyword, HitNodes));

		var currentNodeColor: {[index: string]: string}[] = [];

		for (var i = 0; i < HitNodes.length; i++) {
			var thisNodeLabel: string = HitNodes[i].Label;
			currentNodeColor[i] = caseViewer.ViewMap[thisNodeLabel].SVGShape.GetColor();
			caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor("#ffff00", "#ffff00");
		}

		var nodeIndex: number = 0;
		var moveFlag: boolean = false;

		var screenManager = caseViewer.Screen;
		var NodePosX      = caseViewer.ViewMap[HitNodes[nodeIndex].Label].AbsX;
		var NodePosY      = caseViewer.ViewMap[HitNodes[nodeIndex].Label].AbsY;
		var currentHTML   = caseViewer.ViewMap[HitNodes[nodeIndex].Label].HTMLDoc;

		var destinationX = screenManager.ConvertX(NodePosX, currentHTML);
		var destinationY = screenManager.ConvertY(NodePosY, currentHTML);

		this.Move(destinationX, destinationY, 500, ()=>{});

		var controllSearch = (e: JQueryEventObject)=> {
			if (e.keyCode == 81/*q*/) {
				$('body').unbind("keydown",controllSearch);
				$('#searchform').hide(2000);
				$('#searchform').remove();
				for (var i = 0; i < HitNodes.length; i++) {
					var thisNodeLabel: string = HitNodes[i].Label;
					caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(currentNodeColor[i]["fill"], currentNodeColor[i]["stroke"]);
				}
			}

			if (e.keyCode == 13/*Enter*/) {
				if (!moveFlag) {
					if (HitNodes.length == 1) {
						return;
					}

					nodeIndex++;
					if (nodeIndex == HitNodes.length) {
						nodeIndex = 0;
					}

					NodePosX     = caseViewer.ViewMap[HitNodes[nodeIndex].Label].AbsX;
					NodePosY     = caseViewer.ViewMap[HitNodes[nodeIndex].Label].AbsY;
					currentHTML  = caseViewer.ViewMap[HitNodes[nodeIndex].Label].HTMLDoc;
					destinationX = screenManager.ConvertX(NodePosX, currentHTML);
					destinationY = screenManager.ConvertY(NodePosY, currentHTML);
					moveFlag = true;
					this.Move(destinationX, destinationY, 500, ()=>{
						moveFlag = false;
					});
					console.log("after calling Move");
				}
			}
		};
		$('body').keydown(controllSearch);
	}

	CreateSearchWindow(): void {
		$('<form name="searchform" id="searchform" action="#"><input type="text" name="keyword" id="keyword"/><input type="submit" value="search" name="searchbutton" id="searchbutton"/></form>').appendTo($('body'));

		$('#searchform').css({width: '200px', background: '"url(./img/input.gif)" "left" "top" "no-repeat"', display: 'block', height: '24px', position: 'float', top: 0, left: 0});

		$('#keyword').css({width: '156px', position: 'absolute', top: '3px', left: '12px', border: "'1px' 'solid' '#FFF'"});

		$('#searchbutton').css({position: 'absolute', top: '3px', left: '174px'});

	}


	Move (logicalOffsetX: number, logicalOffsetY: number, duration: number, callback: ()=> void) {
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
			console.log("move function");
			if(count < cycles) {
				count += 1;
				currentX += deltaX;
				currentY += deltaY;
				screenManager.SetLogicalOffset(currentX, currentY, 1);
				setTimeout(move, cycle);
			} else {
				screenManager.SetLogicalOffset(logicalOffsetX, logicalOffsetY, 1);
				callback();
			}
		}
		move();
	}
}
