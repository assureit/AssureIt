///<reference path="../../src/CaseModel.ts" />
///<reference path="../../src/CaseViewer.ts" />
///<reference path="../../src/PlugInManager.ts" />

class CopyPastePlugIn extends AssureIt.PlugInSet {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.MenuBarContentsPlugIn = new CopyPasteMenuBarPlugIn(plugInManager);
	}
}

class CopyPasteMenuBarPlugIn extends AssureIt.MenuBarContentsPlugIn {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}
}
