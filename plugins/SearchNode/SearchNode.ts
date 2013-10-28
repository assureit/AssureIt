/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseEncoder.ts" />
/// <reference path="../../src/ServerApi.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../Editor/Editor.ts" />

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
	currentNodeColor: {[index: string]: string}[] = [];
	HitNodes: AssureIt.NodeModel[] = [];
	HasStarted: boolean;
	FirstMove: boolean = false;
	Keyword: string;

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	RegisterKeyEvents(Case0: AssureIt.Case, caseViewer: AssureIt.CaseViewer, serverApi: AssureIt.ServerAPI): boolean {
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
					console.log("form length" +  $('nav').length);
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
									this.Color(this.HitNodes, this.currentNodeColor, caseViewer, true);
									$('body').unbind("keydown",this.Search.controllSearch);
									this.HitNodes = [];
									this.currentNodeColor = [];
									console.log('before firstmove search');
									this.Search(Case0, caseViewer, serverApi);
									if (this.HitNodes.length == 0) {
										this.HasStarted = false;
									}

									console.log($('.navbar-form input:first').val());
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

		console.log('here is code');

		console.log(TopNodeModel.SearchNode(this.Keyword, this.HitNodes));

		if (this.HitNodes.length == 0) {
			return;
		}

		this.Color(this.HitNodes, this.currentNodeColor, caseViewer, false);
		var NodeLabel     = this.HitNodes[nodeIndex].Label;
		var CaseMap       = caseViewer.ViewMap[NodeLabel];
		var NodePosX      = CaseMap.AbsX;
		var NodePosY      = CaseMap.AbsY;
		var currentHTML   = CaseMap.HTMLDoc;
		var screenManager = caseViewer.Screen;
		var destinationX  = screenManager.ConvertX(NodePosX, currentHTML);
		var destinationY  = screenManager.ConvertY(NodePosY, currentHTML);

		console.log('X='+ destinationX + 'Y=' + destinationY);
		console.log("start moving");
		this.Move(destinationX, destinationY, 100, ()=>{
			this.FirstMove = false;
		});
		CaseMap.SVGShape.SetColor("#ffff00", "#ff4500");

		var controllSearch = (e: JQueryEventObject)=> {
			if (e.ctrlKey) {
				if (e.keyCode == 81/*q*/) {
					console.log('quitting');
					$('body').unbind("keydown",controllSearch);
					this.Color(this.HitNodes, this.currentNodeColor, caseViewer, true);
					$('nav').remove();
					this.HitNodes = [];
					this.currentNodeColor = [];
					this.HasStarted = false;
				}
			}
			if (!e.shiftKey) {
				if (e.keyCode == 13/*Enter*/) {
					console.log("pushed enter button");
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

						console.log('X='+ destinationX + 'Y=' + destinationY);
						moveFlag = true;

						this.Move(destinationX, destinationY, 100, ()=>{
							moveFlag = false;

							if (nodeIndex == 0) {
								caseViewer.ViewMap[this.HitNodes[this.HitNodes.length-1].Label].SVGShape.SetColor("#ffff00", "#ffff00");
							} else {
								caseViewer.ViewMap[this.HitNodes[nodeIndex-1].Label].SVGShape.SetColor("#ffff00", "#ffff00");
							}

							if (!this.FirstMove) {
								console.log('here for one');
								CaseMap.SVGShape.SetColor("#ffff00", "#ff4500");
							}
						});
						console.log("after calling Move");
					}
				}
			} else {
				if (e.keyCode == 13/*Enter*/) {
					console.log("pushed enter button");
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

						console.log('X='+ destinationX + 'Y=' + destinationY);
						moveFlag = true;

						this.Move(destinationX, destinationY, 100, ()=>{
							moveFlag = false;

							if (nodeIndex == this.HitNodes.length - 1) {
								caseViewer.ViewMap[this.HitNodes[0].Label].SVGShape.SetColor("#ffff00", "#ffff00");
							} else {
								caseViewer.ViewMap[this.HitNodes[nodeIndex+1].Label].SVGShape.SetColor("#ffff00", "#ffff00");
							}

							if (!this.FirstMove) {
								console.log('here for one');
								CaseMap.SVGShape.SetColor("#ffff00", "#ff4500");
							}
						});
						console.log("after calling Move");
					}
				}
			}
		};
		$('body').keydown(controllSearch);
	}

	CreateSearchWindow(): void {
		$('<nav class="navbar pull-right" style="position: absolute"><form class="navbar-form" role="Search"><input type="text" class="form-control" placeholder="Search"/><input type="submit" value="search" class="btn"/></form></nav>').appendTo($('body'));


		$('nav').css({width: '260px', margin: 0, height: '24px', top: '0', right: '0' });

		$('.navbar-form').css({width: '230px', position: 'absolute'});

		$('.form-control').css({width: '156px', position: 'absolute'});

		$('.btn').css({position: 'absolute', left: '176px'});
	}

	Color (HitNodes: AssureIt.NodeModel[], currentNodeColor: {[index: string]: string}[], caseViewer: AssureIt.CaseViewer, enterFlag: boolean): void {
		if (enterFlag) {
			for (var i = 0; i < HitNodes.length; i++) {
				if ( i == 0) {
					console.log('iicolor is ..' + this.currentNodeColor[i]['fill'] + 'and  '+ this.currentNodeColor[i]['stroke']);
				}
				var thisNodeLabel: string = HitNodes[i].Label;
				caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(this.currentNodeColor[i]["fill"], this.currentNodeColor[i]["stroke"]);
			}
		} else {//Store original color and set new color
			for (var i = 0; i < HitNodes.length; i++) {
				var thisNodeLabel: string = this.HitNodes[i].Label;
				this.currentNodeColor[i] = caseViewer.ViewMap[thisNodeLabel].SVGShape.GetColor();
				caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor("#ffff00", "#ffff00");
				if ( i == 0) {
					console.log('color is ..' + this.currentNodeColor[i]['fill'] + 'and '+ this.currentNodeColor[i]['stroke']);
				}
			}
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
