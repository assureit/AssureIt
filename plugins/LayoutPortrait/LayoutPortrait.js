var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var LayoutPortraitPlugIn = (function (_super) {
    __extends(LayoutPortraitPlugIn, _super);
    function LayoutPortraitPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.LayoutEnginePlugIn = new LayoutPortraitEnginePlugIn(plugInManager);
    }
    return LayoutPortraitPlugIn;
})(AssureIt.PlugInSet);

var LayoutPortraitEnginePlugIn = (function (_super) {
    __extends(LayoutPortraitEnginePlugIn, _super);
    function LayoutPortraitEnginePlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.ElementWidth = 50;
        this.X_MARGIN = 200;
        this.Y_MARGIN = 150;
        this.Y_ADJUSTMENT_MARGIN = 50;
        this.Y_NODE_MARGIN = 205;
        this.Y_NODE_ADJUSTMENT_MARGIN = 70;
        this.X_CONTEXT_MARGIN = 200;
        this.X_OVER_MARGIN = 700;
        this.X_FOOT_MARGIN = 100;
        this.X_MULTI_ELEMENT_MARGIN = 20;
        this.footelement = [];
        this.contextId = -1;
    }
    LayoutPortraitEnginePlugIn.prototype.Init = function (ViewMap, Element, x, y, ElementWidth) {
        this.footelement = [];
        this.contextId = -1;
        this.ElementWidth = ElementWidth;
        this.ViewMap = ViewMap;
        this.ViewMap[Element.Label].AbsY += y;
        this.X_MARGIN = ElementWidth + 50;
        this.X_CONTEXT_MARGIN = ElementWidth + 50;
    };

    LayoutPortraitEnginePlugIn.prototype.LayoutAllView = function (Element, x, y) {
        this.Traverse(Element, x, y);
        this.SetFootElementPosition();
        this.SetAllElementPosition(Element);
    };

    LayoutPortraitEnginePlugIn.prototype.UpdateContextElementPosition = function (ContextElement) {
        var ContextView = this.ViewMap[ContextElement.Label];
        var ParentView = ContextView.ParentShape;
        ContextView.IsArrowWhite = true;
        ContextView.AbsX = (ParentView.AbsX + this.X_CONTEXT_MARGIN);
        if (ParentView.Source.Type == AssureIt.NodeType.Evidence) {
            var ContextHeight = ContextView.Height();
            var ParentHeight = ParentView.Height();
            var HeightDiffAve = (ParentHeight - ContextHeight) / 2;
            ContextView.AbsY = ParentView.AbsY + HeightDiffAve;
        } else {
            ContextView.AbsY = ParentView.AbsY;
        }
    };

    LayoutPortraitEnginePlugIn.prototype.SetAllElementPosition = function (Element) {
        var n = Element.Children.length;
        var ParentView = this.ViewMap[Element.Label];
        var ContextIndex = this.GetContextIndex(Element);
        if (n == 0) {
            if (Element.Type == AssureIt.NodeType.Goal) {
                (ParentView.SVGShape).SetUndevelolpedSymbolPosition(ParentView.GetAbsoluteConnectorPosition(AssureIt.Direction.Bottom));
            }
            return;
        }

        if (n == 1 && ContextIndex == 0) {
            this.UpdateContextElementPosition(Element.Children[0]);
        } else {
            var xPositionSum = 0;

            for (var i = 0; i < n; i++) {
                this.SetAllElementPosition(Element.Children[i]);
                if (ContextIndex != i) {
                    xPositionSum += this.ViewMap[Element.Children[i].Label].AbsX;
                }
            }

            if (ContextIndex == -1) {
                ParentView.AbsX = xPositionSum / n;
            } else {
                ParentView.AbsX = xPositionSum / (n - 1);
                this.UpdateContextElementPosition(Element.Children[ContextIndex]);
            }
        }

        for (var i = 0; i < n; i++) {
            var ChildView = this.ViewMap[Element.Children[i].Label];
            if (ContextIndex == i) {
                var p1 = ParentView.GetAbsoluteConnectorPosition(AssureIt.Direction.Right);
                var p2 = ChildView.GetAbsoluteConnectorPosition(AssureIt.Direction.Left);
                var y = Math.min(p1.y, p2.y);
                p1.y = y;
                p2.y = y;
                ChildView.SetArrowPosition(p1, p2, AssureIt.Direction.Left);
                ChildView.IsArrowWhite = true;
            } else {
                var p1 = ParentView.GetAbsoluteConnectorPosition(AssureIt.Direction.Bottom);
                var p2 = ChildView.GetAbsoluteConnectorPosition(AssureIt.Direction.Top);
                ChildView.SetArrowPosition(p1, p2, AssureIt.Direction.Bottom);
            }
        }
    };

    LayoutPortraitEnginePlugIn.prototype.CalculateMinPosition = function (ElementList) {
        if (ElementList[0].Type == AssureIt.NodeType.Context) {
            var xPosition = this.ViewMap[ElementList[1].Label].AbsX;
        } else {
            var xPosition = this.ViewMap[ElementList[0].Label].AbsX;
        }
        var xPosition = this.ViewMap[ElementList[0].Label].AbsX;
        var n = ElementList.length;
        for (var i = 0; i < n; i++) {
            if (ElementList[i].Type == AssureIt.NodeType.Context) {
                continue;
            }
            if (xPosition > this.ViewMap[ElementList[i].Label].AbsX) {
                xPosition = this.ViewMap[ElementList[i].Label].AbsX;
            }
        }
        return xPosition;
    };

    LayoutPortraitEnginePlugIn.prototype.CalculateMaxPosition = function (ElementList) {
        if (ElementList[0].Type == AssureIt.NodeType.Context) {
            var xPosition = this.ViewMap[ElementList[1].Label].AbsX;
        } else {
            var xPosition = this.ViewMap[ElementList[0].Label].AbsX;
        }

        var n = ElementList.length;
        for (var i = 0; i < n; i++) {
            var ChildView = this.ViewMap[ElementList[i].Label];
            if (ElementList[i].Type == AssureIt.NodeType.Context) {
                continue;
            }
            if (xPosition < ChildView.AbsX) {
                xPosition = ChildView.AbsX;
            }
        }
        return xPosition;
    };

    LayoutPortraitEnginePlugIn.prototype.GetSameParent = function (LeftNodeView, RightNodeView) {
        var left = LeftNodeView;

        while (left != null) {
            var right = RightNodeView;
            while (right != null) {
                if (left.Source.Label == right.Source.Label) {
                    return left;
                }
                right = right.ParentShape;
            }
            left = left.ParentShape;
        }
        throw "Cannot find same parent";
        return null;
    };

    LayoutPortraitEnginePlugIn.prototype.SetFootElementPosition = function () {
        var n = this.footelement.length;
        for (var i = 0; i < n; i++) {
            var PreviousNodeView = this.ViewMap[this.footelement[i - 1]];
            var CurrentNodeView = this.ViewMap[this.footelement[i]];
            CurrentNodeView.AbsX = 0;
            if (i != 0) {
                var SameParent = this.GetSameParent(PreviousNodeView, CurrentNodeView);
                var HasContext = PreviousNodeView.Source.HasContextAbove(SameParent.Source);
                if ((PreviousNodeView.ParentShape.Source.Label != CurrentNodeView.ParentShape.Source.Label) && HasContext) {
                    var PreviousParentChildren = PreviousNodeView.ParentShape.Source.Children;
                    var Min_xPosition = this.CalculateMinPosition(PreviousParentChildren);
                    var Max_xPosition = this.CalculateMaxPosition(PreviousParentChildren);
                    var HalfChildrenWidth = (Max_xPosition - Min_xPosition) / 2;
                    if (HalfChildrenWidth > (this.X_CONTEXT_MARGIN - this.X_MULTI_ELEMENT_MARGIN)) {
                        CurrentNodeView.AbsX += this.X_MULTI_ELEMENT_MARGIN;
                    } else {
                        CurrentNodeView.AbsX += this.X_CONTEXT_MARGIN - HalfChildrenWidth;
                    }
                }
                if (PreviousNodeView.Source.HasContext() && (CurrentNodeView.AbsX - PreviousNodeView.AbsX) < this.X_MARGIN) {
                    CurrentNodeView.AbsX += this.X_MARGIN;
                }

                CurrentNodeView.AbsX += (PreviousNodeView.AbsX + this.X_MARGIN);
                if (CurrentNodeView.AbsX - PreviousNodeView.AbsX > this.X_OVER_MARGIN) {
                    CurrentNodeView.AbsX -= this.X_MARGIN;
                }
            }
        }
        return;
    };

    LayoutPortraitEnginePlugIn.prototype.Traverse = function (Element, x, y) {
        if ((Element.Children.length == 0 && Element.Type != AssureIt.NodeType.Context) || (Element.Children.length == 1 && Element.Children[0].Type == AssureIt.NodeType.Context)) {
            this.footelement.push(Element.Label);
            return;
        }

        var i = 0;
        i = this.GetContextIndex(Element);
        if (i != -1) {
            var ContextView = this.ViewMap[Element.Children[i].Label];
            var ParentView = ContextView.ParentShape;
            var h1 = ContextView.Height();
            var h2 = ParentView.Height();
            var h = (h1 - h2) / 2;
            ContextView.AbsX += x;
            ContextView.AbsY += (y - h);
            ContextView.AbsX += this.X_CONTEXT_MARGIN;
            this.EmitChildrenElement(Element, ParentView.AbsX, ParentView.AbsY, i, ((this.Y_MARGIN > Math.abs(h1 - h2)) ? h2 : Math.abs(h1 - h2)));
        } else {
            var h2 = 0;
            var CurrentView = this.ViewMap[Element.Label];
            h2 = CurrentView.Height();
            this.EmitChildrenElement(Element, x, y, i, h2);
        }
    };

    LayoutPortraitEnginePlugIn.prototype.EmitChildrenElement = function (Node, x, y, ContextId, h) {
        var n = Node.Children.length;
        var MaxYPostition = 0;
        for (var i = 0; i < n; i++) {
            var ElementView = this.ViewMap[Node.Children[i].Label];
            var j = this.GetContextIndex(Node.Children[i]);
            var ContextHeight = 0;
            if (j != -1) {
                ContextHeight = this.ViewMap[Node.Children[i].Children[j].Label].Height();
            }
            if (ContextId == i) {
                continue;
            } else {
                var height = (ContextHeight > ElementView.Height()) ? ContextHeight : ElementView.Height();
                var ParentElementView = this.ViewMap[Node.Label];
                ElementView.AbsY = y;
                ElementView.AbsY = y + this.Y_MARGIN + h;
                MaxYPostition = (ElementView.AbsY > MaxYPostition) ? ElementView.AbsY : MaxYPostition;
                this.Traverse(Node.Children[i], ElementView.AbsX, ElementView.AbsY);
            }
        }
        for (var i = 0; i < n; i++) {
            var ElementView = this.ViewMap[Node.Children[i].Label];
            if (ContextId == i) {
                continue;
            } else {
                ElementView.AbsY = MaxYPostition;
            }
        }
        return;
    };
    return LayoutPortraitEnginePlugIn;
})(AssureIt.LayoutEnginePlugIn);
