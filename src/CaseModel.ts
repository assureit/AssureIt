module AssureIt {

	export class CaseAnnotation {
		constructor(public Name: string, public Body: string) {
		}
	}

	/* obsolete */
	//export class CaseNote {
	//	constructor(public Name: string, public Body: any) {
	//	}
	//}

	export enum NodeType {
		Goal, Context, Strategy, Evidence
	}

	export class NodeModel {
		Case : Case;
		Type  : NodeType;
		Label : string;
		Statement: string;
		Annotations : CaseAnnotation[];
		Notes: { [index: string]: string };
		Parent : NodeModel;
		Children: NodeModel[];
		LineNumber : number;


		constructor(Case : Case, Parent : NodeModel, Type : NodeType, Label : string, Statement : string) {
			this.Case = Case;
			this.Type = Type;
			this.Label = Case.NewLabel(Type, Label);
			this.Statement = (Statement == null) ? "" : Statement.replace(/[\n\r]$/g, "");
			this.Parent = Parent;
			if(Parent != null) {
				Parent.AppendChild(this);
			}
			this.Children = [];
			this.Annotations = [];
			this.Notes = {};

			Case.ElementMap[this.Label] = this; // TODO: ensure consistensy of labels
			this.LineNumber = 1; /*FIXME*/
		}

		EnableEditFlag(): void {
			this.InvokePatternPlugIn();
			this.Case.SetModified(true);
		}

		AppendChild(Node : NodeModel) : void {
			this.Children.push(Node);
			this.EnableEditFlag();
		}

		RemoveChild(Node : NodeModel) : void {
			for (var i = 0; i < this.Children.length; i++) {
				if (this.Children[i].Label == Node.Label) {
					this.Children.splice(i, 1);
				}
			}
			this.EnableEditFlag();
		}

		UpdateChild(oldNode : NodeModel, newNode : NodeModel) : void {
			for (var i = 0; i < this.Children.length; i++) {
				if (this.Children[i].Label == oldNode.Label) {
					this.Children[i] = newNode;
				}
			}
			this.EnableEditFlag();
		}

		GetAnnotation(Name: string) : CaseAnnotation {
			for(var i: number = 0; i < this.Annotations.length; i++ ) {
				if(this.Annotations[i].Name == Name) {
					return this.Annotations[i];
				}
			}
			return null;
		}

		SetAnnotation(Name: string, Body : string) : void {
			for(var i: number = 0; i < this.Annotations.length; i++ ) {
				if(this.Annotations[i].Name == Name) {
					this.Annotations[i].Body = Body;
					return;
				}
			}
			this.Annotations.push(new CaseAnnotation(Name, Body));
			this.EnableEditFlag();
		}

		SetNote(Name: string, Body : string) : void {
			this.Notes[Name] = Body;
			this.EnableEditFlag();
		}

		GetNote(Name: string) : string {
			if(Name in this.Notes) {
				return this.Notes[Name];
			}
			return null;
		}

		eachChildren(f: (i: number, v: NodeModel) => void): void { //FIXME
			for(var i: number = 0; i < this.Children.length; i++) {
				f(i, this.Children[i]);
			}
		}

		traverse(f: (i: number, v: NodeModel) => void): void {
			function traverse_(n: NodeModel, f: (i: number, v: NodeModel) => void): void {
				n.eachChildren((i: number, v: NodeModel) => {
					f(i, v);
					traverse_(v, f)
				});
			}
			f(-1, this);
			traverse_(this, f);
		}

		SearchNode(keyword: string, HitNodes: NodeModel[]): NodeModel[] {
			if ((this.Statement).indexOf(keyword) != -1) {
				HitNodes.push(this);
			}

			for (var i: number = 0; i < this.Children.length; i++) {
				this.Children[i].SearchNode(keyword, HitNodes);
			}
			return HitNodes;
		}

		/* plug-In */
		private InvokePatternPlugInRecursive(model: NodeModel) : void {
			var pluginMap : { [index: string]: PatternPlugIn} = this.Case.pluginManager.PatternPlugInMap;
			for (var key in pluginMap) {
				var plugin: PatternPlugIn = pluginMap[key];
				plugin.Delegate(model);
			}
			for (var i in model.Children) {
				this.InvokePatternPlugInRecursive(model.Children[i]);
			}
		}
		private InvokePatternPlugIn() : void {
			this.InvokePatternPlugInRecursive(this);
		}

		//InvokePlugInModifier(EventType : string, EventBody : any) : boolean {
		//	var recall = false;
		//	for(var a in this.Annotations) {
		//		var f = this.Case.GetPlugInModifier(a.Name);
		//		if(f != null) {
		//			recall = f(Case, this, EventType, EventBody) || recall;
		//		}
		//	}
		//	for(var a in this.Notes) {
		//		var f = this.Case.GetPlugInModifier(a.Name);
		//		if(f != null) {
		//			recall = f(Case, this, EventType, EventBody) || recall;
		//		}
		//	}
		//	return recall;
		//}
	}

	export class Case {
		IdCounters : any[];
		ElementTop : NodeModel;
		ElementMap : { [index: string]: NodeModel};

		private isModified : boolean = false;
		isEditable : boolean = false;
		isLatest   : boolean = true;

		constructor(public CaseName: string, public CaseId: number, public CommitId: number, public pluginManager: PlugInManager) {
			this.IdCounters = [{}, {}, {}, {}, {}];
			this.ElementMap = {};
		}

		DeleteNodesRecursive(root : NodeModel) : void {
			var Children = root.Children;
			delete this.ElementMap[root.Label];
			for (var i = 0; i < Children.length; i++) {
				this.DeleteNodesRecursive(Children[i]);
			}
			this.SetModified(true);
		}

		ClearNodes(): void {
			this.IdCounters = [{}, {}, {}, {}, {}];
			this.ElementMap = {};
		}

		/* Deprecated */
		SetElementTop(ElementTop : NodeModel) : void {
			this.ElementTop = ElementTop;
			this.SaveIdCounterMax(ElementTop);
		}

		SaveIdCounterMax(Element : NodeModel) : void {
			for (var i = 0; i < Element.Children.length; i++) {
				this.SaveIdCounterMax(Element.Children[i]);
			}
			var m = Element.Label.match(/^[GCSE][0-9]+$/);
			if(m == null) {
				return; //FIXME Label which not use this Id rule
			}
			if (m.length == 1) {
				var prefix = m[0][0];
				var count = Number(m[0].substring(1));
				switch (prefix) {
				case "G":
					this.IdCounters[NodeType["Goal"]][String(count)] = true;
					break;
				case "C":
					this.IdCounters[NodeType["Context"]][String(count)] = true;
					break;
				case "S":
					this.IdCounters[NodeType["Strategy"]][String(count)] = true;
					break;
				case "E":
					this.IdCounters[NodeType["Evidence"]][String(count)] = true;
					break;
				default:
					console.log("invalid label prefix :" + prefix);
				}
			}
		}

		private Label_getNumber(Label: string) : number {
			if (Label == null || Label.length <= 1) return -1;
			return Number(Label.substring(1));
		}

		ClearIdCounters() : void {
			this.IdCounters = [{}, {}, {}, {}, {}];
		}


		Object_Clone(obj: any) : any {
			var f = {};
			var keys = Object.keys(obj);
			for (var i in keys) {
				f[keys[i]] = obj[keys[i]];
			}
			return f;
		}

		private ElementMap_Clone(obj: any) : any {
			return this.Object_Clone(obj);
		}

		private IdCounters_Clone(obj: any[]) : any[] {
			var IdCounters = [];
			for (var i in obj) {
				IdCounters.push(this.Object_Clone(obj[i]));
			}
			return IdCounters;
		}

		private ElementMap_removeChild(ElementMap, model: NodeModel) {
			if (ElementMap[model.Label] == undefined) {
				console.log("wrong with nodemodel");
			}
			delete(ElementMap[model.Label]);
			for (var i in model.Children) {
				this.ElementMap_removeChild(ElementMap, model.Children[i]);
			}
			return ElementMap;
		}

		private IdCounters_removeChild(IdCounters: any[], model: NodeModel) {
			var count = Number(model.Label.substring(1));
			if (IdCounters[model.Type][count] == undefined) {
				console.log("wrong with idcounters");
			}
			delete(IdCounters[model.Type][count]);
			for (var i in model.Children) {
				this.IdCounters_removeChild(IdCounters, model.Children[i]);
			}
			return IdCounters;
		}

		ReserveElementMap (model: NodeModel) {
			var ElementMap = this.ElementMap;
			this.ElementMap =this. ElementMap_removeChild(this.ElementMap_Clone(this.ElementMap), model);
			return ElementMap;
		}

		ReserveIdCounters (model: NodeModel) {
			var IdCounters = this.IdCounters;
			this.IdCounters = this.IdCounters_removeChild(this.IdCounters_Clone(this.IdCounters), model);
			return IdCounters;
		}

		NewLabel(Type : NodeType, Label: string) : string {
			var label = this.Label_getNumber(Label);
			if (label != -1) {
				if (this.IdCounters[Type][String(label)] == undefined) {
					this.IdCounters[Type][String(label)] = true;
					return Label;
				}
			}
			var i: number = 1;
			while (this.IdCounters[Type][String(i)] != undefined) {
				i++;
			}
			this.IdCounters[Type][String(i)] = true;
			return NodeType[Type].charAt(0) + i;
		}

		IsLogin(): boolean {
			var matchResult = document.cookie.match(/userId=(\w+);?/);
			var userId = matchResult ? parseInt(matchResult[1]) : null;
			return userId != null;
		}

		SetEditable(flag?: boolean): void {
			if(flag == null) {
				this.isEditable = this.IsLogin();
				return;
			}
			this.isEditable = flag;
			if(!this.IsLogin()) {
				this.isEditable = false;
			}
			return;
		}

		IsEditable(): boolean {
			if(!this.IsLogin()) {
				this.isEditable = false;
			}
			return this.isEditable;
		}

		IsModified(): boolean {
			return this.isModified;
		}

		SetModified(s: boolean): void {
			this.isModified = s;
		}

		IsLatest(): boolean {
			return this.isLatest;
		}
	}

	//TODO Split file "CommitModel.ts"
	export class CommitModel {
		constructor(public CommitId: number, public Message:string, public date: string, public userId:number, public userName: string, public LatestFlag: boolean) {
		}

		toString(): string {
			return "date:" + this.date + "\n commiter:"+this.userName+"\n";
		}
	}

	export class CommitCollection {
		CommitModels: CommitModel[];

		constructor(CommitModels?: CommitModel[]) {
			if(CommitModels == null) {
				CommitModels = [];
			}
			this.CommitModels = CommitModels;
		}

		Append(CommitModel: CommitModel): void {
			this.CommitModels.push(CommitModel);
		}

		static FromJson(json_array: any[]): CommitCollection {
			var CommitModels: CommitModel[] = [];
			for(var i: number = 0; i < json_array.length; i++) {
				var j = json_array[i];
				CommitModels.push(new CommitModel(j.commitId, j.commitMessage, j.dateTime, j.userId, j.userName, false));
			}
			CommitModels[json_array.length - 1].LatestFlag = true; //Latest one
			return new CommitCollection(CommitModels);
		}

		forEach(callback: (i:number, v: CommitModel)=>void): void {
			for(var i: number = 0; i < this.CommitModels.length; i++) {
				callback(i, this.CommitModels[i]);
			}
		}
	}
}
