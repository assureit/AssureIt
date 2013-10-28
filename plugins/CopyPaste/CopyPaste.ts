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
		console.log(this.CopiedNode);
		var self = this;
		if (caseViewer.Source.IsEditable()) {
			element.append('<a href="#" ><img id="copy" src="' + serverApi.basepath + 'images/copy.png" title="Copy" alt="copy" /></a>');
			if (self.CopiedNode != null && this.IsPastable(caseModel)) {
				element.append('<a href="#" ><img id="paste" src="' + serverApi.basepath + 'images/paste.png" title="Paste" alt="paste" /></a>');
			}
		}

		var copy = function(ev) {
			var encoder: AssureIt.CaseEncoder = new AssureIt.CaseEncoder();
			self.CopiedNode = encoder.ConvertToASN(caseModel, false);
			self.CopiedNodeType = caseModel.Type;
			console.log('encoded');
			console.log(self.CopiedNode);
		};

		var paste = function(ev) {
			var decoder: AssureIt.CaseDecoder = new AssureIt.CaseDecoder();
			var decoded = decoder.ParseASN(caseModel.Case, self.CopiedNode, null);
			decoded.Parent = caseModel;
			caseModel.Children.push(decoded);
			caseViewer.Draw();
		}

		$('#copy').unbind('click').unbind('dblclick');
		$('#copy').click(copy);
		$('#paste').unbind('click').unbind('dblclick');
		$('#paste').click(paste);

		return true;
	}

	IsPastable(caseModel: AssureIt.NodeModel) : boolean {
		var ParentType: AssureIt.NodeType = caseModel.Type;
		switch(this.CopiedNodeType) {
		case AssureIt.NodeType.Goal:
			if (ParentType == AssureIt.NodeType.Strategy) return true;
			break;
		case AssureIt.NodeType.Context:
			if (ParentType != AssureIt.NodeType.Context && !caseModel.HasContext()) return true;
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
