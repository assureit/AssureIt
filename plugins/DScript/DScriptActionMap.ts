/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/PlugInManager.ts" />


class DScriptActionMap {
	ActionMap : { [key: string]: string;}[];
	ContextArray: string[];
	constructor() {
		this.ActionMap = [];
		this.ContextArray = [];
	}

	GetContextLabel(Element: AssureIt.NodeModel): void {
		for(var i: number = 0; i < Element.Children.length; i++) {
			if (Element.Children[i].Type == AssureIt.NodeType.Context) {
				this.ContextArray.push(Element.Children[i].Label);
			}
			console.log(Element.Children[i].Label);
			this.GetContextLabel(Element.Children[i]);
		}
		return;
	}

	GetActionMap(ViewMap: {[index: string]: AssureIt.NodeModel }, Node: AssureIt.NodeModel, ASNData: string): void {
		this.GetContextLabel(Node);
		for(var i: number = 0; i < this.ContextArray.length; i++) {
//			console.log(this.ContextArray[i]);
//			console.log(ViewMap[this.ContextArray[i]]);
			var Context: AssureIt.NodeModel = ViewMap[this.ContextArray[i]];
			console.log(Context);
			if(Context.Annotations.length > 0) {
				console.log(Context.Annotations.length);
				console.log(Context.Annotations[0].Name);
				console.log(Context.Notes);
				var NotesKeys: string[] = Object.keys(Context.Notes);
				for(var i: number = 0; i < NotesKeys.length; i++) {
					if(NotesKeys[i] == "Reaction") {
						console.log("This is registered.");
						console.log(Context.Notes[NotesKeys[i]]);
					}
				}
				console.log(Object.keys(Context.Notes));
			};
		}
		return;
	}
}
