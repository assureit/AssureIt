/// <reference path="CaseModel.ts" />
/// <reference path="CaseDecoder.ts" />
/// <reference path="Layout.ts" />
/// <reference path="../plugins/SamplePlugin.ts" />
/// <reference path="../d.ts/jquery.d.ts" />
// <reference path="../d.ts/jQuery.svg.d.ts" />
/* VIEW (MVC) */

class HTMLDoc {
	DocBase: JQuery;
	Width: number = 0;
	Height: number = 0;

	Render(Viewer: CaseViewer, CaseModel: CaseModel): void {
		if (this.DocBase != null) {
			var parent = this.DocBase.parent();
			if (parent != null) parent.remove(this.DocBase);
		}
		this.DocBase = $('<div class="node">').css("position", "absolute");
		this.DocBase.append($('<h4>' + CaseModel.Label + '</h4>'));
		this.DocBase.append($('<p>' + CaseModel.Statement + '</p>'));
		this.InvokePlugInRender(Viewer, CaseModel, this.DocBase);
		this.UpdateWidth(Viewer, CaseModel);
		this.Resize(Viewer, CaseModel);
	}

	UpdateWidth(Viewer: CaseViewer, Source: CaseModel) {
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
	}

	InvokePlugInRender(CaseViewer: CaseViewer, CaseModel: CaseModel, DocBase: JQuery): void {
		for (var anno in CaseModel.Annotations) {
			var f = CaseViewer.GetPlugInRender(anno.Name);
			DocBase.append(f(CaseViewer, CaseModel, anno));
		}
		for (var note in CaseModel.Notes) {
			var f = CaseViewer.GetPlugInRender(note.Name);
			DocBase.append(f(CaseViewer, CaseModel, note));
		}
	}

	Resize(Viewer: CaseViewer, Source: CaseModel): void {
		this.Width = this.DocBase ? this.DocBase.outerWidth() : 0;
		this.Height = this.DocBase ? this.DocBase.outerHeight() : 0;
	}

	SetPosition(x: number, y: number) {
		this.DocBase.css({ left: x + "px", top: y + "px" });
	}
}

class SVGShape {
	Width: number;
	Height: number;
	ShapeGroup: SVGGElement;
	ArrowPath: SVGPathElement;

	Render(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		this.ShapeGroup = <SVGGElement>document.createSVGElement("g");
		this.ShapeGroup.setAttribute("transform", "translate(0,0)");
		this.ArrowPath = <SVGPathElement>document.createSVGElement("path");
		this.ArrowPath.setAttribute("marker-end", "url(#Triangle-black)");
		this.ArrowPath.setAttribute("fill", "none");
		this.ArrowPath.setAttribute("stroke", "gray");
		this.ArrowPath.setAttribute("d", "M0,0 C0,0 0,0 0,0");
	}

	Resize(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		this.Width = HTMLDoc.Width;
		this.Height = HTMLDoc.Height;
	}

	SetPosition(x: number, y: number) {
		var mat = this.ShapeGroup.transform.baseVal.getItem(0).matrix;
		mat.e = x;
		mat.f = y;
	}

	SetArrowPosition(x1: number, y1: number, x2: number, y2: number) {
		var start = <SVGPathSegMovetoAbs>this.ArrowPath.pathSegList.getItem(0);
		var curve = <SVGPathSegCurvetoCubicAbs>this.ArrowPath.pathSegList.getItem(1);
		start.x = x1;
		start.y = y1;
		curve.x = x2;
		curve.y = y2;
		curve.x1 = (9 * x1 + x2) / 10;
		curve.y1 = (y1 + y2) / 2;
		curve.x2 = (9 * x2 + x1) / 10;
		curve.y2 = (y1 + y2) / 2;
	}

	SetColor(fill: string, stroke: string) {
	}
}

class GoalShape extends SVGShape {
	BodyRect: SVGRectElement;

	Render(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Render(CaseViewer, CaseModel, HTMLDoc);
		this.BodyRect = <SVGRectElement>document.createSVGElement("rect");

		this.ShapeGroup.appendChild(this.BodyRect);
		this.Resize(CaseViewer, CaseModel, HTMLDoc);
	}

	Resize(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Resize(CaseViewer, CaseModel, HTMLDoc);
		this.BodyRect.setAttribute("width", this.Width.toString());
		this.BodyRect.setAttribute("height", this.Height.toString());
	}

	SetColor(fill: string, stroke: string) {
		this.BodyRect.setAttribute("fill", fill);
		this.BodyRect.setAttribute("stroke", stroke);
	}
}

class ContextShape extends SVGShape {
	BodyRect: SVGRectElement;

	Render(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Render(CaseViewer, CaseModel, HTMLDoc);
		this.BodyRect = <SVGRectElement>document.createSVGElement("rect");
		this.BodyRect.setAttribute("rx", "10");
		this.BodyRect.setAttribute("ry", "10");
		this.ShapeGroup.appendChild(this.BodyRect);
		this.Resize(CaseViewer, CaseModel, HTMLDoc);
	}

	Resize(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Resize(CaseViewer, CaseModel, HTMLDoc);
		this.BodyRect.setAttribute("width", this.Width.toString());
		this.BodyRect.setAttribute("height", this.Height.toString());
	}

	SetColor(fill: string, stroke: string) {
		this.BodyRect.setAttribute("fill", fill);
		this.BodyRect.setAttribute("stroke", stroke);
	}
}

class StrategyShape extends SVGShape {
	BodyPolygon: SVGPolygonElement;

	Render(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Render(CaseViewer, CaseModel, HTMLDoc);
		this.BodyPolygon = <SVGPolygonElement>document.createSVGElement("polygon");
		this.ShapeGroup.appendChild(this.BodyPolygon);
		this.Resize(CaseViewer, CaseModel, HTMLDoc);
	}

	Resize(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Resize(CaseViewer, CaseModel, HTMLDoc);
		this.BodyPolygon.setAttribute("points", "10,0 " + this.Width + ",0 " + (this.Width - 10) + "," + this.Height + " 0," + this.Height);
	}

	SetColor(fill: string, stroke: string) {
		this.BodyPolygon.setAttribute("fill", fill);
		this.BodyPolygon.setAttribute("stroke", stroke);
	}
}

class EvidenceShape extends SVGShape {
	BodyEllipse: SVGEllipseElement;

	Render(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Render(CaseViewer, CaseModel, HTMLDoc);
		this.BodyEllipse = <SVGEllipseElement>document.createSVGElement("ellipse");
		this.ShapeGroup.appendChild(this.BodyEllipse);
		this.Resize(CaseViewer, CaseModel, HTMLDoc);
	}

	Resize(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Resize(CaseViewer, CaseModel, HTMLDoc);
		this.BodyEllipse.setAttribute("cx", (this.Width / 2).toString());
		this.BodyEllipse.setAttribute("cy", (this.Height / 2).toString());
		this.BodyEllipse.setAttribute("rx", (this.Width / 2).toString());
		this.BodyEllipse.setAttribute("ry", (this.Height / 2).toString());
	}

	SetColor(fill: string, stroke: string) {
		this.BodyEllipse.setAttribute("fill", fill);
		this.BodyEllipse.setAttribute("stroke", stroke);
	}
}

class SVGShapeFactory {
	static Create(Type: CaseType): SVGShape {
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
	}
}

interface JQuery {
	svg(loadUrl: string): JQuery;
	svg(x: Function): JQuery;
}

interface Document {
	createSVGElement: (name: string) => Element;
}

document.createSVGElement = function (name: string): Element {
	return document.createElementNS('http://www.w3.org/2000/svg', name);
}

class ElementShape {
	CaseViewer: CaseViewer;
	Source: CaseModel;
	HTMLDoc: HTMLDoc;
	SVGShape: SVGShape;
	ParentShape: ElementShape;

	AbsX: number = 0;
	AbsY: number = 0;
	x: number = 0;
	y: number = 0;

	constructor(CaseViewer: CaseViewer, CaseModel: CaseModel) {
		this.CaseViewer = CaseViewer;
		this.Source = CaseModel;
		this.HTMLDoc = new HTMLDoc();
		this.HTMLDoc.Render(CaseViewer, CaseModel);
		this.SVGShape = SVGShapeFactory.Create(CaseModel.Type);
		this.SVGShape.Render(CaseViewer, CaseModel, this.HTMLDoc);
	}

	Resize(): void {
		this.HTMLDoc.Resize(this.CaseViewer, this.Source);
		this.SVGShape.Resize(this.CaseViewer, this.Source, this.HTMLDoc);
	}

	AppendHTMLElement(svgroot: JQuery, divroot: JQuery): void {
		divroot.append(this.HTMLDoc.DocBase);
		this.HTMLDoc.SetPosition(this.AbsX, this.AbsY);
		this.Resize();
		// TODO
		// if it has an parent, add an arrow element. 
		svgroot.append(this.SVGShape.ShapeGroup);
		this.SVGShape.SetPosition(this.AbsX, this.AbsY);
		this.SVGShape.SetColor("white", "black");

		if (this.ParentShape != null) {
			var x1 = this.ParentShape.AbsX + this.ParentShape.HTMLDoc.Width / 2;
			var y1 = this.ParentShape.AbsY + this.ParentShape.HTMLDoc.Height;
			var x2 = this.AbsX + this.HTMLDoc.Width / 2;
			var y2 = this.AbsY;
			this.SVGShape.SetArrowPosition(x1, y1, x2, y2);
			svgroot.append(this.SVGShape.ArrowPath);
		}
		return; // TODO
	}
}

class CaseViewerConfig {

}

var ViewerConfig = new CaseViewerConfig();

class CaseViewer {
	ViewMap: { [index: string]: ElementShape; };
	ElementTop : CaseModel;
	static ElementWidth = 150;

	constructor(Source: Case) {
		this.ViewMap = <any>[]; // a hack to avoid tsc's problem.
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

	GetPlugInRender(Name: string): (CaseViewer: CaseViewer, CaseModel: CaseModel, Node: string) => string {
		return null; // TODO;
	}

	Resize(): void {
		for (var shapekey in this.ViewMap) {
			this.ViewMap[shapekey].Resize();
		}
		this.LayoutElement();
	}

	LayoutElement() : void {
//		var layout : Layout = new LayoutPortrait(this.ViewMap); //TODO Enable switch Layout engine
		var layout : Layout = new LayoutLandscape(this.ViewMap);
//		layout.Init(this.ElementTop, 300, 0);
//		layout.Traverse(this.ElementTop, 300, 0);
		layout.Init(this.ElementTop, 0, 200);
		layout.Traverse(this.ElementTop, 0, 200);
	}

	Draw(Screen: ScreenManager): void {
		var shapelayer = $(Screen.ShapeLayer);
		var screenlayer = $(Screen.ContentLayer);
		for (var viewkey in this.ViewMap) {
			this.ViewMap[viewkey].AppendHTMLElement(shapelayer, screenlayer);
		}
	}

}


class ServerApi {
	constructor(url: string) {
	}
	GetCase(project: string, id: string): string {
		return "[]";
	}
}

class ScreenManager {
	constructor(public ShapeLayer: SVGGElement, public ContentLayer: HTMLDivElement, public ControlLayer: HTMLDivElement) {
	}

	SetOffset(x: number, y: number) {
		var mat = this.ShapeLayer.transform.baseVal.getItem(0).matrix;
		mat.e = -x;
		mat.f = -y;

		var xpx = -x + "px";
		var ypx = -y + "px";
		this.ContentLayer.style.left = xpx;
		this.ContentLayer.style.top = ypx;
		this.ControlLayer.style.left = xpx;
		this.ControlLayer.style.top = ypx;;
	}
}


function StartCaseViewer(url: string, id: string) {
	var loader = new ServerApi(url);
	var project; // temp
	var JsonData = loader.GetCase(project, id);
	var Argument = new Argument();
	var model = new CaseDecoder().ParseJson(Argument, JsonData);
	var CaseViewer = new CaseViewer(model);
	var svg = document.getElementById(id);
	CaseViewer.Draw(svg);
}
