/// <reference path="CaseModel.ts" />
/// <reference path="CaseViewer.ts" />

class Layout {
	X_MARGIN : number;
	Y_MARGIN : number;

	constructor(public ViewMap : { [index: string]: ElementShape; } ) {
	}

	Init(Element: CaseModel, x : number, y : number) : void {
	}

	Traverse(Element: CaseModel, x : number, y : number) : void {
	}

	SetFootElementPosition() : void {
	}

	SetAllElementPosition(Element: CaseModel) : void {
	}
}

class LayoutLandscape extends Layout {
	constructor(public ViewMap : { [index: string]: ElementShape; } ) {
		super(ViewMap);
		this.X_MARGIN = 200;
		this.Y_MARGIN = 100;
	}

	GetContextIndex(Node : CaseModel) : number {
		var i : number = 0
			for(; i < Node.Children.length; i++) {
				if(Node.Children[i].Type == CaseType.Context) {
					return i;
				}
			}
		return -1;
	}

	Init(Element: CaseModel, x : number, y : number) : void {
		this.ViewMap[Element.Label].AbsX += x;
		this.ViewMap[Element.Label].AbsY += y;

	}

	Traverse(Element: CaseModel, x : number, y : number) : void{
		if(Element.Children.length == 0) {
			return;
		}

		var i : number  = this.GetContextIndex(Element);
		if(i != -1) { //emit context element data
			this.ViewMap[Element.Children[i].Label].AbsX += x;
			this.ViewMap[Element.Children[i].Label].AbsY += y;
			this.ViewMap[Element.Children[i].Label].AbsY += this.Y_MARGIN;
			console.log(Element.Label);
			console.log("(" + this.ViewMap[Element.Label].AbsX + ", " + this.ViewMap[Element.Label].AbsY + ")");
			Element.Children = Element.Children.splice(i-1,1);
			this.Traverse(Element, this.ViewMap[Element.Label].AbsX, this.ViewMap[Element.Label].AbsY);
		} else {  //emit element data except context
			if(Element.Children.length % 2 == 1) {
				this.EmitOddNumberChildren(Element, x, y);
			}
			if(Element.Children.length % 2 == 0) {
				this.EmitEvenNumberChildren(Element, x, y);
			}
		}
	}

	EmitOddNumberChildren(Node : CaseModel, x : number, y : number) : void {
		var n : number = Node.Children.length;
		for(var i : number = 0; i < n; i++) {
			this.ViewMap[Node.Children[i].Label].AbsX = x;
			this.ViewMap[Node.Children[i].Label].AbsY = y;
			this.ViewMap[Node.Children[i].Label].AbsX += this.X_MARGIN;
		}
		var num : number = (n-1)/2;
		var k : number;
		for(var j : number  = -num, k = 0; j <= num; j++, k++) {
			this.ViewMap[Node.Children[k].Label].AbsY += this.Y_MARGIN * j;
		}

		for(var i : number = 0; i < n; i++) {
			console.log(Node.Children[i].Label);
			console.log("(" + this.ViewMap[Node.Children[i].Label].AbsX + ", " + this.ViewMap[Node.Children[i].Label].AbsY + ")");
			this.Traverse(Node.Children[i], this.ViewMap[Node.Children[i].Label].AbsX, this.ViewMap[Node.Children[i].Label].AbsY);
		}
		return;
	}

	EmitEvenNumberChildren(Node : CaseModel, x : number, y : number) : void {
		var n : number = Node.Children.length;
		var num : number = n/2;
		var index : any[] = new Array();

		for(var j : number = -num; j <= num; j++) {
			if(j == 0) {
				continue;
			}
			index.push(j);
		}

		for(var i : number = 0; i < n; i++) {
			this.ViewMap[Node.Children[i].Label].AbsX += x;
			this.ViewMap[Node.Children[i].Label].AbsY += y;
			this.ViewMap[Node.Children[i].Label].AbsY += this.Y_MARGIN * index[i];
			this.ViewMap[Node.Children[i].Label].AbsX += this.X_MARGIN;
			console.log(Node.Children[i].Label);
			console.log("(" + this.ViewMap[Node.Children[i].Label].AbsX + ", " + this.ViewMap[Node.Children[i].Label].AbsY + ")");
			this.Traverse(Node.Children[i], this.ViewMap[Node.Children[i].Label].AbsX, this.ViewMap[Node.Children[i].Label].AbsY);
		}
		return;
	}
}

class LayoutPortrait extends Layout {
	X_MARGIN = 200;
	Y_MARGIN = 160;
	X_CONTEXT_MARGIN : number = 30;
	footelement : string[] = new Array();

	constructor(public ViewMap : { [index: string]: ElementShape; } ) {
		super(ViewMap);
	}

	SetAllElementPosition(Element : CaseModel) : void {
		if(Element.Children.length == 0) {
			return;
		}

		for(var i in Element.Children) {
			this.SetAllElementPosition(Element.Children[i]);
		}

		var xPositionSum = 0;
		for(var i in Element.Children) {
			xPositionSum += this.ViewMap[Element.Children[i].Label].AbsX
		}
		this.ViewMap[Element.Label].AbsX = xPositionSum/Element.Children.length;
		console.log(this.ViewMap[Element.Label].AbsX);
	}

	SetFootElementPosition() : void {
		for(var i in this.footelement) {
//			console.log(this.footelement[i] + ".AbsX = " + this.ViewMap[this.footelement[i]].AbsX);
//			console.log(this.footelement[i] + ".AbsY = " + this.ViewMap[this.footelement[i]].AbsY);
			if(i != 0) {
				console.log("parent label of previous element in footelement= " + this.ViewMap[this.footelement[i-1]].ParentShape.Source.Label);
				this.ViewMap[this.footelement[i]].AbsX += (this.ViewMap[this.footelement[i-1]].AbsX + this.X_MARGIN);
				console.log("footelement.AbsX = " + this.ViewMap[this.footelement[i]].AbsX);
			}
		}
		return;
	}

	GetContextIndex(Node : CaseModel) : number {
		var i : number = 0;
		for(; i < Node.Children.length; i++) {
			if(Node.Children[i].Type == CaseType.Context) {
				return i;
			}
		}
		return -1;
	}

	Init(Element: CaseModel, x : number, y : number) : void {
		this.ViewMap[Element.Label].AbsY += y;
	}

	Traverse(Element: CaseModel, x : number, y : number) {
		if(Element.Children.length == 0) {
			this.footelement.push(Element.Label);
			console.log("footelement = " + this.footelement);
			return;
		}

		var i : number = 0;
		i = this.GetContextIndex(Element);
		if(i != -1) { //emit context element data
			this.ViewMap[Element.Children[i].Label].ParentDirection = Direction.Left;
			this.ViewMap[Element.Children[i].Label].AbsX += x;
			this.ViewMap[Element.Children[i].Label].AbsY += y;
			this.ViewMap[Element.Children[i].Label].AbsX += this.X_CONTEXT_MARGIN;
			console.log(Element.Label);
			console.log("(" + this.ViewMap[Element.Label].AbsX + ", " + this.ViewMap[Element.Label].AbsY + ")");
			Element.Children = Element.Children.splice(i-1,1);
			this.Traverse(Element, this.ViewMap[Element.Label].AbsX, this.ViewMap[Element.Label].AbsY);
		} else {  //emit element data except context
				this.EmitChildrenElement(Element, x, y);
		}
	}

	EmitChildrenElement(Node : CaseModel, x : number, y : number) : void {
		var n : number = Node.Children.length;
		for(var i : number = 0; i < n; i++) {
			this.ViewMap[Node.Children[i].Label].AbsY = y;
			this.ViewMap[Node.Children[i].Label].AbsY += this.Y_MARGIN;
			this.Traverse(Node.Children[i], this.ViewMap[Node.Children[i].Label].AbsX, this.ViewMap[Node.Children[i].Label].AbsY);
		}
		return;
	}
}
