class CaseAnnotation {
	constructor(public Name: string, public Body: any) {
	}
}

class CaseNote {
	constructor(public Name: string, public Body: any) {
	}
}

enum CaseType {
	Goal, Context, Strategy, Evidence
}

class CaseModel {
	Case : Case;
	Type  : CaseType;
	Label : string;
	Statement: string;
	Annotations : CaseAnnotation[];
	Notes: CaseNote[];
	Parent : CaseModel;
	Children: CaseModel[];

	constructor(Case : Case, Parent : CaseModel, Type : CaseType, Label : string, Statement : string) {
		this.Case = Case;
		this.Type = Type;
		this.Label = (Label == null) ? Case.NewLabel(Type) : Label;
		this.Statement = (Statement == null) ? "" : Statement;
		this.Parent = Parent;
		if(Parent != null) {
			Parent.AppendChild(this);
		}
		this.Children = [];
		this.Annotations = [];
		this.Notes = [];

		Case.ElementMap[this.Label] = this; // TODO: ensure consistensy of labels
	}

	AppendChild(Node : CaseModel) : void {
		this.Children.push(Node);
	}
	
	GetAnnotation(Name: string) : CaseAnnotation {
		for(var a in this.Annotations) {
			if(a.Name == Name) {
				return a;
			}
		}
		return a;
	}

	SetAnnotation(Name: string, Body : any) : CaseAnnotation {
		for(var a in this.Annotations) {
			if(a.Name == Name) {
				a.Body = Body;
				return a;
			}
		}
		this.Annotations.push(new CaseAnnotation(Name, Body));
	}
	
	/* plug-In */
	InvokePlugInModifier(EventType : string, EventBody : any) : boolean {
		var recall = false;
		for(var a in this.Annotations) {
			var f = this.Case.GetPlugInModifier(a.Name);
			if(f != null) {
				recall = f(Case, this, EventType, EventBody) || recall;
			}
		}
		for(var a in this.Notes) {
			var f = this.Case.GetPlugInModifier(a.Name);
			if(f != null) {
				recall = f(Case, this, EventType, EventBody) || recall;
			}
		}
		return recall;
	}
}

class CaseModifiers {
	PlugInMap : { [index: string]: (Case, CaseModel, string, any) => boolean};

	constructor() {
		this.PlugInMap = {};
	}
	
	AddPlugInModifier(key: string, f : (Case, CaseModel, string, any) => boolean) {
		this.PlugInMap[key] = f;
	}
	
	GetPlugInModifier(key : string) : (Case, CaseModel, string, any) => boolean {
		return this.PlugInMap[key];
	}
}

var CaseModifierConfig = new CaseModifiers();

class Case {
	CaseId : number;  // TODO
	IdCounters : number[];
	ElementMap : { [index: string]: CaseModel};

	IsModified : boolean;
	TopGoalLabel : string;

	constructor() {
		this.IdCounters = [0, 0, 0, 0, 0];
		this.IsModified = false;
		this.ElementMap = {};
	}

	SetTopGoalLabel(Label : string) {
		this.TopGoalLabel = Label;
	}

	NewLabel(Type : CaseType) : string {
		this.IdCounters[Type] = this.IdCounters[Type] + 1;
		return CaseType[Type].charAt(0) + this.IdCounters[Type]; // TODO G1, S1, E1, C1
	}
		
	GetPlugInModifier(key : string) : (Case, CaseModel, string, any) => boolean {
		return CaseModifierConfig.PlugInMap[key];
	}
}

