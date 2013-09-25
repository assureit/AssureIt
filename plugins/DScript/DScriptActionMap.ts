/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/PlugInManager.ts" />

class DScriptActionMap {
	ActionMap : {};
	ContextArray: string[];

	constructor() {
		this.ActionMap = {};
		this.ContextArray = [];
	}

	GetContextLabel(Element: AssureIt.NodeModel): void {
		for(var i: number = 0; i < Element.Children.length; i++) {
			var Children: AssureIt.NodeModel = Element.Children[i];
			if (Children.Type == AssureIt.NodeType.Context) {
				this.ContextArray.push(Children.Label);
			}
			this.GetContextLabel(Children);
		}
		return;
	}

	GetReaction(Context: AssureIt.NodeModel): string {
		var Parent: AssureIt.NodeModel = Context.Parent;
		for(var i: number = 0; i < Parent.Children.length; i++) {
			var Child: AssureIt.NodeModel = Parent.Children[i];
			if(Child.Type != AssureIt.NodeType.Context) {
				return Child.Label;
			}
		}
		return "";
	}

	GetAction(Context: AssureIt.NodeModel, ActionType: String): void {
		var NotesKeys: string[] = Object.keys(Context.Notes);
		var Action: string = "";
		var Reaction: string = "";

		for(var i: number = 0; i < NotesKeys.length; i++) {
			if(NotesKeys[i] == "Reaction") {
				Action = Context.Notes["Reaction"];
				Reaction = this.GetReaction(Context);
				this.ActionMap[Action] = {
					"reaction" : Reaction,
					"actiontype" : ActionType,
				}
			}
		}
		return;
	}

	GetActionMap(ViewMap: {[index: string]: AssureIt.NodeModel }, Node: AssureIt.NodeModel, ASNData: string): any {
		var ActionMapScript: string = "";
		this.GetContextLabel(Node);
		for(var i: number = 0; i < this.ContextArray.length; i++) {
			var Context: AssureIt.NodeModel = ViewMap[this.ContextArray[i]];
			if (Context.GetAnnotation("OnlyIf")) {
				this.GetAction(Context, "monitor"); //FIX ME!!
			}
			//TODO: else if ...
		}
		return this.ActionMap;
	}
}
