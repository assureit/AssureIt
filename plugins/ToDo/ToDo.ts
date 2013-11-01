/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />

class ToDoPlugIn extends AssureIt.PlugInSet {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.SVGRenderPlugIn = new ToDoSVGRenderPlugIn(plugInManager);
	}
}


class ToDoSVGRenderPlugIn extends AssureIt.SVGRenderPlugIn {
	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, elementShape: AssureIt.NodeView): boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, elementShape: AssureIt.NodeView): boolean {
		var model = elementShape.Source;
		var found: boolean = false;
		for (var key in model.Notes) {
			if (key == 'TODO') {
				found = true;
			}
		}
		if (found) {
			elementShape.SVGShape.SetColor(AssureIt.Color.ToDo);
		}
		return true;
	}
}
