/// <reference path="CaseModel.ts" />
/// <reference path="CaseViewer.ts" />

class LayoutEngine {
	X_MARGIN: number;
	Y_MARGIN: number;

	constructor(public ViewMap: { [index: string]: ElementShape; }) {
	}

	Init(Element: CaseModel, x: number, y: number): void {
	}

	Traverse(Element: CaseModel, x: number, y: number): void {
	}

	SetFootElementPosition(): void {
	}

	SetAllElementPosition(Element: CaseModel): void {
	}

	GetContextIndex(Node: CaseModel): number {
		for (var i: number = 0; i < Node.Children.length; i++) {
			if (Node.Children[i].Type == CaseType.Context) {
				return i;
			}
		}
		return -1;
	}
}

class LayoutLandscape extends LayoutEngine {
	//	var CaseArray : any[];
	//	footelement : string[] = new Array();
	//	contextId : number = -1;
	LeafNodeNames: string[] = new Array();
	CONTEXT_MARGIN: number = 140;

	constructor(public ViewMap: { [index: string]: ElementShape; }) {
		super(ViewMap);
		this.X_MARGIN = 200;
		this.Y_MARGIN = 180;
	}

	Traverse(Element: CaseModel, Depth: number, x: number): void {
		this.SetXpos(Element, Depth);
		this.SetLeafYpos(Element);
		this.SetOtherYpos(Element);
	}

	SetXpos(Element: CaseModel, Depth: number): void {
		if (Element.Type == CaseType.Context) {
			Depth -= 1;
		}

		this.SetVector(Element);

		this.ViewMap[Element.Label].AbsX = Depth * this.X_MARGIN;

		if (Element.Children.length == 0) {
			if (Element.Type != CaseType.Context) {//
				this.LeafNodeNames.push(Element.Label);
			}
		} else if (Element.Children.length == 1) {
			if (Element.Children[0].Type == CaseType.Context) {
				this.LeafNodeNames.push(Element.Label);//if not Context
			}
		}

		for (var i: number = 0; i < Element.Children.length; i++) {
			this.SetXpos(Element.Children[i], Depth + 1);
		}
		return;
	}

	SetVector(Element: CaseModel): void {
		var CaseView = this.ViewMap[Element.Label];
		if (Element.Type == CaseType.Context) {
			CaseView.ParentDirection = Direction.Bottom;
			CaseView.IsArrowReversed = true;
		} else {
			CaseView.ParentDirection = Direction.Left;
		}
		return;
	}

	SetLeafYpos(Element: CaseModel): void {
		for (var i: number = 1; i < this.LeafNodeNames.length; i++) {
			if (this.ViewMap[this.LeafNodeNames[i]].Source.Children.length == 1 && this.ViewMap[this.LeafNodeNames[i]].Source.Type != CaseType.Context) {
				this.ViewMap[this.LeafNodeNames[i]].AbsY += this.ViewMap[this.LeafNodeNames[i - 1]].AbsY +
				this.Y_MARGIN * 2;
			} else {
				this.ViewMap[this.LeafNodeNames[i]].AbsY += this.ViewMap[this.LeafNodeNames[i - 1]].AbsY +
				this.Y_MARGIN;
			}
		}
	}

	SetOtherYpos(Element: CaseModel): void {
		if (Element.Children.length == 0) {
			return;
		}

		if (Element.Children.length == 1 && Element.Children[0].Type == CaseType.Context) {
			this.ViewMap[Element.Children[0].Label].AbsY = (this.ViewMap[Element.Label].AbsY - this.CONTEXT_MARGIN);
			return;
		}

		for (var i: number = 0; i < Element.Children.length; i++) {
			this.SetOtherYpos(Element.Children[i]);
		}

		var IntermediatePos: number = 0;

		var ContextIndex: number = this.GetContextIndex(Element);

		IntermediatePos = this.CalcIntermediatePos(Element, ContextIndex);

		if (ContextIndex == -1) {
			if (Element.Children.length == 1 && Element.Children[0].Type == CaseType.Evidence) {
				this.ViewMap[Element.Label].AbsY = this.ViewMap[Element.Children[0].Label].AbsY + 15;
			}
			else {
				this.ViewMap[Element.Label].AbsY = IntermediatePos;
			}
		} else {
			this.ViewMap[Element.Label].AbsY = IntermediatePos;
			this.ViewMap[Element.Children[ContextIndex].Label].AbsY = this.ViewMap[Element.Label].AbsY - this.CONTEXT_MARGIN;
		}
		return;
	}

	CalcIntermediatePos(Element: CaseModel, ContextIndex: number): number {
		var ChildLen = Element.Children.length;

		if (ContextIndex == ChildLen - 1) {
			return (this.ViewMap[Element.Children[0].Label].AbsY
				+ (this.ViewMap[Element.Children[ChildLen - 2].Label].AbsY
				- this.ViewMap[Element.Children[0].Label].AbsY) / 2);
		}
		else if (ContextIndex == 0) {
			return (this.ViewMap[Element.Children[1].Label].AbsY
				+ (this.ViewMap[Element.Children[ChildLen - 1].Label].AbsY
				- this.ViewMap[Element.Children[1].Label].AbsY) / 2);
		}
		else {
			return (this.ViewMap[Element.Children[0].Label].AbsY
				+ (this.ViewMap[Element.Children[ChildLen - 1].Label].AbsY
				- this.ViewMap[Element.Children[0].Label].AbsY) / 2);
		}
	}
}

class LayoutPortrait extends LayoutEngine {
	X_MARGIN = 200;
	Y_MARGIN = 160;
	X_CONTEXT_MARGIN: number = 200;
	X_FOOT_MARGIN: number = 100;
	X_MULTI_ELEMENT_MARGIN: number = 20;
	footelement: string[] = new Array();
	contextId: number = -1;

	constructor(public ViewMap: { [index: string]: ElementShape; }) {
		super(ViewMap);
	}

	UpdateContextElementPosition(ContextElement: CaseModel): void {
		var ContextView: ElementShape = this.ViewMap[ContextElement.Label];
		var ParentView: ElementShape = ContextView.ParentShape;
		var h1: number = ContextView.HTMLDoc.Height;
		var h2: number = ParentView.HTMLDoc.Height;
		ContextView.ParentDirection = Direction.Left;
		ContextView.IsArrowReversed = true;
		ContextView.AbsX = (ParentView.AbsX + this.X_CONTEXT_MARGIN);
		ContextView.AbsY = (ParentView.AbsY - (h1 - h2) / 2);
	}

	SetAllElementPosition(Element: CaseModel): void {
		var n: number = Element.Children.length;
		if (n == 0) {
			return;
		}
		var ParentView: ElementShape = this.ViewMap[Element.Label];

		if (n == 1 && Element.Children[0].Type == CaseType.Context) {
			this.UpdateContextElementPosition(Element.Children[0]);
			return;
		}

		for (var i: number = 0; i < n; i++) {
			this.SetAllElementPosition(Element.Children[i]);
		}

		var ContextIndex: number = this.GetContextIndex(Element);
		var xPositionSum: number = 0;
		for (var i: number = 0; i < n; i++) {
			if (ContextIndex != i) {
				xPositionSum += this.ViewMap[Element.Children[i].Label].AbsX;
			}
		}
		if (ContextIndex == -1) {
			ParentView.AbsX = xPositionSum / n;
		}
		else {//set context (x, y) position
			ParentView.AbsX = xPositionSum / (n - 1);
			this.UpdateContextElementPosition(Element.Children[ContextIndex]);
		}
	}

	CalculateMinPosition(ElementList: CaseModel[]): number {
		if (ElementList[0].Type == CaseType.Context) {
			var xPosition: number = this.ViewMap[ElementList[1].Label].AbsX;
		}
		else {
			var xPosition: number = this.ViewMap[ElementList[0].Label].AbsX;
		}
		var n: number = ElementList.length;
		for (var i: number = 0; i < n; i++) {
			console.log(this.ViewMap[ElementList[i].Label].AbsX);
			if (ElementList[i].Type == CaseType.Context) {
				continue;
			}
			if (xPosition > this.ViewMap[ElementList[i].Label].AbsX) {
				xPosition = this.ViewMap[ElementList[i].Label].AbsX;
			}
		}
		return xPosition;
	}

	CalculateMaxPosition(ElementList: CaseModel[]): number {
		if (ElementList[0].Type == CaseType.Context) {
			var xPosition: number = this.ViewMap[ElementList[1].Label].AbsX;
		}
		else {
			var xPosition: number = this.ViewMap[ElementList[0].Label].AbsX;
		}

		var n: number = ElementList.length;
		for (var i: number = 0; i < n; i++) {
			var ChildView: ElementShape = this.ViewMap[ElementList[i].Label];
			if (ElementList[i].Type == CaseType.Context) {
				continue;
			}
			if (xPosition < ChildView.AbsX) {
				xPosition = ChildView.AbsX;
			}
		}
		return xPosition;
	}

	SetFootElementPosition(): void {
		var n: number = this.footelement.length;
		for (var i: number = 0; i < n; i++) {
			var PreviousElementShape: ElementShape = this.ViewMap[this.footelement[i - 1]];
			var CurrentElementShape: ElementShape = this.ViewMap[this.footelement[i]];
			CurrentElementShape.AbsX = 0;
			if (i != 0) {
				if ((PreviousElementShape.ParentShape.Source.Label != CurrentElementShape.ParentShape.Source.Label) && (this.GetContextIndex(PreviousElementShape.ParentShape.Source) != -1)) {
					var PreviousParentChildren: CaseModel[] = PreviousElementShape.ParentShape.Source.Children;
					var Min_xPosition: number = this.CalculateMinPosition(PreviousParentChildren);
					var Max_xPosition: number = this.CalculateMaxPosition(PreviousParentChildren);
					var ArgumentMargin: number = (Max_xPosition - Min_xPosition) / 2;
					if (ArgumentMargin > (this.X_CONTEXT_MARGIN - this.X_MULTI_ELEMENT_MARGIN)) {
						CurrentElementShape.AbsX += this.X_MULTI_ELEMENT_MARGIN;
					}
					else {
						CurrentElementShape.AbsX += this.X_FOOT_MARGIN;
					}
				}
				if (this.GetContextIndex(PreviousElementShape.Source) != -1) {
					CurrentElementShape.AbsX += this.X_MARGIN;
				}
				CurrentElementShape.AbsX += (PreviousElementShape.AbsX + this.X_MARGIN);
			}
		}
		return;
	}

	Init(Element: CaseModel, x: number, y: number): void {
		this.ViewMap[Element.Label].AbsY += y;
	}

	Traverse(Element: CaseModel, x: number, y: number) {
		if ((Element.Children.length == 0 && Element.Type != CaseType.Context) || (Element.Children.length == 1 && Element.Children[0].Type == CaseType.Context)) {
			this.footelement.push(Element.Label);
			return;
		}

		var i: number = 0;
		i = this.GetContextIndex(Element);
		if (i != -1) { //emit context element data
			var ContextView: ElementShape = this.ViewMap[Element.Children[i].Label];
			var ParentView: ElementShape = ContextView.ParentShape;
			var h1: number = ContextView.HTMLDoc.Height;
			var h2: number = ParentView.HTMLDoc.Height;
			var h: number = (h1 - h2) / 2;
			ContextView.ParentDirection = Direction.Left;
			ContextView.AbsX += x;
			ContextView.AbsY += (y - h);
			ContextView.AbsX += this.X_CONTEXT_MARGIN;
			this.EmitChildrenElement(Element, ParentView.AbsX, ParentView.AbsY, i);
		} else {  //emit element data except context
			this.EmitChildrenElement(Element, x, y, i);
		}
	}

	EmitChildrenElement(Node: CaseModel, x: number, y: number, ContextId: number): void {
		var n: number = Node.Children.length;
		for (var i: number = 0; i < n; i++) {
			var ElementView: ElementShape = this.ViewMap[Node.Children[i].Label];
			if (ContextId == i) {
				continue;
			}
			else {
				ElementView.AbsY = y;
				ElementView.AbsY += this.Y_MARGIN;
				this.Traverse(Node.Children[i], ElementView.AbsX, ElementView.AbsY);
			}
		}
		return;
	}
}
