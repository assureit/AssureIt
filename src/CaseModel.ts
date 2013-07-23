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

        x : number;
        y : number;

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
      	        this.x = 0;
	        this.y = 0;

		Case.ElementMap[this.Label] = this; // TODO: ensure consistensy of labels
	}

	AppendChild(Node : CaseModel) : void {
		this.Children.push(Node);
	}
	
	// GetAnnotation(Name: string) : CaseAnnotation {
	// 	for(var a in this.Annotations) {
	// 		if(a.Name == Name) {
	// 			return a;
	// 		}
	// 	}
	// 	return a;
	// }

	// SetAnnotation(Name: string, Body : any) : CaseAnnotation {
	// 	for(var a in this.Annotations) {
	// 		if(a.Name == Name) {
	// 			a.Body = Body;
	// 			return a;
	// 		}
	// 	}
	// 	this.Annotations.push(new CaseAnnotation(Name, Body));
	// }
	
	/* plug-In */
	// InvokePlugInModifier(EventType : string, EventBody : any) : boolean {
	// 	var recall = false;
	// 	for(var a in this.Annotations) {
	// 		var f = this.Case.GetPlugInModifier(a.Name);
	// 		if(f != null) {
	// 			recall = f(Case, this, EventType, EventBody) || recall;
	// 		}
	// 	}
	// 	for(var a in this.Notes) {
	// 		var f = this.Case.GetPlugInModifier(a.Name);
	// 		if(f != null) {
	// 			recall = f(Case, this, EventType, EventBody) || recall;
	// 		}
	// 	}
	// 	return recall;
	// }	
}

class CaseModifiers {
	PlugInMap : { [index: string]: (Case, CaseModel, string, any) => boolean};

	constructor() {
		this.PlugInMap = {};
	}
	
	AddPlugInModifier(key: string, f : (Case, CaseModel, string, any) => boolean) {
		this.PlugInMap[key] = f;
	}
	
//	GetPlugInModifier(key : string) : (Case, CaseModel, string, any) => boolean {
//		return this.PlugInMap[key];
//	}
}

 var CaseModifierConfig = new CaseModifiers();

class Case {
	CaseId : number;  // TODO
	Ids : number[];
	ElementMap : { [index: string]: CaseModel};
    IsModified : boolean;
    TopGoalLabel : string;
	
	constructor() {
		this.Ids = [0, 0, 0, 0, 0];
		this.IsModified = false;
		this.ElementMap = {};
	}
	SetTopGoalLabel(Label : string) {
		this.TopGoalLabel = Label;
	}

	NewLabel(Type : CaseType) : string {
		this.Ids[Type] = this.Ids[Type] + 1;
		return CaseType[Type].charAt(0) + this.Ids[Type]; // TODO G1, S1, E1, C1
	}
		
	GetPlugInModifier(key : string) : (Case, CaseModel, string, any) => boolean {
		return CaseModifierConfig.PlugInMap[key];
	}
}

var X_MARGIN = 30;
var Y_MARGIN = 50;

var hasContext = function(Node : CaseModel, x : number, y : number) {
    var i = 0
    for(; i < Node.Children.length; i++) {
	if(Node.Children[i].Type == 1) {
	    return i;
	}
    }
    return -1;
}

var emitOddNumberChildren = function(Node : CaseModel, x : number, y : number) {
    var n = Node.Children.length;
    for(var i in Node.Children) {
	Node.Children[i].x += x;
	Node.Children[i].y += y;
	Node.Children[i].y += Y_MARGIN;
    }
    var num = (n-1)/2;
    for(var j = -num; j <= num; j++) {
	Node.Children[i].x += X_MARGIN * j;
    }

    for(var i in Node.Children) {
	console.log(Node.Children[i].Label);
	console.log("(" + Node.Children[i].x + ", " + Node.Children[i].y + ")");
	traverse(Node.Children[i], Node.Children[i].x, Node.Children[i].y);
    }
}

var emitEvenNumberChildren = function(Node : CaseModel, x : number, y : number) {
    var n = Node.Children.length;
    var num = n/2;
    var index = new Array();

    for(var j = -num; j <= num; j++) {
	if(j == 0) {
	    continue;
	}
	index.push(j);
    }

    for(var i in Node.Children) {
	Node.Children[i].x += x;
	Node.Children[i].y += y;
	Node.Children[i].x += X_MARGIN * index[i];
	Node.Children[i].y += Y_MARGIN;
	console.log(Node.Children[i].Label);
	console.log("(" + Node.Children[i].x + ", " + Node.Children[i].y + ")");
	traverse(Node.Children[i], Node.Children[i].x, Node.Children[i].y);
    }
}

var traverse = function(Node : CaseModel, x : number, y : number) {
    if(Node.Children.length == 0) {
	return;
    }
    var i = 0;
    i = hasContext(Node, x, y);
    if(i != -1) { //emit context element data
  	Node.Children[i].x += x;
    	Node.Children[i].y += y;
    	Node.Children[i].x += X_MARGIN;
    	console.log(Node.Children[i].Label);
    	console.log("(" + Node.Children[i].x + ", " + Node.Children[i].y + ")");
	Node.Children = Node.Children.splice(i-1,1);
	traverse(Node, x , y);
    } else {  //emit element data except context
	if(Node.Children.length % 2 == 1) {
	    emitOddNumberChildren(Node, x, y)
	}
	if(Node.Children.length % 2 == 0) {
	    emitEvenNumberChildren(Node, x, y)
	}
    }
}

//var main = function() {
//
//    var caseargument : Case    = new Case();
//    var topgoal : CaseModel    = new CaseModel(caseargument, null, CaseType.Goal, "G1", null);
//    var context : CaseModel    = new CaseModel(caseargument, topgoal, CaseType.Context, "C1", null);
//    var strategy : CaseModel   = new CaseModel(caseargument, topgoal, CaseType.Strategy, "ST1", null);
//    var subgoal_1 : CaseModel  = new CaseModel(caseargument, strategy, CaseType.Goal, "G2", null);
//    var evidence_1 : CaseModel = new CaseModel(caseargument, subgoal_1, CaseType.Evidence, "E2", null);
//    var subgoal_2 : CaseModel  = new CaseModel(caseargument, strategy, CaseType.Goal, "G3", null);
//    var evidence_2 : CaseModel = new CaseModel(caseargument, subgoal_2, CaseType.Evidence, "E3", null);
//
//    console.log("TopGoal");
//    console.log("(" + topgoal.x + ", " + topgoal.y + ")");
////    console.log(topgoal);
//    traverse(topgoal, topgoal.x, topgoal.y);
//}
//
//main();
