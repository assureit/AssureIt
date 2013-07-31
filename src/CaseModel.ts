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
	ElementTop : CaseModel;
	ElementMap : { [index: string]: CaseModel};

	IsModified : boolean;
	//TopGoalLabel : string;

	constructor() {
		this.IdCounters = [0, 0, 0, 0, 0];
		this.IsModified = false;
		this.ElementMap = {};
	}

	/* Deprecated */
	SetElementTop(ElementTop : CaseModel) : void{
		this.ElementTop = ElementTop;
		this.SaveIdCounterMax(ElementTop);
	}
	SaveIdCounterMax(Element : CaseModel) : void {
		for (var i = 0; i < Element.Children.length; i++) {
			this.SaveIdCounterMax(Element.Children[i]);
		}
		var m = Element.Label.match(/^[GCSE][0-9]+$/);
		if (m.length == 1) {
			var prefix = m[0][0];
			var count = Number(m[0].substring(1));
			switch (prefix) {
			case "G":
				if (this.IdCounters[CaseType["Goal"]] < count) this.IdCounters[CaseType["Goal"]] = count;
				break;
			case "C":
				if (this.IdCounters[CaseType["Context"]] < count) this.IdCounters[CaseType["Context"]] = count;
				break;
			case "S":
				if (this.IdCounters[CaseType["Strategy"]] < count) this.IdCounters[CaseType["Strategy"]] = count;
				break;
			case "E":
				if (this.IdCounters[CaseType["Evidence"]] < count) this.IdCounters[CaseType["Evidence"]] = count;
				break;
			default:
				console.log("invalid label prefix :" + prefix);
			}
		}
	}
	NewLabel(Type : CaseType) : string {
		this.IdCounters[Type] += 1;
		return CaseType[Type].charAt(0) + this.IdCounters[Type];
	}
		
	GetPlugInModifier(key : string) : (Case, CaseModel, string, any) => boolean {
		return CaseModifierConfig.PlugInMap[key];
	}
}


