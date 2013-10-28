/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/ServerApi.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../../src/SideMenuModel.ts" />

class ReloadPlugIn extends AssureIt.PlugInSet {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.ShortcutKeyPlugIn = new ReloadKeyPlugIn(plugInManager);
	}

}

class ReloadKeyPlugIn extends AssureIt.ShortcutKeyPlugIn {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	IsEnabled(Case0: AssureIt.Case, serverApi: AssureIt.ServerAPI) : boolean {
		return true;
	}

	RegisterKeyEvents(Case0: AssureIt.Case, caseViewer: AssureIt.CaseViewer, serverApi: AssureIt.ServerAPI) : boolean {
		$("body").keydown((e)=>{
			if(e.keyCode == 82/*r*/ && e.shiftKey) {
				caseViewer.DeleteHTMLElementAll();
				caseViewer.Draw();
			}
		});
		return true;
	}

	DeleteFromDOM(): void { //TODO
	}

	DisableEvent(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI)  : void {
	}

}
