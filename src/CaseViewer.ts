/// <reference path="CaseModel.ts" />
/// <reference path="CaseDecoder.ts" />
/// <reference path="ServerApi.ts" />
/// <reference path="Layout.ts" />
/// <reference path="PlugInManager.ts" />
/// <reference path="../d.ts/jquery.d.ts" />
/// <reference path="../d.ts/pointer.d.ts" />

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
		this.InvokePlugInHTMLRender(Viewer, CaseModel, this.DocBase);
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

	InvokePlugInHTMLRender(caseViewer: CaseViewer, caseModel: CaseModel, DocBase: JQuery): void {
		var pluginMap : { [index: string]: HTMLRenderPlugIn} = caseViewer.pluginManager.HTMLRenderPlugInMap;
		for(var key in pluginMap) {
			var render = caseViewer.GetPlugInHTMLRender(key);
			render(caseViewer, caseModel, DocBase);
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

class Point {
	constructor(public x: number, public y: number) { }
}

enum Direction {
	Left, Top, Right, Bottom
}

function ReverseDirection(Dir: Direction): Direction {
	return (Dir + 2) & 3;
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

	SetArrowPosition(p1: Point, p2: Point, dir: Direction) {
		var start = <SVGPathSegMovetoAbs>this.ArrowPath.pathSegList.getItem(0);
		var curve = <SVGPathSegCurvetoCubicAbs>this.ArrowPath.pathSegList.getItem(1);
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
	}

	SetColor(fill: string, stroke: string) {
	}

	GetConnectorPosition(Dir: Direction): Point {
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
		this.ArrowPath.setAttribute("marker-end", "url(#Triangle-white)");
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

	GetConnectorPosition(Dir: Direction): Point {
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

	ParentDirection: Direction = Direction.Top;
	IsArrowReversed: boolean = false;

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

	Update(): void {
		this.HTMLDoc.SetPosition(this.AbsX, this.AbsY);
		this.Resize();
		this.SVGShape.SetPosition(this.AbsX, this.AbsY);
		this.SVGShape.SetColor("white", "black");
		if (this.ParentShape != null) {
			var p1: Point = null;
			var p2: Point = null;
			p1 = this.ParentShape.GetAbsoluteConnectorPosition(ReverseDirection(this.ParentDirection));
			p2 = this.GetAbsoluteConnectorPosition(this.ParentDirection);
			if (this.IsArrowReversed) {
				this.SVGShape.SetArrowPosition(p2, p1, this.ParentDirection);
			} else {
				this.SVGShape.SetArrowPosition(p1, p2, this.ParentDirection);
			}
		}
		return; // TODO
	}

	AppendHTMLElement(svgroot: JQuery, divroot: JQuery, caseViewer : CaseViewer): void {
		divroot.append(this.HTMLDoc.DocBase);
		svgroot.append(this.SVGShape.ShapeGroup);
		this.InvokePlugInSVGRender(caseViewer);

		// if it has an parent, add an arrow element.
		if (this.ParentShape != null) {
			svgroot.append(this.SVGShape.ArrowPath);
		}
		this.Update();
		return; // TODO
	}
	AppendHTMLElementRecursive(svgroot: JQuery, divroot: JQuery, caseViewer : CaseViewer): void {
		this.AppendHTMLElement(svgroot, divroot, caseViewer);
		var Children = this.Source.Children;
		var ViewMap = this.CaseViewer.ViewMap;
		for (var i = 0; i < Children.length; i++) {
			ViewMap[Children[i].Label].AppendHTMLElementRecursive(svgroot, divroot, caseViewer);
		}
		return;
	}
 	DeleteHTMLElement(svgroot: JQuery, divroot: JQuery): void {
		this.HTMLDoc.DocBase.remove();
		$(this.SVGShape.ShapeGroup).remove();
		if (this.ParentShape != null) $(this.SVGShape.ArrowPath).remove();
		return;
 	}
 	DeleteHTMLElementRecursive(svgroot: JQuery, divroot: JQuery): void {
		this.DeleteHTMLElement(svgroot, divroot);
		var Children = this.Source.Children;
		var ViewMap = this.CaseViewer.ViewMap;
		for (var i = 0; i < Children.length; i++) {
			ViewMap[Children[i].Label].DeleteHTMLElementRecursive(svgroot, divroot);
		}
		return;
 	}

	GetAbsoluteConnectorPosition(Dir: Direction): Point {
		var p = this.SVGShape.GetConnectorPosition(Dir);
		p.x += this.AbsX;
		p.y += this.AbsY;
		return p;
	}

	InvokePlugInSVGRender(caseViewer: CaseViewer): void {
		var pluginMap : { [index: string]: SVGRenderPlugIn} = caseViewer.pluginManager.SVGRenderPlugInMap;
		for(var key in pluginMap) {
			var render = caseViewer.GetPlugInSVGRender(key);
			render(caseViewer, this);
		}
	}
}

class CaseViewerConfig {

}

var ViewerConfig = new CaseViewerConfig();

class CaseViewer {
	ViewMap: { [index: string]: ElementShape; };
	ElementTop : CaseModel;
	static ElementWidth = 150;

	constructor(public Source: Case, public pluginManager : PlugInManager, public serverApi: ServerAPI) {
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

	GetPlugInHTMLRender(PlugInName: string): (caseViewer: CaseViewer, caseModel: CaseModel, element: JQuery) => boolean {
		return (viewer: CaseViewer, model: CaseModel, e: JQuery) : boolean => {
			return this.pluginManager.HTMLRenderPlugInMap[PlugInName].Delegate(viewer, model, e);
		};
	}

	GetPlugInSVGRender(PlugInName: string): (caseViewer: CaseViewer, elementShape: ElementShape) => boolean {
		return (viewer: CaseViewer, shape: ElementShape) : boolean => {
			return this.pluginManager.SVGRenderPlugInMap[PlugInName].Delegate(viewer, shape);
		};
	}

	Resize(): void {
		for (var shapekey in this.ViewMap) {
			this.ViewMap[shapekey].Resize();
		}
		this.LayoutElement();
	}

	LayoutElement() : void {
		var layout : LayoutEngine = new LayoutPortrait(this.ViewMap); //TODO Enable switch Layout engine
		layout.Init(this.ElementTop, 300, 0);
		layout.Traverse(this.ElementTop, 300, 0);
		layout.SetFootElementPosition();
		layout.SetAllElementPosition(this.ElementTop);
		//var layout : LayoutEngine = new LayoutLandscape(this.ViewMap);
		//layout.Init(this.ElementTop, 0, 200);
		//layout.Traverse(this.ElementTop, 0, 0);
		//layout.SetFootElementPosition();
		//layout.SetAllElementPosition(this.ElementTop);
	}

	Draw(Screen: ScreenManager): void {
		var shapelayer = $(Screen.ShapeLayer);
		var screenlayer = $(Screen.ContentLayer);
		for (var viewkey in this.ViewMap) {
			this.ViewMap[viewkey].AppendHTMLElement(shapelayer, screenlayer, this);
		}
		this.pluginManager.RegisterActionEventListeners(this, this.Source, this.serverApi);
		this.Resize();
	}

}

class ScrollManager {
	InitialOffsetX: number = 0;
	InitialOffsetY: number = 0;
	InitialX: number = 0;
	InitialY: number = 0;
	CurrentX: number = 0;
	CurrentY: number = 0;
	MainPointerID: number = 0;
	Pointers: Pointer[] = [];

	SetInitialOffset(InitialOffsetX: number, InitialOffsetY: number) {
		this.InitialOffsetX = InitialOffsetX;
		this.InitialOffsetY = InitialOffsetY;
	}

	StartDrag(InitialX: number, InitialY: number) {
		this.InitialX = InitialX;
		this.InitialY = InitialY;
	}

	UpdateDrag(CurrentX: number, CurrentY: number) {
		this.CurrentX = CurrentX;
		this.CurrentY = CurrentY;
	}

	CalcOffsetX(): number {
		return this.CurrentX - this.InitialX + this.InitialOffsetX;
	}

	CalcOffsetY(): number {
		return this.CurrentY - this.InitialY + this.InitialOffsetY;
	}

	GetMainPointer(): Pointer {
		for (var i = 0; i < this.Pointers.length; ++i) {
			if (this.Pointers[i].identifier === this.MainPointerID) {
				return this.Pointers[i]
			}
		};
		return null;
	}

	IsDragging(): boolean {
		return this.MainPointerID != null;
	}

	OnPointerEvent(e: PointerEvent, Screen: ScreenManager) {
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
	}

	OnDoubleTap(e: PointerEvent, Screen: ScreenManager) {
		var width: number = Screen.ContentLayer.clientWidth;
		var height: number = Screen.ContentLayer.clientHeight;
		var pointer = this.Pointers[0];
		//Screen.SetOffset(width / 2 - pointer.pageX, height / 2 - pointer.pageY);
	}
}

class ScreenManager {
	
	ScrollManager: ScrollManager = new ScrollManager();
	private OffsetX: number;
	private OffsetY: number;

	constructor(public ShapeLayer: SVGGElement, public ContentLayer: HTMLDivElement, public ControlLayer: HTMLDivElement, public BackGroundLayer: HTMLDivElement) {
		this.SetOffset(0, 0);
		var OnPointer = (e: PointerEvent) => { this.ScrollManager.OnPointerEvent(e, this); };
		BackGroundLayer.addEventListener("pointerdown", OnPointer, false);
		BackGroundLayer.addEventListener("pointermove", OnPointer, false);
		BackGroundLayer.addEventListener("pointerup", OnPointer, false);
		BackGroundLayer.addEventListener("gesturedoubletap", (e: PointerEvent) => { this.ScrollManager.OnDoubleTap(e, this); }, false);
		ContentLayer.addEventListener("pointerdown", OnPointer, false);
		ContentLayer.addEventListener("pointermove", OnPointer, false);
		ContentLayer.addEventListener("pointerup", OnPointer, false);
		ContentLayer.addEventListener("gesturedoubletap", (e: PointerEvent) => { this.ScrollManager.OnDoubleTap(e, this); }, false);
		//BackGroundLayer.addEventListener("gesturescale", OnPointer, false);
	}

	//onScale(e: GestureScaleEvent): void {
	//	e.preventDefault();
	//	e.stopPropagation();
	//	//if (this.viewer.moving) return;
	//	//var b = e.scale * this.scale0 / this.viewer.scale;
	//	//this.setScale(e.centerX, e.centerY, b);
	//}

	SetOffset(x: number, y: number) {
		this.OffsetX = x;
		this.OffsetY = y;
		
		var TranslationMatrix = this.ShapeLayer.transform.baseVal.getItem(0).matrix;
		TranslationMatrix.e = x;
		TranslationMatrix.f = y;

		var xpx = x + "px";
		var ypx = y + "px";
		this.ContentLayer.style.left = xpx;
		this.ContentLayer.style.top  = ypx;
		this.ControlLayer.style.marginLeft = xpx;
		this.ControlLayer.style.marginTop  = ypx;
	}

	GetOffsetX(): number {
		return this.OffsetX;
	}

	GetOffsetY(): number {
		return this.OffsetY;
	}

}
