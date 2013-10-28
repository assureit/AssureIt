/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />

class ToDOPlugIn extends AssureIt.PlugInSet {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.HTMLRenderPlugIn = new ToDoSVGRenderPlugIn(plugInManager);
	}
}


class ToDoSVGRenderPlugIn extends SVGRenderPlugIn {
	constructor(public plugInManager: PlugInManager) {
		super(plugInManager);
	}
	IsEnabled(caseViewer: CaseViewer, elementShape: NodeView): boolean {
		return true;
	}
	Delegate(caseViewer: CaseViewer, elementShape: NodeView): boolean {
		console.log("hi");
		return true;
	}
}
