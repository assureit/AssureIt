/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />

class NotePlugIn extends AssureIt.PlugInSet {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.HTMLRenderPlugIn = new NoteHTMLRenderPlugIn(plugInManager);
	}

}

class NoteHTMLRenderPlugIn extends AssureIt.HTMLRenderPlugIn {
	IsEnabled(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel) : boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, nodeModel: AssureIt.NodeModel, element: JQuery) : boolean {
		element.children("#note").remove()
		var $note = $('<div id="note"></div>');

		for (var key in nodeModel.Notes) {
			switch (key) {
			case 'TranslatedTextEn':
				var note = nodeModel.Notes[key];
				$('<p style="color: DarkOliveGreen">' + note + '</p>').appendTo($note);
				$note.appendTo(element);
				break;
			default:
				var note = nodeModel.Notes[key];
				$('<p style="color: DarkOliveGreen">' + key + ":: " + note + '</p>').appendTo($note);
				$note.appendTo(element);
			}
		}

		return true;
	}
}
