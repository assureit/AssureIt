/// <reference path="CaseModel.ts" />
/// <reference path="CaseViewer.ts" />
/* Layout.ts is deprecated. */
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var AssureIt;
(function (AssureIt) {
    var LayoutEngine = (function () {
        function LayoutEngine(ViewMap) {
            this.ViewMap = ViewMap;
        }
        LayoutEngine.prototype.Init = function (Element, x, y, ElementWidth) {
        };

        LayoutEngine.prototype.LayoutAllView = function (Element, x, y) {
        };

        LayoutEngine.prototype.GetContextIndex = function (Node) {
            for (var i = 0; i < Node.Children.length; i++) {
                if (Node.Children[i].Type == AssureIt.NodeType.Context) {
                    return i;
                }
            }
            return -1;
        };
        return LayoutEngine;
    })();
    AssureIt.LayoutEngine = LayoutEngine;

    //	export class LayoutLandscape extends LayoutEngine {
    //		//	var CaseArray : any[];
    //		//	footelement : string[] = new Array();
    //		//	contextId : number = -1;
    //		LeafNodeNames: string[] = new Array();
    //		CONTEXT_MARGIN: number = 140;
    //
    //		constructor(public ViewMap: { [index: string]: NodeView; }) {
    //			super(ViewMap);
    //			this.X_MARGIN = 200;
    //			this.Y_MARGIN = 180;
    //		}
    //
    //		Traverse(Element: NodeModel, Depth: number, x: number): void {
    //			this.SetXpos(Element, Depth);
    //			this.SetLeafYpos(Element);
    //			this.SetOtherYpos(Element);
    //		}
    //
    //		SetXpos(Element: NodeModel, Depth: number): void {
    //			if (Element.Type == NodeType.Context) {
    //				Depth -= 1;
    //			}
    //
    //			this.SetVector(Element);
    //
    //			this.ViewMap[Element.Label].AbsX = Depth * this.X_MARGIN;
    //
    //			if (Element.Children.length == 0) {
    //				if (Element.Type != NodeType.Context) {//
    //					this.LeafNodeNames.push(Element.Label);
    //				}
    //			} else if (Element.Children.length == 1) {
    //				if (Element.Children[0].Type == NodeType.Context) {
    //					this.LeafNodeNames.push(Element.Label);//if not Context
    //				}
    //			}
    //
    //			for (var i: number = 0; i < Element.Children.length; i++) {
    //				this.SetXpos(Element.Children[i], Depth + 1);
    //			}
    //			return;
    //		}
    //
    //		SetVector(Element: NodeModel): void {
    //			var CaseView = this.ViewMap[Element.Label];
    //			if (Element.Type == NodeType.Context) {
    //				CaseView.ParentDirection = Direction.Bottom;
    //				CaseView.IsArrowReversed = true;
    //				CaseView.IsArrowStraight = true;
    //				CaseView.IsArrowWhite = true;
    //			} else {
    //				CaseView.ParentDirection = Direction.Left;
    //			}
    //			return;
    //		}
    //
    //		SetLeafYpos(Element: NodeModel): void {
    //			for (var i: number = 1; i < this.LeafNodeNames.length; i++) {
    //				if (this.ViewMap[this.LeafNodeNames[i]].Source.Children.length == 1 && this.ViewMap[this.LeafNodeNames[i]].Source.Type != NodeType.Context) {
    //					this.ViewMap[this.LeafNodeNames[i]].AbsY += this.ViewMap[this.LeafNodeNames[i - 1]].AbsY +
    //					this.Y_MARGIN * 2;
    //				} else {
    //					this.ViewMap[this.LeafNodeNames[i]].AbsY += this.ViewMap[this.LeafNodeNames[i - 1]].AbsY +
    //					this.Y_MARGIN;
    //				}
    //			}
    //		}
    //
    //		SetOtherYpos(Element: NodeModel): void {
    //			if (Element.Children.length == 0) {
    //				return;
    //			}
    //
    //			if (Element.Children.length == 1 && Element.Children[0].Type == NodeType.Context) {
    //				this.ViewMap[Element.Children[0].Label].AbsY = (this.ViewMap[Element.Label].AbsY - this.CONTEXT_MARGIN);
    //				return;
    //			}
    //
    //			for (var i: number = 0; i < Element.Children.length; i++) {
    //				this.SetOtherYpos(Element.Children[i]);
    //			}
    //
    //			var IntermediatePos: number = 0;
    //
    //			var ContextIndex: number = this.GetContextIndex(Element);
    //
    //			IntermediatePos = this.CalcIntermediatePos(Element, ContextIndex);
    //
    //			if (ContextIndex == -1) {
    //				if (Element.Children.length == 1 && Element.Children[0].Type == NodeType.Evidence) {
    //					this.ViewMap[Element.Label].AbsY = this.ViewMap[Element.Children[0].Label].AbsY + 15;
    //				}
    //				else {
    //					this.ViewMap[Element.Label].AbsY = IntermediatePos;
    //				}
    //			} else {
    //				this.ViewMap[Element.Label].AbsY = IntermediatePos;
    //				this.ViewMap[Element.Children[ContextIndex].Label].AbsY = this.ViewMap[Element.Label].AbsY - this.CONTEXT_MARGIN;
    //			}
    //			return;
    //		}
    //
    //		CalcIntermediatePos(Element: NodeModel, ContextIndex: number): number {
    //			var ChildLen = Element.Children.length;
    //
    //			if (ContextIndex == ChildLen - 1) {
    //				return (this.ViewMap[Element.Children[0].Label].AbsY
    //					+ (this.ViewMap[Element.Children[ChildLen - 2].Label].AbsY
    //					- this.ViewMap[Element.Children[0].Label].AbsY) / 2);
    //			}
    //			else if (ContextIndex == 0) {
    //				return (this.ViewMap[Element.Children[1].Label].AbsY
    //					+ (this.ViewMap[Element.Children[ChildLen - 1].Label].AbsY
    //					- this.ViewMap[Element.Children[1].Label].AbsY) / 2);
    //			}
    //			else {
    //				return (this.ViewMap[Element.Children[0].Label].AbsY
    //					+ (this.ViewMap[Element.Children[ChildLen - 1].Label].AbsY
    //					- this.ViewMap[Element.Children[0].Label].AbsY) / 2);
    //			}
    //		}
    //	}
    var LayoutPortrait = (function (_super) {
        __extends(LayoutPortrait, _super);
        function LayoutPortrait(ViewMap) {
            _super.call(this, ViewMap);
            this.ViewMap = ViewMap;
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
            this.footelement = new Array();
            this.contextId = -1;
        }
        LayoutPortrait.prototype.UpdateContextElementPosition = function (ContextElement) {
            var ContextView = this.ViewMap[ContextElement.Label];
            var ParentView = ContextView.ParentShape;
            ContextView.IsArrowWhite = true;
            ContextView.AbsX = (ParentView.AbsX + this.X_CONTEXT_MARGIN);
            ContextView.AbsY = ParentView.AbsY;
        };

        LayoutPortrait.prototype.SetAllElementPosition = function (Element) {
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

        LayoutPortrait.prototype.CalculateMinPosition = function (ElementList) {
            if (ElementList[0].Type == AssureIt.NodeType.Context) {
                var xPosition = this.ViewMap[ElementList[1].Label].AbsX;
            } else {
                var xPosition = this.ViewMap[ElementList[0].Label].AbsX;
            }

            //			var xPosition: number = this.ViewMap[ElementList[0].Label].AbsX;
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

        LayoutPortrait.prototype.CalculateMaxPosition = function (ElementList) {
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

        LayoutPortrait.prototype.GetSameParentLabel = function (PreviousNodeView, CurrentNodeView) {
            var PreviousParentShape = PreviousNodeView.ParentShape;
            var CurrentParentShape = CurrentNodeView.ParentShape;
            var PreviousParentArray = [];
            var CurrentParentArray = [];

            while (PreviousParentShape != null) {
                PreviousParentArray.push(PreviousParentShape.Source.Label);
                PreviousParentShape = PreviousParentShape.ParentShape;
            }
            while (CurrentParentShape != null) {
                CurrentParentArray.push(CurrentParentShape.Source.Label);
                CurrentParentShape = CurrentParentShape.ParentShape;
            }
            var PreviousParentLength = PreviousParentArray.length;
            var CurrentParentLength = CurrentParentArray.length;
            for (var i = 0; i < PreviousParentLength; i++) {
                for (var j = 0; j < CurrentParentLength; j++) {
                    if (PreviousParentArray[i] == CurrentParentArray[j]) {
                        return PreviousParentArray[i];
                    }
                }
            }
            return null;
        };

        LayoutPortrait.prototype.HasContextinParentNode = function (PreviousNodeView, SameParentLabel) {
            var PreviousParentShape = PreviousNodeView.ParentShape;
            while (PreviousParentShape != null) {
                if (PreviousParentShape.Source.Label == SameParentLabel) {
                    break;
                }
                if (this.GetContextIndex(PreviousParentShape.Source) != -1) {
                    return true;
                }
                PreviousParentShape = PreviousParentShape.ParentShape;
            }
            return false;
        };

        LayoutPortrait.prototype.SetFootElementPosition = function () {
            var n = this.footelement.length;
            for (var i = 0; i < n; i++) {
                var PreviousNodeView = this.ViewMap[this.footelement[i - 1]];
                var CurrentNodeView = this.ViewMap[this.footelement[i]];
                CurrentNodeView.AbsX = 0;
                if (i != 0) {
                    var SameParentLabel = this.GetSameParentLabel(PreviousNodeView, CurrentNodeView);
                    var HasContext = this.HasContextinParentNode(PreviousNodeView, SameParentLabel);
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
                    if (this.GetContextIndex(PreviousNodeView.Source) != -1 && (CurrentNodeView.AbsX - PreviousNodeView.AbsX) < this.X_MARGIN) {
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

        LayoutPortrait.prototype.Init = function (Element, x, y, ElementWidth) {
            this.ViewMap[Element.Label].AbsY += y;
            this.X_MARGIN = ElementWidth + 50;
            this.X_CONTEXT_MARGIN = ElementWidth + 50;
        };

        LayoutPortrait.prototype.Traverse = function (Element, x, y) {
            if ((Element.Children.length == 0 && Element.Type != AssureIt.NodeType.Context) || (Element.Children.length == 1 && Element.Children[0].Type == AssureIt.NodeType.Context)) {
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

                //ContextView.ParentDirection = Direction.Left;
                ContextView.AbsX += x;
                ContextView.AbsY += (y - h);
                ContextView.AbsX += this.X_CONTEXT_MARGIN;

                //				this.EmitChildrenElement(Element, ParentView.AbsX, ParentView.AbsY, i, ((this.Y_MARGIN > Math.abs(h1 - h2)) ? 0 : Math.abs(h1 - h2)));
                this.EmitChildrenElement(Element, ParentView.AbsX, ParentView.AbsY, i, ((this.Y_MARGIN > Math.abs(h1 - h2)) ? h2 : Math.abs(h1 - h2)));
            } else {
                var h2 = 0;
                var CurrentView = this.ViewMap[Element.Label];

                //				if(ParentView != null) {
                //					h2 = ParentView.HTMLDoc.Height/2;
                //				}
                h2 = CurrentView.HTMLDoc.Height;
                this.EmitChildrenElement(Element, x, y, i, h2);
            }
        };

        LayoutPortrait.prototype.LayoutAllView = function (Element, x, y) {
            this.Traverse(Element, x, y);
            this.SetFootElementPosition();
            this.SetAllElementPosition(Element);
        };

        LayoutPortrait.prototype.EmitChildrenElement = function (Node, x, y, ContextId, h) {
            var n = Node.Children.length;
            var MaxYPostition = 0;
            for (var i = 0; i < n; i++) {
                var ElementView = this.ViewMap[Node.Children[i].Label];
                var j = this.GetContextIndex(Node.Children[i]);
                var ContextHeight = 0;
                if (j != -1) {
                    ContextHeight = this.ViewMap[Node.Children[i].Children[j].Label].HTMLDoc.Height;
                }
                if (ContextId == i) {
                    continue;
                } else {
                    var height = (ContextHeight > ElementView.HTMLDoc.Height) ? ContextHeight : ElementView.HTMLDoc.Height;
                    var ParentElementView = this.ViewMap[Node.Label];
                    ElementView.AbsY = y;

                    //					ElementView.AbsY += ((height > this.Y_MARGIN) ? height : this.Y_MARGIN) + h;
                    ElementView.AbsY = y + this.Y_MARGIN + h;

                    //					ElementView.AbsY += (((ElementView.AbsY - ParentElementView.AbsY) < this.Y_NODE_MARGIN) ? this.Y_NODE_ADJUSTMENT_MARGIN : 0);
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
        return LayoutPortrait;
    })(LayoutEngine);
    AssureIt.LayoutPortrait = LayoutPortrait;
})(AssureIt || (AssureIt = {}));
