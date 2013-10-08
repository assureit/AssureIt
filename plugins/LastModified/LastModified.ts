/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />

class LastModifiedPlugIn extends AssureIt.PlugInSet {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.HTMLRenderPlugIn = new LastModifiedHTMLRenderPlugIn(plugInManager);
	}

}

class LastModifiedHTMLRenderPlugIn extends AssureIt.HTMLRenderPlugIn {
	IsEnabled(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel) : boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel, element: JQuery) : boolean {
		element.children("#lastmodified").remove();
		var summary: any = caseViewer.Source.oldsummary;
		if (summary && summary.lastModified && summary.lastModified[nodeModel.Label]) {
			console.log("hi");
			var $modified = $('<div id="lastmodified" class="text-right" ><small>Last Updated: ' + summary.lastModified[nodeModel.Label].userName + '</small></div>');
			$modified.appendTo(element);
		}

		return true;
	}
}
