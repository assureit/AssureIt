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
	}

}

//class SearchNodeActionPlugIn extends AssureIt.ActionPlugIn {
//
//	constructor(plugInManager: AssureIt.PlugInManager) {
//		super(plugInManager);
//	}
//
//	IsEnabled (caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case) : boolean {
//		return true;
//	}
//
//	Delegate(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI)  : boolean {
//		var self = this;
//
//		return true;
//	}
//
//	DeleteFromDOM(): void {
//	}
//}
