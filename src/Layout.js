var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var LayoutEngine = (function () {
    function LayoutEngine(ViewMap) {
        this.ViewMap = ViewMap;
    }
    LayoutEngine.prototype.Init = function (Element, x, y) {
    };

    LayoutEngine.prototype.Traverse = function (Element, x, y) {
    };

    LayoutEngine.prototype.SetFootElementPosition = function () {
    };

    LayoutEngine.prototype.SetAllElementPosition = function (Element) {
    };

    LayoutEngine.prototype.GetContextIndex = function (Node) {
        for (var i = 0; i < Node.Children.length; i++) {
            if (Node.Children[i].Type == CaseType.Context) {
                return i;
            }
        }
        return -1;
    };
    return LayoutEngine;
})();

var LayoutLandscape = (function (_super) {
    __extends(LayoutLandscape, _super);
    function LayoutLandscape(ViewMap) {
        _super.call(this, ViewMap);
        this.ViewMap = ViewMap;
        this.LeafNodeNames = new Array();
        this.CONTEXT_MARGIN = 140;
        this.X_MARGIN = 200;
        this.Y_MARGIN = 180;
    }
    LayoutLandscape.prototype.Traverse = function (Element, Depth, x) {
        this.SetXpos(Element, Depth);
        this.SetLeafYpos(Element);
        this.SetOtherYpos(Element);
    };

    LayoutLandscape.prototype.SetXpos = function (Element, Depth) {
        if (Element.Type == CaseType.Context) {
            Depth -= 1;
        }

        this.SetVector(Element);

        this.ViewMap[Element.Label].AbsX = Depth * this.X_MARGIN;

        if (Element.Children.length == 0) {
            if (Element.Type != CaseType.Context) {
                this.LeafNodeNames.push(Element.Label);
            }
        } else if (Element.Children.length == 1) {
            if (Element.Children[0].Type == CaseType.Context) {
                this.LeafNodeNames.push(Element.Label);
            }
        }

        for (var i = 0; i < Element.Children.length; i++) {
            this.SetXpos(Element.Children[i], Depth + 1);
        }
        return;
    };

    LayoutLandscape.prototype.SetVector = function (Element) {
        var CaseView = this.ViewMap[Element.Label];
        if (Element.Type == CaseType.Context) {
            CaseView.ParentDirection = Direction.Bottom;
            CaseView.IsArrowReversed = true;
        } else {
            CaseView.ParentDirection = Direction.Left;
        }
        return;
    };

    LayoutLandscape.prototype.SetLeafYpos = function (Element) {
        for (var i = 1; i < this.LeafNodeNames.length; i++) {
            if (this.ViewMap[this.LeafNodeNames[i]].Source.Children.length == 1 && this.ViewMap[this.LeafNodeNames[i]].Source.Type != CaseType.Context) {
                this.ViewMap[this.LeafNodeNames[i]].AbsY += this.ViewMap[this.LeafNodeNames[i - 1]].AbsY + this.Y_MARGIN * 2;
            } else {
                this.ViewMap[this.LeafNodeNames[i]].AbsY += this.ViewMap[this.LeafNodeNames[i - 1]].AbsY + this.Y_MARGIN;
            }
        }
    };

    LayoutLandscape.prototype.SetOtherYpos = function (Element) {
        if (Element.Children.length == 0) {
            return;
        }

        if (Element.Children.length == 1 && Element.Children[0].Type == CaseType.Context) {
            this.ViewMap[Element.Children[0].Label].AbsY = (this.ViewMap[Element.Label].AbsY - this.CONTEXT_MARGIN);
            return;
        }

        for (var i = 0; i < Element.Children.length; i++) {
            this.SetOtherYpos(Element.Children[i]);
        }

        var IntermediatePos = 0;

        var ContextIndex = this.GetContextIndex(Element);

        IntermediatePos = this.CalcIntermediatePos(Element, ContextIndex);

        if (ContextIndex == -1) {
            if (Element.Children.length == 1 && Element.Children[0].Type == CaseType.Evidence) {
                this.ViewMap[Element.Label].AbsY = this.ViewMap[Element.Children[0].Label].AbsY + 15;
            } else {
                this.ViewMap[Element.Label].AbsY = IntermediatePos;
            }
        } else {
            this.ViewMap[Element.Label].AbsY = IntermediatePos;
            this.ViewMap[Element.Children[ContextIndex].Label].AbsY = this.ViewMap[Element.Label].AbsY - this.CONTEXT_MARGIN;
        }
        return;
    };

    LayoutLandscape.prototype.CalcIntermediatePos = function (Element, ContextIndex) {
        var ChildLen = Element.Children.length;

        if (ContextIndex == ChildLen - 1) {
            return (this.ViewMap[Element.Children[0].Label].AbsY + (this.ViewMap[Element.Children[ChildLen - 2].Label].AbsY - this.ViewMap[Element.Children[0].Label].AbsY) / 2);
        } else if (ContextIndex == 0) {
            return (this.ViewMap[Element.Children[1].Label].AbsY + (this.ViewMap[Element.Children[ChildLen - 1].Label].AbsY - this.ViewMap[Element.Children[1].Label].AbsY) / 2);
        } else {
            return (this.ViewMap[Element.Children[0].Label].AbsY + (this.ViewMap[Element.Children[ChildLen - 1].Label].AbsY - this.ViewMap[Element.Children[0].Label].AbsY) / 2);
        }
    };
    return LayoutLandscape;
})(LayoutEngine);

var LayoutPortrait = (function (_super) {
    __extends(LayoutPortrait, _super);
    function LayoutPortrait(ViewMap) {
        _super.call(this, ViewMap);
        this.ViewMap = ViewMap;
        this.X_MARGIN = 200;
        this.Y_MARGIN = 160;
        this.X_CONTEXT_MARGIN = 200;
        this.X_FOOT_MARGIN = 100;
        this.X_MULTI_ELEMENT_MARGIN = 20;
        this.footelement = new Array();
        this.contextId = -1;
    }
    LayoutPortrait.prototype.UpdateContextElementPosition = function (ContextElement) {
        var ContextView = this.ViewMap[ContextElement.Label];
        var ParentView = ContextView.ParentShape;
        var h1 = ContextView.HTMLDoc.Height;
        var h2 = ParentView.HTMLDoc.Height;
        ContextView.ParentDirection = Direction.Left;
        ContextView.IsArrowReversed = true;
        ContextView.AbsX = (ParentView.AbsX + this.X_CONTEXT_MARGIN);
        ContextView.AbsY = (ParentView.AbsY - (h1 - h2) / 2);
    };

    LayoutPortrait.prototype.SetAllElementPosition = function (Element) {
        var n = Element.Children.length;
        if (n == 0) {
            return;
        }
        var ParentView = this.ViewMap[Element.Label];

        if (n == 1 && Element.Children[0].Type == CaseType.Context) {
            this.UpdateContextElementPosition(Element.Children[0]);
            return;
        }

        for (var i = 0; i < n; i++) {
            this.SetAllElementPosition(Element.Children[i]);
        }

        var ContextIndex = this.GetContextIndex(Element);
        var xPositionSum = 0;
        for (var i = 0; i < n; i++) {
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
    };

    LayoutPortrait.prototype.CalculateMinPosition = function (ElementList) {
        if (ElementList[0].Type == CaseType.Context) {
            var xPosition = this.ViewMap[ElementList[1].Label].AbsX;
        } else {
            var xPosition = this.ViewMap[ElementList[0].Label].AbsX;
        }
        var n = ElementList.length;
        for (var i = 0; i < n; i++) {
            console.log(this.ViewMap[ElementList[i].Label].AbsX);
            if (ElementList[i].Type == CaseType.Context) {
                continue;
            }
            if (xPosition > this.ViewMap[ElementList[i].Label].AbsX) {
                xPosition = this.ViewMap[ElementList[i].Label].AbsX;
            }
        }
        return xPosition;
    };

    LayoutPortrait.prototype.CalculateMaxPosition = function (ElementList) {
        if (ElementList[0].Type == CaseType.Context) {
            var xPosition = this.ViewMap[ElementList[1].Label].AbsX;
        } else {
            var xPosition = this.ViewMap[ElementList[0].Label].AbsX;
        }

        var n = ElementList.length;
        for (var i = 0; i < n; i++) {
            var ChildView = this.ViewMap[ElementList[i].Label];
            if (ElementList[i].Type == CaseType.Context) {
                continue;
            }
            if (xPosition < ChildView.AbsX) {
                xPosition = ChildView.AbsX;
            }
        }
        return xPosition;
    };

    LayoutPortrait.prototype.SetFootElementPosition = function () {
        var n = this.footelement.length;
        for (var i = 0; i < n; i++) {
            var PreviousElementShape = this.ViewMap[this.footelement[i - 1]];
            var CurrentElementShape = this.ViewMap[this.footelement[i]];
            CurrentElementShape.AbsX = 0;
            if (i != 0) {
                if ((PreviousElementShape.ParentShape.Source.Label != CurrentElementShape.ParentShape.Source.Label) && (this.GetContextIndex(PreviousElementShape.ParentShape.Source) != -1)) {
                    var PreviousParentChildren = PreviousElementShape.ParentShape.Source.Children;
                    var Min_xPosition = this.CalculateMinPosition(PreviousParentChildren);
                    var Max_xPosition = this.CalculateMaxPosition(PreviousParentChildren);
                    var ArgumentMargin = (Max_xPosition - Min_xPosition) / 2;
                    if (ArgumentMargin > (this.X_CONTEXT_MARGIN - this.X_MULTI_ELEMENT_MARGIN)) {
                        CurrentElementShape.AbsX += this.X_MULTI_ELEMENT_MARGIN;
                    } else {
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
    };

    LayoutPortrait.prototype.Init = function (Element, x, y) {
        this.ViewMap[Element.Label].AbsY += y;
    };

    LayoutPortrait.prototype.Traverse = function (Element, x, y) {
        if ((Element.Children.length == 0 && Element.Type != CaseType.Context) || (Element.Children.length == 1 && Element.Children[0].Type == CaseType.Context)) {
            this.footelement.push(Element.Label);
            return;
        }

        var i = 0;
        i = this.GetContextIndex(Element);
        if (i != -1) {
            var ContextView = this.ViewMap[Element.Children[i].Label];
            var ParentView = ContextView.ParentShape;
            var h1 = ContextView.HTMLDoc.Height;
            var h2 = ParentView.HTMLDoc.Height;
            var h = (h1 - h2) / 2;
            ContextView.ParentDirection = Direction.Left;
            ContextView.AbsX += x;
            ContextView.AbsY += (y - h);
            ContextView.AbsX += this.X_CONTEXT_MARGIN;
            this.EmitChildrenElement(Element, ParentView.AbsX, ParentView.AbsY, i);
        } else {
            this.EmitChildrenElement(Element, x, y, i);
        }
    };

    LayoutPortrait.prototype.EmitChildrenElement = function (Node, x, y, ContextId) {
        var n = Node.Children.length;
        for (var i = 0; i < n; i++) {
            var ElementView = this.ViewMap[Node.Children[i].Label];
            if (ContextId == i) {
                continue;
            } else {
                ElementView.AbsY = y;
                ElementView.AbsY += this.Y_MARGIN;
                this.Traverse(Node.Children[i], ElementView.AbsX, ElementView.AbsY);
            }
        }
        return;
    };
    return LayoutPortrait;
})(LayoutEngine);
