/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseEncoder.ts" />
/// <reference path="../../src/ServerApi.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../Editor/Editor.ts" />

class SearchNodePlugIn extends AssureIt.PlugInSet {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.ShortcutKeyPlugIn = new SearchWordKeyPlugIn(plugInManager);
	}
}

class SearchWordKeyPlugIn extends AssureIt.ShortcutKeyPlugIn{

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	RegisterKeyEvents(caseViewer: AssureIt.CaseViewer, Case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): boolean {
		var Target : Search = new Search();
		Target.CreateSearchWindow();

		$("body").keydown((e)=>{
			if (e.ctrlKey) {
				if (e.keyCode == 70/*f*/) {
					e.preventDefault();
					$('nav').toggle();
					if ($('nav').css('display') == 'block') {
						$('.form-control').focus();
					} else {
						Target.SetAllNodesColor(Target.HitNodes, caseViewer, "Default");
						Target.ResetParam();
					}
				}
			}
		});

		$('.btn').click((ev: JQueryEventObject)=>{
			ev.preventDefault();
			if (!Target.MoveFlag && $('.form-control').val() != "") {
				Target.Search(Target.CheckInput(caseViewer), ev.shiftKey, caseViewer, Case0);
			} else {
				Target.SetAllNodesColor(Target.HitNodes, caseViewer, "Default");
				Target.ResetParam();
			}
		});
		return true;
	}
}

class Search {

	SearchWord  : string;
	DestinationX: number;
	DestinationY: number;
	NodeIndex   : number;
	MoveFlag    : boolean;
	HitNodes    : AssureIt.NodeModel[];

	constructor() {
		this.SearchWord   = "";
		this.DestinationX = 0;
		this.DestinationY = 0;
		this.NodeIndex    = 0;
		this.MoveFlag     = false;
		this.HitNodes     = [];
	}

	Search (IsFirst: boolean, ShiftKey: boolean, CaseViewer: AssureIt.CaseViewer, Case0: AssureIt.Case) : void {
		if (IsFirst) {
			var TopNodeModel: AssureIt.NodeModel = Case0.ElementTop;
			this.SearchWord = $('.form-control').val();

			if (this.SearchWord == "") {
				return;
			}

			TopNodeModel.SearchNode(this.SearchWord, this.HitNodes);

			console.log(this.HitNodes);
			if (this.HitNodes.length == 0) {
				return;
			}

			this.MoveFlag = true;
			this.SetAllNodesColor(this.HitNodes, CaseViewer, "Search");
			this.SetDestination(this.HitNodes[0], CaseViewer);
			CaseViewer.ViewMap[this.HitNodes[0].Label].SVGShape.EnableHighlight();
			this.MoveToNext(CaseViewer,()=> {
				this.MoveFlag = false;
			});
		} else {
			if (this.HitNodes.length == 1 ) {
				return;
			}
			if (!ShiftKey) {
				this.NodeIndex++;
				if (this.NodeIndex == this.HitNodes.length) {
					this.NodeIndex = 0;
				}
			} else {
				this.NodeIndex--;
				if (this.NodeIndex == -1) {
					this.NodeIndex = this.HitNodes.length - 1;
				}
			}


			this.MoveFlag = true;
			this.SetDestination(this.HitNodes[this.NodeIndex], CaseViewer);
			this.MoveToNext(CaseViewer, ()=> {
				CaseViewer.ViewMap[this.HitNodes[this.NodeIndex].Label].SVGShape.EnableHighlight();
				if (!ShiftKey) {
					if (this.NodeIndex == 0) {
						CaseViewer.ViewMap[this.HitNodes[this.HitNodes.length-1].Label].SVGShape.DisableHighlight();
					} else {
						CaseViewer.ViewMap[this.HitNodes[this.NodeIndex-1].Label].SVGShape.DisableHighlight();
					}
				} else {
					if (this.NodeIndex == this.HitNodes.length - 1) {
						CaseViewer.ViewMap[this.HitNodes[0].Label].SVGShape.DisableHighlight();
					} else {
						CaseViewer.ViewMap[this.HitNodes[this.NodeIndex+1].Label].SVGShape.DisableHighlight();
					}
				}
				this.MoveFlag = false;
			});
		}
	}

	ResetParam() : void {
		this.HitNodes   = [];
		this.NodeIndex  = 0;
		this.SearchWord = "";
	}

	CheckInput (CaseViewer: AssureIt.CaseViewer) : boolean {
		if ($('.form-control').val() == this.SearchWord && this.HitNodes.length > 1){
			return false;
		} else {
			this.SetAllNodesColor(this.HitNodes, CaseViewer, "Default");
			this.HitNodes = [];
			return true;
		}
	}

	SetAllNodesColor (HitNodes: AssureIt.NodeModel[], CaseViewer: AssureIt.CaseViewer, colortheme: string): void {
		switch (colortheme) {
		case "Default":
			for (var i = 0; i < HitNodes.length; i++) {
				var thisNodeLabel: string = HitNodes[i].Label;
				CaseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(AssureIt.Color.Default);
				CaseViewer.ViewMap[thisNodeLabel].SVGShape.DisableHighlight();
			}
			break;
		case "Search":
			for (var i = 0; i < HitNodes.length; i++) {
				var thisNodeLabel: string = this.HitNodes[i].Label;
				CaseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(AssureIt.Color.Searched);
			}
			break;
		}
	}

	SetDestination (HitNode: AssureIt.NodeModel, CaseViewer: AssureIt.CaseViewer) : void{
		if (HitNode == undefined) {
			return;
		}
		var CaseMap: AssureIt.NodeView = CaseViewer.ViewMap[HitNode.Label];
		var currentHTML: AssureIt.HTMLDoc = CaseMap.HTMLDoc;
		var screenManager: AssureIt.ScreenManager = CaseViewer.Screen;
		var NodePosX: number = CaseMap.AbsX;
		var NodePosY: number = CaseMap.AbsY;
		this.DestinationX = screenManager.ConvertX(NodePosX, currentHTML);
		this.DestinationY = screenManager.ConvertY(NodePosY, currentHTML);
		return;
	}

	MoveToNext (CaseViewer: AssureIt.CaseViewer, callback: ()=> void) : void {
		this.Move(this.DestinationX, this.DestinationY, 100, CaseViewer);
		callback();
	}

	Move (logicalOffsetX: number, logicalOffsetY: number, duration: number, CaseViewer: AssureIt.CaseViewer) : void {
		var cycle = 1000/30;
		var cycles = duration/cycle;
		var screenManager = CaseViewer.Screen;
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
				screenManager.SetLogicalOffset(logicalOffsetX, logicalOffsetY, 1);
				return;
			}
		}
		move();
	}

	CreateSearchWindow(): void {
		$('<nav class="navbar pull-right" style="position: absolute"><form class="navbar-form" role="Search"><input type="text" class="form-control" placeholder="Search"/><input type="submit" value="search" class="btn"/></form></nav>').appendTo($('body'));


		$('nav').css({display: 'none', width: '260px', margin: 0, height: '24px', top: '0', right: '0' });

		$('.navbar-form').css({width: '230px', position: 'absolute'});

		$('.form-control').css({width: '156px', position: 'absolute'});

		$('.btn').css({position: 'absolute', left: '176px'});
	}
}
