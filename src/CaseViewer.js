var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var HTMLDoc = (function () {
    function HTMLDoc() {
        this.Width = 0;
        this.Height = 0;
    }
    HTMLDoc.prototype.Render = function (Viewer, CaseModel) {
        if (this.DocBase != null) {
            var parent = this.DocBase.parent();
            if (parent != null)
                parent.remove(this.DocBase);
        }
        this.DocBase = $('<div class="node">').css("position", "absolute");
        this.DocBase.append($('<h4>' + CaseModel.Label + '</h4>'));
        this.DocBase.append($('<p>' + CaseModel.Statement + '</p>'));
        this.InvokePlugInHTMLRender(Viewer, CaseModel, this.DocBase);
        this.UpdateWidth(Viewer, CaseModel);
        this.Resize(Viewer, CaseModel);
    };

    HTMLDoc.prototype.UpdateWidth = function (Viewer, Source) {
        this.DocBase.width(CaseViewer.ElementWidth);
        switch (Source.Type) {
            case CaseType.Goal:
                this.DocBase.css("padding", "5px 10px");
                break;
            case CaseType.Context:
                this.DocBase.css("padding", "10px 10px");
                break;
            case CaseType.Strategy:
                this.DocBase.css("padding", "5px 20px");
                break;
            case CaseType.Evidence:
            default:
                this.DocBase.css("padding", "20px 20px");
                break;
        }
        this.DocBase.width(CaseViewer.ElementWidth * 2 - this.DocBase.outerWidth());
    };

    HTMLDoc.prototype.InvokePlugInHTMLRender = function (caseViewer, caseModel, DocBase) {
        var pluginMap = caseViewer.pluginManager.HTMLRenderPlugInMap;
        for (var key in pluginMap) {
            var render = caseViewer.GetPlugInHTMLRender(key);
            render(caseViewer, caseModel, DocBase);
        }
    };

    HTMLDoc.prototype.Resize = function (Viewer, Source) {
        this.Width = this.DocBase ? this.DocBase.outerWidth() : 0;
        this.Height = this.DocBase ? this.DocBase.outerHeight() : 0;
    };

    HTMLDoc.prototype.SetPosition = function (x, y) {
        this.DocBase.css({ left: x + "px", top: y + "px" });
    };
    return HTMLDoc;
})();

var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
})();

var Direction;
(function (Direction) {
    Direction[Direction["Left"] = 0] = "Left";
    Direction[Direction["Top"] = 1] = "Top";
    Direction[Direction["Right"] = 2] = "Right";
    Direction[Direction["Bottom"] = 3] = "Bottom";
})(Direction || (Direction = {}));

function ReverseDirection(Dir) {
    return (Dir + 2) & 3;
}

var SVGShape = (function () {
    function SVGShape() {
    }
    SVGShape.prototype.Render = function (CaseViewer, CaseModel, HTMLDoc) {
        this.ShapeGroup = document.createSVGElement("g");
        this.ShapeGroup.setAttribute("transform", "translate(0,0)");
        this.ArrowPath = document.createSVGElement("path");
        this.ArrowPath.setAttribute("marker-end", "url(#Triangle-black)");
        this.ArrowPath.setAttribute("fill", "none");
        this.ArrowPath.setAttribute("stroke", "gray");
        this.ArrowPath.setAttribute("d", "M0,0 C0,0 0,0 0,0");
    };

    SVGShape.prototype.Resize = function (CaseViewer, CaseModel, HTMLDoc) {
        this.Width = HTMLDoc.Width;
        this.Height = HTMLDoc.Height;
    };

    SVGShape.prototype.SetPosition = function (x, y) {
        var mat = this.ShapeGroup.transform.baseVal.getItem(0).matrix;
        mat.e = x;
        mat.f = y;
    };

    SVGShape.prototype.SetArrowPosition = function (p1, p2, dir) {
        var start = this.ArrowPath.pathSegList.getItem(0);
        var curve = this.ArrowPath.pathSegList.getItem(1);
        start.x = p1.x;
        start.y = p1.y;
        curve.x = p2.x;
        curve.y = p2.y;
        if (dir == Direction.Bottom || dir == Direction.Top) {
            curve.x1 = (9 * p1.x + p2.x) / 10;
            curve.y1 = (p1.y + p2.y) / 2;
            curve.x2 = (9 * p2.x + p1.x) / 10;
            curve.y2 = (p1.y + p2.y) / 2;
        } else {
            curve.x1 = (p1.x + p2.x) / 2;
            curve.y1 = (9 * p1.y + p2.y) / 10;
            curve.x2 = (p1.x + p2.x) / 2;
            curve.y2 = (9 * p2.y + p1.y) / 10;
        }
    };

    SVGShape.prototype.SetColor = function (fill, stroke) {
    };

    SVGShape.prototype.GetConnectorPosition = function (Dir) {
        switch (Dir) {
            case Direction.Right:
                return new Point(this.Width, this.Height / 2);
            case Direction.Left:
                return new Point(0, this.Height / 2);
            case Direction.Top:
                return new Point(this.Width / 2, 0);
            case Direction.Bottom:
                return new Point(this.Width / 2, this.Height);
            default:
                return new Point(0, 0);
        }
    };
    return SVGShape;
})();

var GoalShape = (function (_super) {
    __extends(GoalShape, _super);
    function GoalShape() {
        _super.apply(this, arguments);
    }
    GoalShape.prototype.Render = function (CaseViewer, CaseModel, HTMLDoc) {
        _super.prototype.Render.call(this, CaseViewer, CaseModel, HTMLDoc);
        this.BodyRect = document.createSVGElement("rect");

        this.ShapeGroup.appendChild(this.BodyRect);
        this.Resize(CaseViewer, CaseModel, HTMLDoc);
    };

    GoalShape.prototype.Resize = function (CaseViewer, CaseModel, HTMLDoc) {
        _super.prototype.Resize.call(this, CaseViewer, CaseModel, HTMLDoc);
        this.BodyRect.setAttribute("width", this.Width.toString());
        this.BodyRect.setAttribute("height", this.Height.toString());
    };

    GoalShape.prototype.SetColor = function (fill, stroke) {
        this.BodyRect.setAttribute("fill", fill);
        this.BodyRect.setAttribute("stroke", stroke);
    };
    return GoalShape;
})(SVGShape);

var ContextShape = (function (_super) {
    __extends(ContextShape, _super);
    function ContextShape() {
        _super.apply(this, arguments);
    }
    ContextShape.prototype.Render = function (CaseViewer, CaseModel, HTMLDoc) {
        _super.prototype.Render.call(this, CaseViewer, CaseModel, HTMLDoc);
        this.BodyRect = document.createSVGElement("rect");
        this.ArrowPath.setAttribute("marker-end", "url(#Triangle-white)");
        this.BodyRect.setAttribute("rx", "10");
        this.BodyRect.setAttribute("ry", "10");
        this.ShapeGroup.appendChild(this.BodyRect);
        this.Resize(CaseViewer, CaseModel, HTMLDoc);
    };

    ContextShape.prototype.Resize = function (CaseViewer, CaseModel, HTMLDoc) {
        _super.prototype.Resize.call(this, CaseViewer, CaseModel, HTMLDoc);
        this.BodyRect.setAttribute("width", this.Width.toString());
        this.BodyRect.setAttribute("height", this.Height.toString());
    };

    ContextShape.prototype.SetColor = function (fill, stroke) {
        this.BodyRect.setAttribute("fill", fill);
        this.BodyRect.setAttribute("stroke", stroke);
    };
    return ContextShape;
})(SVGShape);

var StrategyShape = (function (_super) {
    __extends(StrategyShape, _super);
    function StrategyShape() {
        _super.apply(this, arguments);
    }
    StrategyShape.prototype.Render = function (CaseViewer, CaseModel, HTMLDoc) {
        _super.prototype.Render.call(this, CaseViewer, CaseModel, HTMLDoc);
        this.BodyPolygon = document.createSVGElement("polygon");
        this.ShapeGroup.appendChild(this.BodyPolygon);
        this.Resize(CaseViewer, CaseModel, HTMLDoc);
    };

    StrategyShape.prototype.Resize = function (CaseViewer, CaseModel, HTMLDoc) {
        _super.prototype.Resize.call(this, CaseViewer, CaseModel, HTMLDoc);
        this.BodyPolygon.setAttribute("points", "10,0 " + this.Width + ",0 " + (this.Width - 10) + "," + this.Height + " 0," + this.Height);
    };

    StrategyShape.prototype.SetColor = function (fill, stroke) {
        this.BodyPolygon.setAttribute("fill", fill);
        this.BodyPolygon.setAttribute("stroke", stroke);
    };

    StrategyShape.prototype.GetConnectorPosition = function (Dir) {
        switch (Dir) {
            case Direction.Right:
                return new Point(this.Width - 10 / 2, this.Height / 2);
            case Direction.Left:
                return new Point(10 / 2, this.Height / 2);
            case Direction.Top:
                return new Point(this.Width / 2, 0);
            case Direction.Bottom:
                return new Point(this.Width / 2, this.Height);
        }
    };
    return StrategyShape;
})(SVGShape);

var EvidenceShape = (function (_super) {
    __extends(EvidenceShape, _super);
    function EvidenceShape() {
        _super.apply(this, arguments);
    }
    EvidenceShape.prototype.Render = function (CaseViewer, CaseModel, HTMLDoc) {
        _super.prototype.Render.call(this, CaseViewer, CaseModel, HTMLDoc);
        this.BodyEllipse = document.createSVGElement("ellipse");
        this.ShapeGroup.appendChild(this.BodyEllipse);
        this.Resize(CaseViewer, CaseModel, HTMLDoc);
    };

    EvidenceShape.prototype.Resize = function (CaseViewer, CaseModel, HTMLDoc) {
        _super.prototype.Resize.call(this, CaseViewer, CaseModel, HTMLDoc);
        this.BodyEllipse.setAttribute("cx", (this.Width / 2).toString());
        this.BodyEllipse.setAttribute("cy", (this.Height / 2).toString());
        this.BodyEllipse.setAttribute("rx", (this.Width / 2).toString());
        this.BodyEllipse.setAttribute("ry", (this.Height / 2).toString());
    };

    EvidenceShape.prototype.SetColor = function (fill, stroke) {
        this.BodyEllipse.setAttribute("fill", fill);
        this.BodyEllipse.setAttribute("stroke", stroke);
    };
    return EvidenceShape;
})(SVGShape);

var SVGShapeFactory = (function () {
    function SVGShapeFactory() {
    }
    SVGShapeFactory.Create = function (Type) {
        switch (Type) {
            case CaseType.Goal:
                return new GoalShape();
            case CaseType.Context:
                return new ContextShape();
            case CaseType.Strategy:
                return new StrategyShape();
            case CaseType.Evidence:
                return new EvidenceShape();
        }
    };
    return SVGShapeFactory;
})();

document.createSVGElement = function (name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
};

var ElementShape = (function () {
    function ElementShape(CaseViewer, CaseModel) {
        this.ParentDirection = Direction.Top;
        this.IsArrowReversed = false;
        this.AbsX = 0;
        this.AbsY = 0;
        this.x = 0;
        this.y = 0;
        this.CaseViewer = CaseViewer;
        this.Source = CaseModel;
        this.HTMLDoc = new HTMLDoc();
        this.HTMLDoc.Render(CaseViewer, CaseModel);
        this.SVGShape = SVGShapeFactory.Create(CaseModel.Type);
        this.SVGShape.Render(CaseViewer, CaseModel, this.HTMLDoc);
    }
    ElementShape.prototype.Resize = function () {
        this.HTMLDoc.Resize(this.CaseViewer, this.Source);
        this.SVGShape.Resize(this.CaseViewer, this.Source, this.HTMLDoc);
    };

    ElementShape.prototype.Update = function () {
        this.HTMLDoc.SetPosition(this.AbsX, this.AbsY);
        this.Resize();
        this.SVGShape.SetPosition(this.AbsX, this.AbsY);
        this.SVGShape.SetColor("white", "black");
        if (this.ParentShape != null) {
            var p1 = null;
            var p2 = null;
            p1 = this.ParentShape.GetAbsoluteConnectorPosition(ReverseDirection(this.ParentDirection));
            p2 = this.GetAbsoluteConnectorPosition(this.ParentDirection);
            if (this.IsArrowReversed) {
                this.SVGShape.SetArrowPosition(p2, p1, this.ParentDirection);
            } else {
                this.SVGShape.SetArrowPosition(p1, p2, this.ParentDirection);
            }
        }
        return;
    };

    ElementShape.prototype.AppendHTMLElement = function (svgroot, divroot, caseViewer) {
        divroot.append(this.HTMLDoc.DocBase);
        svgroot.append(this.SVGShape.ShapeGroup);
        this.InvokePlugInSVGRender(caseViewer);

        if (this.ParentShape != null) {
            svgroot.append(this.SVGShape.ArrowPath);
        }
        this.Update();
        return;
    };
    ElementShape.prototype.AppendHTMLElementRecursive = function (svgroot, divroot, caseViewer) {
        this.AppendHTMLElement(svgroot, divroot, caseViewer);
        var Children = this.Source.Children;
        var ViewMap = this.CaseViewer.ViewMap;
        for (var i = 0; i < Children.length; i++) {
            ViewMap[Children[i].Label].AppendHTMLElementRecursive(svgroot, divroot, caseViewer);
        }
        return;
    };
    ElementShape.prototype.DeleteHTMLElement = function (svgroot, divroot) {
        this.HTMLDoc.DocBase.remove();
        $(this.SVGShape.ShapeGroup).remove();
        if (this.ParentShape != null)
            $(this.SVGShape.ArrowPath).remove();
        return;
    };
    ElementShape.prototype.DeleteHTMLElementRecursive = function (svgroot, divroot) {
        this.DeleteHTMLElement(svgroot, divroot);
        var Children = this.Source.Children;
        var ViewMap = this.CaseViewer.ViewMap;
        for (var i = 0; i < Children.length; i++) {
            ViewMap[Children[i].Label].DeleteHTMLElementRecursive(svgroot, divroot);
        }
        return;
    };

    ElementShape.prototype.GetAbsoluteConnectorPosition = function (Dir) {
        var p = this.SVGShape.GetConnectorPosition(Dir);
        p.x += this.AbsX;
        p.y += this.AbsY;
        return p;
    };

    ElementShape.prototype.InvokePlugInSVGRender = function (caseViewer) {
        var pluginMap = caseViewer.pluginManager.SVGRenderPlugInMap;
        for (var key in pluginMap) {
            var render = caseViewer.GetPlugInSVGRender(key);
            render(caseViewer, this);
        }
    };
    return ElementShape;
})();

var CaseViewerConfig = (function () {
    function CaseViewerConfig() {
    }
    return CaseViewerConfig;
})();

var ViewerConfig = new CaseViewerConfig();

var CaseViewer = (function () {
    function CaseViewer(Source, pluginManager, serverApi) {
        this.Source = Source;
        this.pluginManager = pluginManager;
        this.serverApi = serverApi;
        this.ViewMap = [];
        for (var elementkey in Source.ElementMap) {
            var element = Source.ElementMap[elementkey];
            this.ViewMap[element.Label] = new ElementShape(this, element);
        }
        for (var elementkey in Source.ElementMap) {
            var element = Source.ElementMap[elementkey];
            if (element.Parent != null) {
                this.ViewMap[element.Label].ParentShape = this.ViewMap[element.Parent.Label];
            }
        }
        this.ElementTop = Source.ElementTop;
        this.Resize();
    }
    CaseViewer.prototype.GetPlugInHTMLRender = function (PlugInName) {
        var _this = this;
        return function (viewer, model, e) {
            return _this.pluginManager.HTMLRenderPlugInMap[PlugInName].Delegate(viewer, model, e);
        };
    };

    CaseViewer.prototype.GetPlugInSVGRender = function (PlugInName) {
        var _this = this;
        return function (viewer, shape) {
            return _this.pluginManager.SVGRenderPlugInMap[PlugInName].Delegate(viewer, shape);
        };
    };

    CaseViewer.prototype.Resize = function () {
        for (var shapekey in this.ViewMap) {
            this.ViewMap[shapekey].Resize();
        }
        this.LayoutElement();
    };

    CaseViewer.prototype.LayoutElement = function () {
        var layout = new LayoutPortrait(this.ViewMap);
        layout.Init(this.ElementTop, 300, 0);
        layout.Traverse(this.ElementTop, 300, 0);
        layout.SetFootElementPosition();
        layout.SetAllElementPosition(this.ElementTop);
    };

    CaseViewer.prototype.Draw = function (Screen) {
        var shapelayer = $(Screen.ShapeLayer);
        var screenlayer = $(Screen.ContentLayer);
        for (var viewkey in this.ViewMap) {
            this.ViewMap[viewkey].AppendHTMLElement(shapelayer, screenlayer, this);
        }
        this.pluginManager.RegisterActionEventListeners(this, this.Source, this.serverApi);
        this.Resize();
    };
    CaseViewer.ElementWidth = 150;
    return CaseViewer;
})();

var ScrollManager = (function () {
    function ScrollManager() {
        this.InitialOffsetX = 0;
        this.InitialOffsetY = 0;
        this.InitialX = 0;
        this.InitialY = 0;
        this.CurrentX = 0;
        this.CurrentY = 0;
        this.MainPointerID = 0;
        this.Pointers = [];
    }
    ScrollManager.prototype.SetInitialOffset = function (InitialOffsetX, InitialOffsetY) {
        this.InitialOffsetX = InitialOffsetX;
        this.InitialOffsetY = InitialOffsetY;
    };

    ScrollManager.prototype.StartDrag = function (InitialX, InitialY) {
        this.InitialX = InitialX;
        this.InitialY = InitialY;
    };

    ScrollManager.prototype.UpdateDrag = function (CurrentX, CurrentY) {
        this.CurrentX = CurrentX;
        this.CurrentY = CurrentY;
    };

    ScrollManager.prototype.CalcOffsetX = function () {
        return this.CurrentX - this.InitialX + this.InitialOffsetX;
    };

    ScrollManager.prototype.CalcOffsetY = function () {
        return this.CurrentY - this.InitialY + this.InitialOffsetY;
    };

    ScrollManager.prototype.GetMainPointer = function () {
        for (var i = 0; i < this.Pointers.length; ++i) {
            if (this.Pointers[i].identifier === this.MainPointerID) {
                return this.Pointers[i];
            }
        }
        ;
        return null;
    };

    ScrollManager.prototype.IsDragging = function () {
        return this.MainPointerID != null;
    };

    ScrollManager.prototype.OnPointerEvent = function (e, Screen) {
        this.Pointers = e.getPointerList();
        if (this.Pointers.length > 0) {
            if (this.IsDragging()) {
                var mainPointer = this.GetMainPointer();
                if (mainPointer) {
                    this.UpdateDrag(mainPointer.pageX, mainPointer.pageY);
                    Screen.SetOffset(this.CalcOffsetX(), this.CalcOffsetY());
                } else {
                    this.MainPointerID = null;
                }
            } else {
                var mainPointer = this.Pointers[0];
                this.MainPointerID = mainPointer.identifier;
                this.SetInitialOffset(Screen.GetOffsetX(), Screen.GetOffsetY());
                this.StartDrag(mainPointer.pageX, mainPointer.pageY);
            }
        } else {
            this.MainPointerID = null;
        }
    };

    ScrollManager.prototype.OnDoubleTap = function (e, Screen) {
        var width = Screen.ContentLayer.clientWidth;
        var height = Screen.ContentLayer.clientHeight;
        var pointer = this.Pointers[0];
    };
    return ScrollManager;
})();

var ScreenManager = (function () {
    function ScreenManager(ShapeLayer, ContentLayer, ControlLayer, BackGroundLayer) {
        var _this = this;
        this.ShapeLayer = ShapeLayer;
        this.ContentLayer = ContentLayer;
        this.ControlLayer = ControlLayer;
        this.BackGroundLayer = BackGroundLayer;
        this.ScrollManager = new ScrollManager();
        this.SetOffset(0, 0);
        var OnPointer = function (e) {
            _this.ScrollManager.OnPointerEvent(e, _this);
        };
        BackGroundLayer.addEventListener("pointerdown", OnPointer, false);
        BackGroundLayer.addEventListener("pointermove", OnPointer, false);
        BackGroundLayer.addEventListener("pointerup", OnPointer, false);
        BackGroundLayer.addEventListener("gesturedoubletap", function (e) {
            _this.ScrollManager.OnDoubleTap(e, _this);
        }, false);
        ContentLayer.addEventListener("pointerdown", OnPointer, false);
        ContentLayer.addEventListener("pointermove", OnPointer, false);
        ContentLayer.addEventListener("pointerup", OnPointer, false);
        ContentLayer.addEventListener("gesturedoubletap", function (e) {
            _this.ScrollManager.OnDoubleTap(e, _this);
        }, false);
    }
    ScreenManager.prototype.SetOffset = function (x, y) {
        this.OffsetX = x;
        this.OffsetY = y;

        var TranslationMatrix = this.ShapeLayer.transform.baseVal.getItem(0).matrix;
        TranslationMatrix.e = x;
        TranslationMatrix.f = y;

        var xpx = x + "px";
        var ypx = y + "px";
        this.ContentLayer.style.left = xpx;
        this.ContentLayer.style.top = ypx;
        this.ControlLayer.style.marginLeft = xpx;
        this.ControlLayer.style.marginTop = ypx;
    };

    ScreenManager.prototype.GetOffsetX = function () {
        return this.OffsetX;
    };

    ScreenManager.prototype.GetOffsetY = function () {
        return this.OffsetY;
    };
    return ScreenManager;
})();
