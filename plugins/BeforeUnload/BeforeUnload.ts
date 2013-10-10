///<reference path='../../d.ts/jquery.d.ts'/>
///<reference path='../../src/CaseModel.ts'/>
///<reference path='../../src/CaseViewer.ts'/>

class BeforeUnloadPlugIn extends AssureIt.PlugInSet {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.ActionPlugIn = new BeforeUnloadActionPlugIn(plugInManager);
		this.HTMLRenderPlugIn = new BeforeUnloadHTMLPlugIn(plugInManager);
	}
}

class BeforeUnloadActionPlugIn extends AssureIt.ActionPlugIn {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case): boolean {
		return case0.IsEditable();
	}

	Delegate(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): boolean {
		$(window).unbind("beforeunload");
		$(window).bind("beforeunload", (e)=> {
			if(case0.IsModified() && case0.IsLatest()) {
				return "You have uncommited change.";
			}
		});
		return true;
	}
}

class BeforeUnloadHTMLPlugIn extends AssureIt.HTMLRenderPlugIn {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel) : boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel, element: JQuery) : boolean {
		return true;
	}
}
