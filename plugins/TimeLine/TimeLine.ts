/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/ServerApi.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../Editor/Editor.ts" />

class TimeLine {
	timeline: JQuery;
	container: JQuery;
	root: JQuery;

	constructor(public caseViewer: AssureIt.CaseViewer, public nodeModel: AssureIt.NodeModel, public element: JQuery, public serverApi: AssureIt.ServerAPI) {
	}

	CreateDOM():void {
		this.root = $(this.caseViewer.Screen.ControlLayer);

		var node: JQuery = $("#"+this.nodeModel.Label);

		this.container = $("<div></div>").css({
			position: "absolute", left: node.position().left + (node.width() / 2), top: node.position().top + node.height() +  53
		}).addClass("timeline-container").appendTo(this.root);
		this.timeline = $("<div></div>")
			.addClass("timeline")
			.appendTo(this.container);
	}

	Enable(callback: () => void):void {
		this.CreateDOM();

		var commits: AssureIt.CommitCollection = this.serverApi.GetCommitList(this.nodeModel.Case.CaseId);
		var Case: AssureIt.Case = this.nodeModel.Case;
		var TopLabel = Case.ElementTop.Label;
		var decoder   = new AssureIt.CaseDecoder();
		this.timeline.append($('<ul id="timeline-ul"></ul>'))
		commits.forEach((i:number, v:AssureIt.CommitModel):void => {
			$("#timeline-ul").append($('<a id="timeline'+i+'" href="#"></a>').text(v.toString()));
			$("#timeline"+i).click((e: Event)=>{
				var loc = this.serverApi.basepath + "case/" + this.nodeModel.Case.CaseId;
				location.href = loc + '/history/' + (i);
			});
		});
	}

	Disable(callback: ()=>void) {
		$(".timeline-container").remove();
		callback();
	}
}

class TimeLinePlugIn extends AssureIt.PlugInSet {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.MenuBarContentsPlugIn = new TimeLineMenuPlugIn(plugInManager);
	}

}

class TimeLineMenuPlugIn extends AssureIt.MenuBarContentsPlugIn {
	visible: boolean = true;
	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel): boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel, element: JQuery, serverApi: AssureIt.ServerAPI): boolean {
		var loc = serverApi.basepath + "case/" + caseModel.Case.CaseId + "/history";
		element.append('<a href="'+ loc +'" ><img id="timeline" src="' + serverApi.basepath + 'images/icon.png" title="History" alt="history" /></a>');
		//$('#timeline').unbind('click');
		//$('#timeline').click((ev: Event) => {

		//	var timeline = new TimeLine(caseViewer, caseModel, element, serverApi);
		//	if(this.visible) {
		//		timeline.Enable(() => {this.visible = true; });
		//		this.visible = false;
		//	}else {
		//		timeline.Disable(() =>{
		//			this.visible = true;
		//		});
		//	}
		//	$('#background').click((ev: Event) => {
		//		timeline.Disable(() =>{
		//			this.visible = true;
		//		});
		//	});
		//});
		return true;
	}
}
