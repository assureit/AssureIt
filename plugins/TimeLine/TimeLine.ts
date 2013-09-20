/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/ServerApi.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../../src/SideMenuModel.ts" />

class TimeLinePlugIn extends AssureIt.PlugInSet {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.SideMenuPlugIn = new TimeLineSideMenuPlugIn(plugInManager);
		this.ShortcutKeyPlugIn = new TimeLineKeyPlugIn(plugInManager);
	}

}

class TimeLineSideMenuPlugIn extends AssureIt.SideMenuPlugIn {
	visible: boolean = true;
	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, Case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): boolean {
		return true;
	}

	AddMenu(caseViewer: AssureIt.CaseViewer, Case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): AssureIt.SideMenuModel {
		var loc = serverApi.basepath + "case/" + Case0.CaseId + "/history";
		return new AssureIt.SideMenuModel(loc, "Change History", "history", "glyphicon-time", (ev:Event)=>{});
	}
}

class TimeLineKeyPlugIn extends AssureIt.ShortcutKeyPlugIn {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	IsEnabled(Case0: AssureIt.Case, serverApi: AssureIt.ServerAPI) : boolean {
		return true;
	}

	RegisterKeyEvents(Case0: AssureIt.Case, serverApi: AssureIt.ServerAPI) : boolean {
		$("body").keydown((e)=>{
			if(e.keyCode == 37/*left*/ && e.shiftKey) {
				this.ShowPreview(Case0, serverApi);
			}
			if(e.keyCode == 39/*right*/ && e.shiftKey) {
				this.ShowNext(Case0, serverApi);
			}
		});
		return true;
	}

	GetHistoryId(): number {
		var url: string = location.href;
		var matches: string[] = url.match(/history\/([0-9]*)/);
		if(matches != null) {
			return Number(matches[1]);
		}
		return -1;
	}

	ShowPreview(Case: AssureIt.Case, serverApi: AssureIt.ServerAPI): void {
		var historyId = this.GetHistoryId();
		if(historyId == -1/* Latest and Edit mode*/) {
			var commits: AssureIt.CommitCollection = serverApi.GetCommitList(Case.CaseId);
			historyId = commits.Size() -1;
		}
		if(historyId > 0/* not oldest*/) {
			historyId--;
			var loc = serverApi.basepath + "case/" + Case.CaseId;
			location.href = loc + '/history/' + (historyId);
		}
	}

	ShowNext(Case: AssureIt.Case, serverApi: AssureIt.ServerAPI): void {
		var historyId = this.GetHistoryId();
		if(historyId == -1/* Latest and Edit mode*/) {
			return
		}
		var commits: AssureIt.CommitCollection = serverApi.GetCommitList(Case.CaseId);
		var max = commits.Size() - 2;
		if(historyId >= 0 && historyId < max/* FIXME Latest*/) {
			historyId++;
			var loc = serverApi.basepath + "case/" + Case.CaseId;
			location.href = loc + '/history/' + (historyId);
		} else if(historyId == max) {
			location.href= serverApi.basepath + "case/" + Case.CaseId;
		}
	}

	DeleteFromDOM(): void { //TODO
	}

	DisableEvent(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI)  : void {
	}

}
