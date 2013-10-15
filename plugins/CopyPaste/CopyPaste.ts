///<reference path="../../src/CaseModel.ts" />
///<reference path="../../src/CaseViewer.ts" />
///<reference path="../../src/PlugInManager.ts" />

class CopyPastePlugIn extends AssureIt.PlugInSet {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.MenuBarContentsPlugIn = new CopyPasteMenuPlugIn(plugInManager);
	}
}

class CopyPasteMenuPlugIn extends AssureIt.MenuBarContentsPlugIn {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel): boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel, element: JQuery, serverApi: AssureIt.ServerAPI): boolean {
		return true;
	}
}
