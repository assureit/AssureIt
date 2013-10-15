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
	CopiedNode: string; // Assure-It Notation
	CopiedNodeType: AssureIt.NodeType;
	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.CopiedNode = null;
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel): boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel, element: JQuery, serverApi: AssureIt.ServerAPI): boolean {
		var self = this;
		element.append('<a href="#" ><img id="copy" src="' + serverApi.basepath + 'images/icon.png" title="Copy" alt="copy" /></a>');
		if (self.CopiedNode != null && this.IsPastable(caseModel)) {
			element.append('<a href="#" ><img id="paste" src="' + serverApi.basepath + 'images/icon.png" title="Paste" alt="paste" /></a>');
		}
		return true;
	}

	IsPastable(caseModel: AssureIt.NodeModel) : boolean {
		var ParentType: AssureIt.NodeType = caseModel.Type;
		switch(this.CopiedNodeType) {
		case AssureIt.NodeType.Goal:
			if (ParentType == AssureIt.NodeType.Strategy) return true;
			break;
		case AssureIt.NodeType.Context:
			if (!caseModel.HasContext()) return true;
			break;
		case AssureIt.NodeType.Strategy:
			if (ParentType == AssureIt.NodeType.Goal) return true;
			break;
		case AssureIt.NodeType.Evidence:
			if (ParentType == AssureIt.NodeType.Goal) return true;
			break;
		}
		return false;
	}
}
