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

class SearchWordKeyPlugIn extends AssureIt.ShortcutKeyPlugIn {

	caseViewer: AssureIt.CaseViewer;
	HitNodes: AssureIt.NodeModel[] = [];
	HasStarted: boolean;
	FirstMove: boolean = false;
	Keyword: string;
	controllSearch: (e: any)=> void;

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	RegisterKeyEvents(caseViewer: AssureIt.CaseViewer, Case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): boolean {
		this.caseViewer = caseViewer;
		this.HasStarted = false;
		$("body").keydown((e)=>{
			if (e.ctrlKey) {
				if (e.keyCode == 81/*q*/) {
					e.preventDefault();
					$('nav').remove();
				}

				if (e.keyCode == 70/*f*/) {
					e.preventDefault();
					if ($('nav').length == 0) {
						this.CreateSearchWindow();

						//$('nav').show(3000);
						$('.navbar-form input:first').focus();
						$('.btn').click((ev: JQueryEventObject)=> {
							ev.preventDefault();
							if (!this.HasStarted) {
								this.Search(Case0, caseViewer,serverApi);
								this.HasStarted = true;
							} else {
								if ($('.navbar-form input:first').val() != this.Keyword) {
									this.FirstMove = true;
									this.Color(this.HitNodes, caseViewer, "Default");
									this.HitNodes = [];
									this.Search(Case0, caseViewer, serverApi);
									$('body').unbind("keydown",this.controllSearch);
									this.controllSearch = null;
									if (this.HitNodes.length == 0) {
										this.HasStarted = false;
									}

								}
							}
						});
					}
				}
			}
		});
		return true;
	}

	Search(Case0: AssureIt.Case, caseViewer: AssureIt.CaseViewer ,serverApi: AssureIt.ServerAPI): void {
		this.Keyword = $('.navbar-form input:first').val();
		var nodeIndex: number = 0;
		var moveFlag: boolean = false;
		var TopNodeModel: AssureIt.NodeModel = Case0.ElementTop;

		if (this.Keyword == "") {
			return;
		}

		TopNodeModel.SearchNode(this.Keyword, this.HitNodes);

		if (this.HitNodes.length == 0) {
			return;
		}

		this.Color(this.HitNodes, caseViewer, "Search");
		var NodeLabel     = this.HitNodes[nodeIndex].Label;
		var CaseMap       = caseViewer.ViewMap[NodeLabel];
		var NodePosX      = CaseMap.AbsX;
		var NodePosY      = CaseMap.AbsY;
		var currentHTML   = CaseMap.HTMLDoc;
		var screenManager = caseViewer.Screen;
		var destinationX  = screenManager.ConvertX(NodePosX, currentHTML);
		var destinationY  = screenManager.ConvertY(NodePosY, currentHTML);

		this.Move(destinationX, destinationY, 100, ()=>{
			this.FirstMove = false;
		});
		CaseMap.SVGShape.EnableHighlight();

		this.controllSearch = (e)=> {
			if (e.ctrlKey) {
				if (e.keyCode == 81/*q*/) {
					$('body').unbind("keydown",this.controllSearch);
					this.Color(this.HitNodes, caseViewer, "Default");
					$('nav').remove();
					this.HitNodes = [];
					this.HasStarted = false;
				}
			}
			if (!e.shiftKey) {
				if (e.keyCode == 13/*Enter*/) {
					if (!moveFlag) {
						if (this.HitNodes.length == 1) {
							return;
						}
						nodeIndex++;
						if (nodeIndex == this.HitNodes.length) {
							nodeIndex = 0;
						}

						NodeLabel    = this.HitNodes[nodeIndex].Label;
						CaseMap      = caseViewer.ViewMap[NodeLabel];
						NodePosX     = CaseMap.AbsX;
						NodePosY     = CaseMap.AbsY;
						currentHTML  = CaseMap.HTMLDoc;
						destinationX = screenManager.ConvertX(NodePosX, currentHTML);
						destinationY = screenManager.ConvertY(NodePosY, currentHTML);

						moveFlag = true;

						this.Move(destinationX, destinationY, 100, ()=>{
							moveFlag = false;
							if (nodeIndex == 0) {
								caseViewer.ViewMap[this.HitNodes[this.HitNodes.length-1].Label].SVGShape.SetColor(AssureIt.Color.Searched);
								caseViewer.ViewMap[this.HitNodes[this.HitNodes.length-1].Label].SVGShape.DisableHighlight();
							} else {
								caseViewer.ViewMap[this.HitNodes[nodeIndex-1].Label].SVGShape.SetColor(AssureIt.Color.Searched);
								caseViewer.ViewMap[this.HitNodes[nodeIndex-1].Label].SVGShape.DisableHighlight();
							}

							if (!this.FirstMove) {
								CaseMap.SVGShape.EnableHighlight();
							}
						});
					}
				}
			} else {
				if (e.keyCode == 13/*Enter*/) {
					if (!moveFlag) {
						if (this.HitNodes.length == 1) {
							return;
						}

						nodeIndex--;
						if (nodeIndex == -1) {
							nodeIndex = this.HitNodes.length - 1 ;
						}

						NodeLabel    = this.HitNodes[nodeIndex].Label;
						CaseMap      = caseViewer.ViewMap[NodeLabel];
						NodePosX     = CaseMap.AbsX;
						NodePosY     = CaseMap.AbsY;
						currentHTML  = CaseMap.HTMLDoc;
						destinationX = screenManager.ConvertX(NodePosX, currentHTML);
						destinationY = screenManager.ConvertY(NodePosY, currentHTML);

						moveFlag = true;

						this.Move(destinationX, destinationY, 100, ()=>{
							moveFlag = false;

							if (nodeIndex == this.HitNodes.length - 1) {
								caseViewer.ViewMap[this.HitNodes[0].Label].SVGShape.SetColor(AssureIt.Color.Searched);
								caseViewer.ViewMap[this.HitNodes[0].Label].SVGShape.DisableHighlight();
							} else {
								caseViewer.ViewMap[this.HitNodes[nodeIndex+1].Label].SVGShape.SetColor(AssureIt.Color.Searched);
								caseViewer.ViewMap[this.HitNodes[nodeIndex+1].Label].SVGShape.DisableHighlight();
							}
							if (!this.FirstMove) {
								CaseMap.SVGShape.EnableHighlight();
							}
						});
					}
				}
			}
		};
		$('body').keydown(this.controllSearch);
	}

	CreateSearchWindow(): void {
		$('<nav class="navbar pull-right" style="position: absolute"><form class="navbar-form" role="Search"><input type="text" class="form-control" placeholder="Search"/><input type="submit" value="search" class="btn"/></form></nav>').appendTo($('body'));


		$('nav').css({width: '260px', margin: 0, height: '24px', top: '0', right: '0' });

		$('.navbar-form').css({width: '230px', position: 'absolute'});

		$('.form-control').css({width: '156px', position: 'absolute'});

		$('.btn').css({position: 'absolute', left: '176px'});
	}

	Color (HitNodes: AssureIt.NodeModel[], caseViewer: AssureIt.CaseViewer, funcname: string): void {
		switch (funcname) {
			case "Default":
				for (var i = 0; i < HitNodes.length; i++) {
					var thisNodeLabel: string = HitNodes[i].Label;
					caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(AssureIt.Color.Default);
				}
				break;

			case "Search":
				for (var i = 0; i < HitNodes.length; i++) {
					var thisNodeLabel: string = this.HitNodes[i].Label;
					caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(AssureIt.Color.Searched);
				}
				break;
		}
	}


	Move (logicalOffsetX: number, logicalOffsetY: number, duration: number, callback: ()=> void): void {
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
				screenManager.SetLogicalOffset(logicalOffsetX, logicalOffsetY, 1);
				callback();
			}
		}
		move();
	}
}
