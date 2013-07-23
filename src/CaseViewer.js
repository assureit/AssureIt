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
        this.DocBase = $('<div>').width(CaseViewer.ElementWidth).css("position", "absolute");
        this.DocBase.append($('<h4>' + CaseModel.Label + '</h4>'));
        this.DocBase.append($('<p>' + CaseModel.Statement + '</p>'));
        this.InvokePlugInRender(Viewer, CaseModel, this.DocBase);
        this.UpdatePadding(Viewer, CaseModel);
        this.Resize(Viewer, CaseModel);
    };

<<<<<<< HEAD
    HTMLDoc.prototype.UpdatePadding = function (Viewer, Source) {
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
=======
        this.Width = this.DocBase.width();
        this.Height = this.DocBase.height();
>>>>>>> 0688947... emit coordinate data from GSN
    };

    HTMLDoc.prototype.InvokePlugInRender = function (CaseViewer, CaseModel, DocBase) {
        for (var anno in CaseModel.Annotations) {
            var f = CaseViewer.GetPlugInRender(anno.Name);
            DocBase.append(f(CaseViewer, CaseModel, anno));
        }
        for (var note in CaseModel.Notes) {
            var f = CaseViewer.GetPlugInRender(note.Name);
            DocBase.append(f(CaseViewer, CaseModel, note));
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

    SVGShape.prototype.SetArrowPosition = function (x1, y1, x2, y2) {
        var start = this.ArrowPath.pathSegList.getItem(0);
        var curve = this.ArrowPath.pathSegList.getItem(1);
        start.x = x1;
        start.y = y1;
        curve.x = x2;
        curve.y = y2;
        curve.x1 = (9 * x1 + x2) / 10;
        curve.y1 = (y1 + y2) / 2;
        curve.x2 = (9 * x2 + x1) / 10;
        curve.y2 = (y1 + y2) / 2;
    };

    SVGShape.prototype.SetColor = function (fill, stroke) {
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

    ElementShape.prototype.AppendHTMLElement = function (svgroot, divroot) {
        divroot.append(this.HTMLDoc.DocBase);
        this.HTMLDoc.SetPosition(this.AbsX, this.AbsY);
        this.Resize();

        svgroot.append(this.SVGShape.ShapeGroup);
        this.SVGShape.SetPosition(this.AbsX, this.AbsY);
        this.SVGShape.SetColor("white", "black");

        if (this.ParentShape != null) {
            var x1 = this.AbsX + this.HTMLDoc.Width / 2;
            var y1 = this.AbsY;
            var x2 = this.ParentShape.AbsX + this.ParentShape.HTMLDoc.Width / 2;
            var y2 = this.ParentShape.AbsY + this.ParentShape.HTMLDoc.Height;
            this.SVGShape.SetArrowPosition(x1, y1, x2, y2);
            svgroot.append(this.SVGShape.ArrowPath);
        }
        return;
    };
    return ElementShape;
})();

var CaseViewerConfig = (function () {
    function CaseViewerConfig() {
    }
    return CaseViewerConfig;
})();

var ViewerConfig = new CaseViewerConfig();

var LayOut = (function () {
    function LayOut(ViewMap) {
        this.ViewMap = ViewMap;
    }
    LayOut.prototype.hasContext = function (Node, x, y) {
        var i = 0;
        for (; i < Node.Children.length; i++) {
            if (Node.Children[i].Type == CaseType.Context) {
                return i;
            }
        }
        return -1;
    };

    LayOut.prototype.traverse = function (Element, x, y) {
        if (Element.Children.length == 0) {
            return;
        }

        var i = 0;
        i = this.hasContext(Element, this.ViewMap[Element.Label].AbsX, this.ViewMap[Element.Label].AbsY);
        if (i != -1) {
            this.ViewMap[Element.Label].AbsX += x;
            this.ViewMap[Element.Label].AbsY += y;
            this.ViewMap[Element.Label].AbsX += 50;
            console.log(Element.Label);
            console.log("(" + this.ViewMap[Element.Label].AbsX + ", " + this.ViewMap[Element.Label].AbsY + ")");
            Element.Children = Element.Children.splice(i - 1, 1);
            this.traverse(Element, this.ViewMap[Element.Label].AbsX, this.ViewMap[Element.Label].AbsY);
        } else {
            this.ViewMap[Element.Label].AbsX += x;
            this.ViewMap[Element.Label].AbsY += y;
            if (Element.Children.length % 2 == 1) {
                this.emitOddNumberChildren(Element, x, y);
            }
            if (Element.Children.length % 2 == 0) {
                this.emitEvenNumberChildren(Element, x, y);
            }
        }
    };

    LayOut.prototype.emitOddNumberChildren = function (Node, x, y) {
        var n = Node.Children.length;
        for (var i in Node.Children) {
            this.ViewMap[Node.Children[i].Label].AbsX = x;
            this.ViewMap[Node.Children[i].Label].AbsY = y;
            this.ViewMap[Node.Children[i].Label].AbsY += 120;
        }
        var num = (n - 1) / 2;
        var k = 0;
        for (var j = -num; j <= num; j++) {
            this.ViewMap[Node.Children[k].Label].AbsX += 160 * j;
            k++;
        }

        for (var i in Node.Children) {
            console.log(Node.Children[i].Label);
            console.log("(" + this.ViewMap[Node.Children[i].Label].AbsX + ", " + this.ViewMap[Node.Children[i].Label].AbsY + ")");
            this.traverse(Node.Children[i], this.ViewMap[Node.Children[i].Label].AbsX, this.ViewMap[Node.Children[i].Label].AbsY);
        }
        return;
    };

    LayOut.prototype.emitEvenNumberChildren = function (Node, x, y) {
        var n = Node.Children.length;
        var num = n / 2;
        var index = new Array();

        for (var j = -num; j <= num; j++) {
            if (j == 0) {
                continue;
            }
            index.push(j);
        }

        for (var i in Node.Children) {
            this.ViewMap[Node.Children[i].Label].AbsX += x;
            this.ViewMap[Node.Children[i].Label].AbsY += y;
            this.ViewMap[Node.Children[i].Label].AbsX += 160 * index[i];
            this.ViewMap[Node.Children[i].Label].AbsY += 120;
            console.log(Node.Children[i].Label);

            console.log("(" + this.ViewMap[Node.Children[i].Label].AbsX + ", " + this.ViewMap[Node.Children[i].Label].AbsY + ")");
            this.traverse(Node.Children[i], this.ViewMap[Node.Children[i].Label].AbsX, this.ViewMap[Node.Children[i].Label].AbsY);
        }
        return;
    };
    LayOut.X_MARGIN = 160;
    LayOut.Y_MARGIN = 120;
    return LayOut;
})();

var CaseViewer = (function () {
    function CaseViewer(Source) {
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
        this.TopGoalLabel = Source.TopGoalLabel;
        this.Resize();
    }
    CaseViewer.prototype.GetPlugInRender = function (Name) {
        return null;
    };

    CaseViewer.prototype.Resize = function () {
        for (var shapekey in this.ViewMap) {
            this.ViewMap[shapekey].Resize();
        }
        this.LayoutElement();
    };

    CaseViewer.prototype.LayoutElement = function () {
<<<<<<< HEAD
        // TODO: ishii
        var i = 0;
        for (var shapekey in this.ViewMap) {
            this.ViewMap[shapekey].AbsY = (i++ * 200);
        }
=======
        var topElementShape = this.ViewMap[this.TopGoalLabel];
        var topElement = topElementShape.Source;
        var layout = new LayOut(this.ViewMap);
        layout.traverse(topElement, 300, 0);
>>>>>>> 0688947... emit coordinate data from GSN
    };

    CaseViewer.prototype.Draw = function (svg, div) {
        for (var shape in this.ViewMap) {
            this.ViewMap[shape].AppendHTMLElement(svg, div);
        }
    };
    CaseViewer.ElementWidth = 150;
    return CaseViewer;
})();

var ServerApi = (function () {
    function ServerApi(url) {
    }
    ServerApi.prototype.GetCase = function (project, id) {
        return "[]";
    };
    return ServerApi;
})();

function StartCaseViewer(url, id) {
    var loader = new ServerApi(url);
    var project;
    var JsonData = loader.GetCase(project, id);
    var Argument = new Argument();
    var model = new CaseDecoder().ParseJson(Argument, JsonData);
    var CaseViewer = new CaseViewer(model);
    var svg = document.getElementById(id);
    CaseViewer.Draw(svg);
}

$(function () {
    var Case0 = new Case();
    var goal = new CaseModel(Case0, null, CaseType.Goal, null, "Top Goal");
    var str = new CaseModel(Case0, goal, CaseType.Strategy, null, "Strategy");
    var goal_a = new CaseModel(Case0, str, CaseType.Goal, null, "Goal_a");
    var goal_b = new CaseModel(Case0, str, CaseType.Goal, null, "Goal_b");
    var evi_a = new CaseModel(Case0, goal_a, CaseType.Evidence, null, "Evidence_a");
    var evi_b = new CaseModel(Case0, goal_b, CaseType.Evidence, null, "Evidence_b");

    Case0.SetTopGoalLabel(goal.Label);
    var Viewer = new CaseViewer(Case0);
    var svgroot = $("#svg1");
    var divroot = $("#div1");
    Viewer.Draw(svgroot, divroot);
});
