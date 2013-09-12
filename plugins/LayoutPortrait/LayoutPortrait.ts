/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/ServerApi.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../../d.ts/underscore.d.ts" />

class LayoutPortraitPlugIn extends AssureIt.PlugInSet {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.LayoutEnginePlugIn = new LayoutPortraitEnginePlugIn(plugInManager);
	}

}

class LayoutPortraitEnginePlugIn extends AssureIt.LayoutEnginePlugIn {
	ElementWidth: number = 50;
	X_MARGIN: number = 200;
	Y_MARGIN: number = 150;
	Y_ADJUSTMENT_MARGIN: number = 50;
	Y_NODE_MARGIN: number = 205;
	Y_NODE_ADJUSTMENT_MARGIN: number = 70;
	X_CONTEXT_MARGIN: number = 200;
	X_OVER_MARGIN: number = 700;
	X_FOOT_MARGIN: number = 100;
	X_MULTI_ELEMENT_MARGIN: number = 20;
	footelement: string[] = [];
	contextId: number = -1;

	ViewMap: {[index: string]: AssureIt.NodeView };

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	Init(ViewMap: {[index: string]: AssureIt.NodeView}, Element: AssureIt.NodeModel, x: number, y: number, ElementWidth: number): void {
		this.footelement = [];
		this.contextId = -1;
		this.ElementWidth = ElementWidth;
		this.ViewMap = ViewMap;
		this.ViewMap[Element.Label].AbsY += y;
		this.X_MARGIN = ElementWidth + 50;
		this.X_CONTEXT_MARGIN = ElementWidth + 50;
	}

	LayoutAllView(Element: AssureIt.NodeModel, x: number, y: number) {
		this.Traverse(Element, x, y);
		this.SetFootElementPosition();
		this.SetAllElementPosition(Element);
	}

	UpdateContextElementPosition(ContextElement: AssureIt.NodeModel): void {
		var ContextView: AssureIt.NodeView = this.ViewMap[ContextElement.Label];
		var ParentView: AssureIt.NodeView = ContextView.ParentShape;
		ContextView.IsArrowWhite = true;
		ContextView.AbsX = ParentView.AbsX + this.X_CONTEXT_MARGIN;
		ContextView.AbsY = ParentView.AbsY;
		if(ParentView.Source.Type == AssureIt.NodeType.Evidence) {
			ContextView.AbsY += (ParentView.Height() - ContextView.Height()) / 2;
		}
	}

	SetAllElementPosition(Element: AssureIt.NodeModel): void {
		var n: number = Element.Children.length;
		var ParentView: AssureIt.NodeView = this.ViewMap[Element.Label];
		var ContextIndex: number = this.GetContextIndex(Element);
		if (n == 0) {
			if(Element.Type == AssureIt.NodeType.Goal){
				(<AssureIt.GoalShape>ParentView.SVGShape).SetUndevelolpedSymbolPosition(ParentView.GetAbsoluteConnectorPosition(AssureIt.Direction.Bottom));
			}
			return;
		}

		if (n == 1 && ContextIndex == 0) {
			this.UpdateContextElementPosition(Element.Children[0]);
		}else{
			var xPositionSum: number = 0;

			for (var i: number = 0; i < n; i++) {
				this.SetAllElementPosition(Element.Children[i]);
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

		for (var i: number = 0; i < n; i++) {
			var ChildView = this.ViewMap[Element.Children[i].Label];
			if (ContextIndex == i) {
				var p1 = ParentView.GetAbsoluteConnectorPosition(AssureIt.Direction.Right);
				var p2 = ChildView.GetAbsoluteConnectorPosition(AssureIt.Direction.Left);
				var y = Math.min(p1.y, p2.y);
				p1.y = y;
				p2.y = y;
				ChildView.SetArrowPosition(p1, p2, AssureIt.Direction.Left);
				ChildView.IsArrowWhite = true;
			}else{
				var p1 = ParentView.GetAbsoluteConnectorPosition(AssureIt.Direction.Bottom);
				var p2 = ChildView.GetAbsoluteConnectorPosition(AssureIt.Direction.Top);
				ChildView.SetArrowPosition(p1, p2, AssureIt.Direction.Bottom);
			}

		}
	}

	CalculateMinPosition(ElementList: AssureIt.NodeModel[]): number {
		if (ElementList[0].Type == AssureIt.NodeType.Context) {
			var xPosition: number = this.ViewMap[ElementList[1].Label].AbsX;
		}
		else {
			var xPosition: number = this.ViewMap[ElementList[0].Label].AbsX;
		}
		var xPosition: number = this.ViewMap[ElementList[0].Label].AbsX;
		var n: number = ElementList.length;
		for (var i: number = 0; i < n; i++) {
			if (ElementList[i].Type == AssureIt.NodeType.Context) {
				continue;
			}
			if (xPosition > this.ViewMap[ElementList[i].Label].AbsX) {
				xPosition = this.ViewMap[ElementList[i].Label].AbsX;
			}
		}
		return xPosition;
	}

	CalculateMaxPosition(ElementList: AssureIt.NodeModel[]): number {
		if (ElementList[0].Type == AssureIt.NodeType.Context) {
			var xPosition: number = this.ViewMap[ElementList[1].Label].AbsX;
		}
		else {
			var xPosition: number = this.ViewMap[ElementList[0].Label].AbsX;
		}

		var n: number = ElementList.length;
		for (var i: number = 0; i < n; i++) {
			var ChildView: AssureIt.NodeView = this.ViewMap[ElementList[i].Label];
			if (ElementList[i].Type == AssureIt.NodeType.Context) {
				continue;
			}
			if (xPosition < ChildView.AbsX) {
				xPosition = ChildView.AbsX;
			}
		}
		return xPosition;
	}

	GetSameParent(LeftNodeView: AssureIt.NodeView, RightNodeView: AssureIt.NodeView): AssureIt.NodeView {
		var left: AssureIt.NodeView = LeftNodeView;

		while(left != null) {
			var right: AssureIt.NodeView = RightNodeView;
			while(right != null) {
				if(left.Source.Label == right.Source.Label) {
					return left;
				}
				right = right.ParentShape;
			}
			left = left.ParentShape;
		}
		throw "Cannot find same parent";
		return null;
	}

	SetFootElementPosition(): void {
		var n: number = this.footelement.length;
		for (var i: number = 0; i < n; i++) {
			var PreviousNodeView: AssureIt.NodeView = this.ViewMap[this.footelement[i - 1]];
			var CurrentNodeView: AssureIt.NodeView = this.ViewMap[this.footelement[i]];
			CurrentNodeView.AbsX = 0;
			if (i != 0) {
				var SameParent: AssureIt.NodeView = this.GetSameParent(PreviousNodeView, CurrentNodeView);
				var HasContext: boolean = PreviousNodeView.Source.HasContextAbove(SameParent.Source);
				if ((PreviousNodeView.ParentShape.Source.Label != CurrentNodeView.ParentShape.Source.Label) && HasContext) {
					var PreviousParentChildren: AssureIt.NodeModel[] = PreviousNodeView.ParentShape.Source.Children;
					var Min_xPosition: number = this.CalculateMinPosition(PreviousParentChildren);
					var Max_xPosition: number = this.CalculateMaxPosition(PreviousParentChildren);
					var HalfChildrenWidth: number = (Max_xPosition - Min_xPosition) / 2;
					if (HalfChildrenWidth > (this.X_CONTEXT_MARGIN - this.X_MULTI_ELEMENT_MARGIN)) {
						CurrentNodeView.AbsX += this.X_MULTI_ELEMENT_MARGIN;
					}
					else {
						CurrentNodeView.AbsX +=  this.X_CONTEXT_MARGIN - HalfChildrenWidth;
					}
				}
				if (PreviousNodeView.Source.HasContext() && (CurrentNodeView.AbsX - PreviousNodeView.AbsX) < this.X_MARGIN) {
					CurrentNodeView.AbsX += this.X_MARGIN;
				}

				CurrentNodeView.AbsX += (PreviousNodeView.AbsX + this.X_MARGIN);
				if(CurrentNodeView.AbsX - PreviousNodeView.AbsX > this.X_OVER_MARGIN) {
					CurrentNodeView.AbsX -= this.X_MARGIN;
				}
			}
		}
		return;
	}

	Traverse(Element: AssureIt.NodeModel, x: number, y: number) {
		if ((Element.Children.length == 0 && Element.Type != AssureIt.NodeType.Context) || (Element.Children.length == 1 && Element.Children[0].Type == AssureIt.NodeType.Context)) {
			this.footelement.push(Element.Label);
			return;
		}

		var i: number = 0;
		i = this.GetContextIndex(Element);
		if (i != -1) { //emit context element data
			var ContextView: AssureIt.NodeView = this.ViewMap[Element.Children[i].Label];
			var ParentView: AssureIt.NodeView = ContextView.ParentShape;
			var h1: number = ContextView.Height();
			var h2: number = ParentView.Height();
			var h: number = (h1 - h2) / 2;
			ContextView.AbsX += x;
			ContextView.AbsY += (y - h);
			ContextView.AbsX += this.X_CONTEXT_MARGIN;
			this.EmitChildrenElement(Element, ParentView.AbsX, ParentView.AbsY, i, ((this.Y_MARGIN > Math.abs(h1 - h2)) ? h2 : Math.abs(h1 - h2)));
		} else {  //emit element data except context
			var h2: number = 0;
			var CurrentView: AssureIt.NodeView = this.ViewMap[Element.Label];
			h2 = CurrentView.Height();
			this.EmitChildrenElement(Element, x, y, i, h2);
		}
	}

	EmitChildrenElement(Node: AssureIt.NodeModel, x: number, y: number, ContextId: number, h: number): void {
		var n: number = Node.Children.length;
		var MaxYPostition: number  = 0;
		for (var i: number = 0; i < n; i++) {
			var ElementView: AssureIt.NodeView = this.ViewMap[Node.Children[i].Label];
			var j: number = this.GetContextIndex(Node.Children[i]);
			var ContextHeight: number = 0;
			if(j != -1) {
				ContextHeight = this.ViewMap[Node.Children[i].Children[j].Label].Height();
			}
			if (ContextId == i) {
				continue;
			}
			else {
				var height: number = (ContextHeight > ElementView.Height()) ? ContextHeight : ElementView.Height();
				var ParentElementView: AssureIt.NodeView = this.ViewMap[Node.Label];
				ElementView.AbsY = y;
				ElementView.AbsY = y + this.Y_MARGIN + h;
				MaxYPostition = (ElementView.AbsY > MaxYPostition) ? ElementView.AbsY : MaxYPostition;
				this.Traverse(Node.Children[i], ElementView.AbsX, ElementView.AbsY);
			}
		}
		for (var i: number = 0; i < n; i++) {
			var ElementView: AssureIt.NodeView = this.ViewMap[Node.Children[i].Label];
			if (ContextId == i) {
				continue;
			}
			else {
				ElementView.AbsY = MaxYPostition;
			}
		}
		return;
	}
}
