/// <reference path="CaseModel.ts" />
/// <reference path="CaseDecoder.ts" />
/// <reference path="CaseEncoder.ts" />
/// <reference path="ServerApi.ts" />
/// <reference path="Layout.ts" />
/// <reference path="PlugInManager.ts" />
/// <reference path="../d.ts/jquery.d.ts" />
/// <reference path="../d.ts/pointer.d.ts" />

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


/* VIEW (MVC) */
module AssureIt {

	export class HTMLDoc {
		DocBase: JQuery;
		Width: number = 0;
		Height: number = 0;

		Render(Viewer: CaseViewer, NodeModel: NodeModel): void {
			if (this.DocBase != null) {
				//var parent = this.DocBase.parent();
				//if (parent != null) parent.remove(this.DocBase);
				this.DocBase.remove();
			}
			this.DocBase = $('<div class="node">').css("position", "absolute")
				.attr('id', NodeModel.Label);
			this.DocBase.append($('<h4>' + NodeModel.Label + '</h4>'));
			//this.DocBase.append($('<p>' + NodeModel.Statement + '</p>'));

			this.InvokePlugInHTMLRender(Viewer, NodeModel, this.DocBase);
			this.UpdateWidth(Viewer, NodeModel);
			this.Resize(Viewer, NodeModel);
		}

		UpdateWidth(Viewer: CaseViewer, Source: NodeModel) {
			this.DocBase.width(CaseViewer.ElementWidth);
			switch (Source.Type) {
				case NodeType.Goal:
					this.DocBase.css("padding", "5px 10px");
					break;
				case NodeType.Context:
					this.DocBase.css("padding", "10px 10px");
					break;
				case NodeType.Strategy:
					this.DocBase.css("padding", "5px 20px");
					break;
				case NodeType.Evidence:
				default:
					this.DocBase.css("padding", "20px 20px");
					break;
			}
			this.DocBase.width(CaseViewer.ElementWidth * 2 - this.DocBase.outerWidth());
		}

		InvokePlugInHTMLRender(caseViewer: CaseViewer, caseModel: NodeModel, DocBase: JQuery): void {
			var pluginMap : { [index: string]: HTMLRenderPlugIn} = caseViewer.pluginManager.HTMLRenderPlugInMap;
			for(var key in pluginMap) {
				var render = caseViewer.GetPlugInHTMLRender(key);
				render(caseViewer, caseModel, DocBase);
			}
		}

		Resize(Viewer: CaseViewer, Source: NodeModel): void {
			this.Width = this.DocBase ? this.DocBase.outerWidth() : 0;
			this.Height = this.DocBase ? this.DocBase.outerHeight() : 0;
		}

		SetPosition(x: number, y: number) {
			this.DocBase.css({ left: x + "px", top: y + "px" });
		}
	}

	export class Point {
		constructor(public x: number, public y: number) { }
	}

	export enum Direction {
		Left, Top, Right, Bottom
	}

	function ReverseDirection(Dir: Direction): Direction {
		return (Dir + 2) & 3;
	}

	export class SVGShape {
		Width: number;
		Height: number;
		ShapeGroup: SVGGElement;
		ArrowPath: SVGPathElement;

		Render(CaseViewer: CaseViewer, NodeModel: NodeModel, HTMLDoc: HTMLDoc): void {
			this.ShapeGroup = <SVGGElement>document.createSVGElement("g");
			this.ShapeGroup.setAttribute("transform", "translate(0,0)");
			this.ArrowPath = <SVGPathElement>document.createSVGElement("path");
			this.ArrowPath.setAttribute("marker-end", "url(#Triangle-black)");
			this.ArrowPath.setAttribute("fill", "none");
			this.ArrowPath.setAttribute("stroke", "gray");
			this.ArrowPath.setAttribute("d", "M0,0 C0,0 0,0 0,0");
		}

		GetSVG(): SVGGElement {
			return this.ShapeGroup;
		}

		GetSVGPath(): SVGPathElement {
			return this.ArrowPath;
		}

		Resize(CaseViewer: CaseViewer, NodeModel: NodeModel, HTMLDoc: HTMLDoc): void {
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

		SetArrowColorWhite(white: boolean) {
			if (white) {
				this.ArrowPath.setAttribute("marker-end", "url(#Triangle-white)");
			} else {
				this.ArrowPath.setAttribute("marker-end", "url(#Triangle-black)");
			}
		}

		SetColor(fill: string, stroke: string) {
		}

		GetColor(): {[index: string]: string} {
			return {};
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

	export class GoalShape extends SVGShape {
		BodyRect: SVGRectElement;
		UndevelopedSymbol: SVGUseElement;

		Render(CaseViewer: CaseViewer, NodeModel: NodeModel, HTMLDoc: HTMLDoc): void {
			super.Render(CaseViewer, NodeModel, HTMLDoc);
			this.BodyRect = <SVGRectElement>document.createSVGElement("rect");
			this.UndevelopedSymbol = <SVGUseElement>document.createSVGElement("use");
			this.UndevelopedSymbol.setAttribute("xlink:href", "#UndevelopdSymbol");

			this.ShapeGroup.appendChild(this.BodyRect);
			this.Resize(CaseViewer, NodeModel, HTMLDoc);
		}

		Resize(CaseViewer: CaseViewer, NodeModel: NodeModel, HTMLDoc: HTMLDoc): void {
			super.Resize(CaseViewer, NodeModel, HTMLDoc);
			this.BodyRect.setAttribute("width", this.Width.toString());
			this.BodyRect.setAttribute("height", this.Height.toString());
		}

		SetColor(fill: string, stroke: string) {
			this.BodyRect.setAttribute("fill", fill);
			this.BodyRect.setAttribute("stroke", stroke);
		}

		GetColor(): {[index: string]: string} {
			return { "fill": this.BodyRect.getAttribute("fill"), "stroke": this.BodyRect.getAttribute("stroke") };
		}

		SetUndevelolpedSymbolPosition(point: Point){
			this.UndevelopedSymbol.setAttribute("x", point.x.toString());
			this.UndevelopedSymbol.setAttribute("y", point.y.toString());
		}
	}

	export class ContextShape extends SVGShape {
		BodyRect: SVGRectElement;

		Render(CaseViewer: CaseViewer, NodeModel: NodeModel, HTMLDoc: HTMLDoc): void {
			super.Render(CaseViewer, NodeModel, HTMLDoc);
			this.BodyRect = <SVGRectElement>document.createSVGElement("rect");
			this.ArrowPath.setAttribute("marker-end", "url(#Triangle-white)");
			this.BodyRect.setAttribute("rx", "10");
			this.BodyRect.setAttribute("ry", "10");
			this.ShapeGroup.appendChild(this.BodyRect);
			this.Resize(CaseViewer, NodeModel, HTMLDoc);
		}

		Resize(CaseViewer: CaseViewer, NodeModel: NodeModel, HTMLDoc: HTMLDoc): void {
			super.Resize(CaseViewer, NodeModel, HTMLDoc);
			this.BodyRect.setAttribute("width", this.Width.toString());
			this.BodyRect.setAttribute("height", this.Height.toString());
		}

		SetColor(fill: string, stroke: string) {
			this.BodyRect.setAttribute("fill", fill);
			this.BodyRect.setAttribute("stroke", stroke);
		}

		GetColor(): {[index: string]: string} {
			return { "fill": this.BodyRect.getAttribute("fill"), "stroke": this.BodyRect.getAttribute("stroke") };
		}
	}

	export class StrategyShape extends SVGShape {
		BodyPolygon: SVGPolygonElement;
		delta: number =20;

		Render(CaseViewer: CaseViewer, NodeModel: NodeModel, HTMLDoc: HTMLDoc): void {
			super.Render(CaseViewer, NodeModel, HTMLDoc);
			this.BodyPolygon = <SVGPolygonElement>document.createSVGElement("polygon");
			this.ShapeGroup.appendChild(this.BodyPolygon);
			this.Resize(CaseViewer, NodeModel, HTMLDoc);
		}

		Resize(CaseViewer: CaseViewer, NodeModel: NodeModel, HTMLDoc: HTMLDoc): void {
			super.Resize(CaseViewer, NodeModel, HTMLDoc);
			this.BodyPolygon.setAttribute("points", ""+this.delta+",0 " + this.Width + ",0 " + (this.Width - this.delta) + "," + this.Height + " 0," + this.Height);
		}

		SetColor(fill: string, stroke: string) {
			this.BodyPolygon.setAttribute("fill", fill);
			this.BodyPolygon.setAttribute("stroke", stroke);
		}

		GetColor(): {[index: string]: string} {
			return { "fill": this.BodyPolygon.getAttribute("fill"), "stroke": this.BodyPolygon.getAttribute("stroke") };
		}

		GetConnectorPosition(Dir: Direction): Point {
			switch (Dir) {
				case Direction.Right:
					return new Point(this.Width - this.delta / 2, this.Height / 2);
				case Direction.Left:
					return new Point(this.delta / 2, this.Height / 2);
				case Direction.Top:
					return new Point(this.Width / 2, 0);
				case Direction.Bottom:
					return new Point(this.Width / 2, this.Height);
			}
		}
	}

	export class EvidenceShape extends SVGShape {
		BodyEllipse: SVGEllipseElement;

		Render(CaseViewer: CaseViewer, NodeModel: NodeModel, HTMLDoc: HTMLDoc): void {
			super.Render(CaseViewer, NodeModel, HTMLDoc);
			this.BodyEllipse = <SVGEllipseElement>document.createSVGElement("ellipse");
			this.ShapeGroup.appendChild(this.BodyEllipse);
			this.Resize(CaseViewer, NodeModel, HTMLDoc);
		}

		Resize(CaseViewer: CaseViewer, NodeModel: NodeModel, HTMLDoc: HTMLDoc): void {
			super.Resize(CaseViewer, NodeModel, HTMLDoc);
			this.BodyEllipse.setAttribute("cx", (this.Width / 2).toString());
			this.BodyEllipse.setAttribute("cy", (this.Height / 2).toString());
			this.BodyEllipse.setAttribute("rx", (this.Width / 2).toString());
			this.BodyEllipse.setAttribute("ry", (this.Height / 2).toString());
		}

		SetColor(fill: string, stroke: string) {
			this.BodyEllipse.setAttribute("fill", fill);
			this.BodyEllipse.setAttribute("stroke", stroke);
		}

		GetColor(): {[index: string]: string} {
			return { "fill": this.BodyEllipse.getAttribute("fill"), "stroke": this.BodyEllipse.getAttribute("stroke") };
		}
	}

	export class SVGShapeFactory {
		static Create(Type: NodeType): SVGShape {
			switch (Type) {
				case NodeType.Goal:
					return new GoalShape();
				case NodeType.Context:
					return new ContextShape();
				case NodeType.Strategy:
					return new StrategyShape();
				case NodeType.Evidence:
					return new EvidenceShape();
			}
		}
	}

	export class NodeView {
		CaseViewer: CaseViewer;
		Source: NodeModel;
		HTMLDoc: HTMLDoc;
		SVGShape: SVGShape;
		ParentShape: NodeView;

		IsArrowWhite: boolean = false;

		AbsX: number = 0;
		AbsY: number = 0;
		x: number = 0;
		y: number = 0;

		constructor(CaseViewer: CaseViewer, NodeModel: NodeModel) {
			this.CaseViewer = CaseViewer;
			this.Source = NodeModel;
			this.HTMLDoc = new HTMLDoc();
			this.HTMLDoc.Render(CaseViewer, NodeModel);
			this.SVGShape = SVGShapeFactory.Create(NodeModel.Type);
			this.SVGShape.Render(CaseViewer, NodeModel, this.HTMLDoc);
		}

		Resize(): void {
			this.HTMLDoc.Resize(this.CaseViewer, this.Source);
			this.SVGShape.Resize(this.CaseViewer, this.Source, this.HTMLDoc);
		}

		Height(): number {
			return this.HTMLDoc.Height;
		}

		Label(): string {
			return this.Source.Label;
		}

		Update(): void {
			this.Resize();
			this.HTMLDoc.SetPosition(this.AbsX, this.AbsY);
			this.SVGShape.SetPosition(this.AbsX, this.AbsY);
			if (this.ParentShape != null) {
				this.SVGShape.SetArrowColorWhite(this.IsArrowWhite);
			}
		}

		private AppendHTMLElement(svgroot: JQuery, divroot: JQuery, caseViewer : CaseViewer): void {
			divroot.append(this.HTMLDoc.DocBase);
			svgroot.append(this.SVGShape.ShapeGroup);
			this.InvokePlugInSVGRender(caseViewer);

			// if it has an parent, add an arrow element.
			if (this.ParentShape != null) {
				svgroot.append(this.SVGShape.ArrowPath);
			}
			if (this.Source.Type == NodeType.Goal && this.Source.Children.length == 0){
				svgroot.append((<GoalShape>this.SVGShape).UndevelopedSymbol);
			}
			this.Update();
		}

		AppendHTMLElementRecursive(svgroot: JQuery, divroot: JQuery, caseViewer : CaseViewer): void {
			var Children = this.Source.Children;
			var ViewMap = this.CaseViewer.ViewMap;
			for (var i = 0; i < Children.length; i++) {
				ViewMap[Children[i].Label].AppendHTMLElementRecursive(svgroot, divroot, caseViewer);
			}
			this.AppendHTMLElement(svgroot, divroot, caseViewer);
		}

	 	private DeleteHTMLElement(svgroot: JQuery, divroot: JQuery): void {
			this.HTMLDoc.DocBase.remove();
			$(this.SVGShape.ShapeGroup).remove();
			if (this.ParentShape != null) $(this.SVGShape.ArrowPath).remove();
			this.Update();
	 	}

	 	DeleteHTMLElementRecursive(svgroot: JQuery, divroot: JQuery): void {
			var Children = this.Source.Children;
			var ViewMap = this.CaseViewer.ViewMap;
			for (var i = 0; i < Children.length; i++) {
				ViewMap[Children[i].Label].DeleteHTMLElementRecursive(svgroot, divroot);
			}
			this.DeleteHTMLElement(svgroot, divroot);
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

		SetArrowPosition(p1: Point, p2: Point, dir: Direction) {
			this.SVGShape.SetArrowPosition(p1, p2, dir);
		}
	}

	export class CaseViewer {
		ViewMap: { [index: string]: NodeView; };
		ElementTop : NodeModel;
		static ElementWidth = 250;

		constructor(public Source: Case, public pluginManager : PlugInManager, public serverApi: ServerAPI, public Screen: ScreenManager) {
			this.InitViewMap(Source);
			this.Resize();
		}

		InitViewMap(Source: Case) {
			this.ViewMap = {};
			for (var elementkey in Source.ElementMap) {
				var element = Source.ElementMap[elementkey];
				this.ViewMap[element.Label] = new NodeView(this, element);
				if (element.Parent != null) {
					this.ViewMap[element.Label].ParentShape = this.ViewMap[element.Parent.Label];
				}
			}
			this.ElementTop = Source.ElementTop;
		}

		GetPlugInHTMLRender(PlugInName: string): (caseViewer: CaseViewer, caseModel: NodeModel, element: JQuery) => boolean {
			return (viewer: CaseViewer, model: NodeModel, e: JQuery) : boolean => {
				return this.pluginManager.HTMLRenderPlugInMap[PlugInName].Delegate(viewer, model, e);
			};
		}

		GetPlugInSVGRender(PlugInName: string): (caseViewer: CaseViewer, elementShape: NodeView) => boolean {
			return (viewer: CaseViewer, shape: NodeView) : boolean => {
				return this.pluginManager.SVGRenderPlugInMap[PlugInName].Delegate(viewer, shape);
			};
		}

		private Resize(): void {
			for (var shapekey in this.ViewMap) {
				this.ViewMap[shapekey].Resize();
			}
			this.LayoutElement();
		}

		Update(): void {
			this.Resize();
			for (var shapekey in this.ViewMap) {
				this.ViewMap[shapekey].Update();
			}
		}

		DeleteViewsRecursive(root : NodeView) : void {
			var Children = root.Source.Children;
			this.ViewMap[root.Source.Label].DeleteHTMLElementRecursive(null, null);
			delete this.ViewMap[root.Source.Label];
			for (var i = 0; i < Children.length; i++) {
				this.DeleteViewsRecursive(this.ViewMap[Children[i].Label]);
			}
		}

		private LayoutElement() : void {
			var layout: LayoutEnginePlugIn = this.pluginManager.GetLayoutEngine();
			layout.Init(this.ViewMap, this.ElementTop, 0, 0, CaseViewer.ElementWidth);
			layout.LayoutAllView(this.ElementTop, 0, 0);
		}

		private UpdateViewMapRecursive(model: NodeModel, view: NodeView) {
			for (var i in model.Children) {
				var child_model: NodeModel = model.Children[i];
				var child_view = this.ViewMap[child_model.Label];
				if (child_view == null) {
					child_view = new NodeView(this, child_model);
					this.ViewMap[child_model.Label] = child_view;
					child_view.ParentShape = view;
				}
				this.UpdateViewMapRecursive(child_model, child_view);
			}
		}

		private UpdateViewMap() : void {
			this.UpdateViewMapRecursive(this.ElementTop, this.ViewMap[this.ElementTop.Label]);
		}

		Draw(): void {
			var shapelayer = $(this.Screen.ShapeLayer);
			var screenlayer = $(this.Screen.ContentLayer);
			this.UpdateViewMap();
			this.ViewMap[this.ElementTop.Label].AppendHTMLElementRecursive(shapelayer, screenlayer, this);
			this.pluginManager.RegisterActionEventListeners(this, this.Source, this.serverApi);
			this.Update();
		}
	}

	export class ScrollManager {
		InitialOffsetX: number = 0;
		InitialOffsetY: number = 0;
		InitialX: number = 0;
		InitialY: number = 0;
		CurrentX: number = 0;
		CurrentY: number = 0;
		MainPointerID: number = 0;
		Pointers: Pointer[] = [];

		private SetInitialOffset(InitialOffsetX: number, InitialOffsetY: number) {
			this.InitialOffsetX = InitialOffsetX;
			this.InitialOffsetY = InitialOffsetY;
		}

		private StartDrag(InitialX: number, InitialY: number) {
			this.InitialX = InitialX;
			this.InitialY = InitialY;
		}

		private UpdateDrag(CurrentX: number, CurrentY: number) {
			this.CurrentX = CurrentX;
			this.CurrentY = CurrentY;
		}

		private CalcOffsetX(): number {
			return this.CurrentX - this.InitialX + this.InitialOffsetX;
		}

		private CalcOffsetY(): number {
			return this.CurrentY - this.InitialY + this.InitialOffsetY;
		}

		private GetMainPointer(): Pointer {
			for (var i = 0; i < this.Pointers.length; ++i) {
				if (this.Pointers[i].identifier === this.MainPointerID) {
					return this.Pointers[i]
				}
			};
			return null;
		}

		private IsDragging(): boolean {
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

	export class ScreenManager {

		ScrollManager: ScrollManager = new ScrollManager();
		private OffsetX: number = 0;
		private OffsetY: number = 0;
		private LogicalOffsetX: number = 0;
		private LogicalOffsetY: number = 0;
		private Scale: number = 1;

		constructor(public ShapeLayer: SVGGElement, public ContentLayer: HTMLDivElement, public ControlLayer: HTMLDivElement, public BackGroundLayer: HTMLDivElement) {
			this.ContentLayer.style["transformOrigin"]       = "left top";
			this.ContentLayer.style["MozTransformOrigin"]    = "left top";
			this.ContentLayer.style["msTransformOrigin"]     = "left top";
			this.ContentLayer.style["OTransformOrigin"]      = "left top";
			this.ContentLayer.style["webkitTransformOrigin"] = "left top";
			this.ControlLayer.style["transformOrigin"]       = "left top";
			this.ControlLayer.style["MozTransformOrigin"]    = "left top";
			this.ControlLayer.style["msTransformOrigin"]     = "left top";
			this.ControlLayer.style["OTransformOrigin"]      = "left top";
			this.ControlLayer.style["webkitTransformOrigin"] = "left top";
			this.UpdateAttr();
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

		private static translateA(x: number, y: number): string {
			return "translate(" + x + " " + y + ") ";
		}

		private static scaleA(scale: number): string {
			return "scale(" + scale + ") ";
		}

		private static translateS(x: number, y: number): string {
			return "translate(" + x + "px, " + y + "px) ";
		}

		private static scaleS(scale: number): string {
			return "scale(" + scale + ") ";
		}

		private UpdateAttr(): void {
			var attr: string = ScreenManager.translateA(this.OffsetX, this.OffsetY) + ScreenManager.scaleA(this.Scale);
			var style: string = ScreenManager.translateS(this.OffsetX, this.OffsetY) + ScreenManager.scaleS(this.Scale);
			this.ShapeLayer.setAttribute("transform", attr);
			this.ContentLayer.style["transform"]       = style;
			this.ContentLayer.style["MozTransform"]    = style;
			this.ContentLayer.style["webkitTransform"] = style;
			this.ContentLayer.style["msTransform"]     = style;
			this.ContentLayer.style["OTransform"]      = style;
			this.ControlLayer.style["transform"]       = style;
			this.ControlLayer.style["MozTransform"]    = style;
			this.ControlLayer.style["webkitTransform"] = style;
			this.ControlLayer.style["msTransform"]     = style;
			this.ControlLayer.style["OTransform"]      = style;
		}

		SetScale(scale: number): void {
			this.Scale = scale;
			var cx = this.GetPageCenterX();
			var cy = this.GetPageCenterY();
			this.OffsetX = (this.LogicalOffsetX - cx) * scale + cx;
			this.OffsetY = (this.LogicalOffsetY - cy) * scale + cy;
			this.UpdateAttr();
		}

		SetOffset(x: number, y: number): void {
			this.OffsetX = x;
			this.OffsetY = y;
			this.LogicalOffsetX = this.CalcLogicalOffsetX(x);
			this.LogicalOffsetY = this.CalcLogicalOffsetY(y);
			this.UpdateAttr();
		}

		SetLogicalOffset(x: number, y: number, scale?: number): void {
			this.LogicalOffsetX = x;
			this.LogicalOffsetY = y;
			this.SetScale(scale || this.Scale);
		}

		GetLogicalOffsetX(): number {
			return this.LogicalOffsetX;
		}

		GetLogicalOffsetY(): number {
			return this.LogicalOffsetY;
		}

		private CalcLogicalOffsetX(OffsetX: number): number {
			var cx = this.GetPageCenterX();
			return (OffsetX - cx) / this.Scale + cx;
		}

		private CalcLogicalOffsetY(OffsetY: number): number {
			var cy = this.GetPageCenterY();
			return (OffsetY - cy) / this.Scale + cy;
		}

		CalcLogicalOffsetXFromPageX(PageX: number): number {
			return this.GetLogicalOffsetX() - (PageX - this.GetPageCenterX()) / this.Scale;
		}

		CalcLogicalOffsetYFromPageY(PageY: number): number {
			return this.GetLogicalOffsetY() - (PageY - this.GetPageCenterY()) / this.Scale;
		}

		GetOffsetX(): number {
			return this.OffsetX;
		}

		GetOffsetY(): number {
			return this.OffsetY;
		}

		GetWidth(): number {
			return document.body.clientWidth;
		}

		GetHeight(): number {
			return document.body.clientHeight;
		}

		GetPageCenterX(): number {
			return this.GetWidth() / 2;
		}

		GetPageCenterY(): number {
			return this.GetHeight() / 2;
		}

		GetCaseWidth(): number {
			return $("#layer0")[0].getBoundingClientRect().width;
		}

		GetCaseHeight(): number {
			return $("#layer0")[0].getBoundingClientRect().height;
		}

		SetCaseCenter(DCaseX: number, DCaseY: number, HTMLDoc: HTMLDoc): void {
			var NewOffsetX = this.OffsetX + (this.GetPageCenterX() - (this.OffsetX + DCaseX)) - HTMLDoc.Width/2;
			var NewOffsetY = this.OffsetY + (this.GetPageCenterY() - (this.OffsetY + DCaseY)) - HTMLDoc.Height/2;
			this.SetOffset(NewOffsetX, NewOffsetY);
		}

	}
}
