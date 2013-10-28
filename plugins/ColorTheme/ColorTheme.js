/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
//class DefaultColorThemePlugIn extends AssureIt.PlugInSet {
//
//	constructor(public plugInManager: AssureIt.PlugInManager) {
//		super(plugInManager);
//		this.ActionPlugIn = new ColorThemeActionPlugIn(plugInManager);
//		this.SVGRenderPlugIn = new DefaultColorThemeSVGRenderPlugIn(plugInManager);
//	}
//
//}
var TiffanyBlueThemePlugIn = (function (_super) {
    __extends(TiffanyBlueThemePlugIn, _super);
    function TiffanyBlueThemePlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.ActionPlugIn = new HoverActionPlugIn(plugInManager);
    }
    return TiffanyBlueThemePlugIn;
})(AssureIt.PlugInSet);

//class SimpleColorThemePlugIn extends AssureIt.PlugInSet {
//
//	constructor(public plugInManager: AssureIt.PlugInManager) {
//		super(plugInManager);
//		this.ActionPlugIn = new ColorThemeActionPlugIn(plugInManager);
//		this.SVGRenderPlugIn = new SimpleColorThemeSVGRenderPlugIn(plugInManager);
//	}
//
//}
//
//class ColorThemeSVGRenderPlugIn extends AssureIt.SVGRenderPlugIn {
//
//	stroke: any;
//	fill  : any;
//
//	constructor(public plugInManager: AssureIt.PlugInManager) {
//		super(plugInManager);
//		this.stroke = {
//			"Goal":     "none",
//			"Strategy": "none",
//			"Context":  "none",
//			"Evidence": "none",
//			"Diff": "#FF0000"
//		};
//	}
//
//	IsEnable(caseViewer: AssureIt.CaseViewer, element: JQuery): boolean {
//		return true;
//	}
//
//	Delegate(caseViewer: AssureIt.CaseViewer, nodeView: AssureIt.NodeView): boolean {
//		var thisNodeType: AssureIt.NodeType = nodeView.Source.Type;
//
//		var fill   :string = "none";
//		var stroke :string = "none";
//		switch(thisNodeType) {
//			case AssureIt.NodeType.Goal:
//				fill = this.fill.Goal;
//				stroke = this.stroke.Goal;
//				break;
//			case AssureIt.NodeType.Strategy:
//				fill = this.fill.Strategy;
//				stroke = this.stroke.Strategy;
//				break;
//			case AssureIt.NodeType.Context:
//				fill = this.fill.Context;
//				stroke = this.stroke.Context;
//				break;
//			case AssureIt.NodeType.Evidence:
//				fill = this.fill.Evidence;
//				stroke = this.stroke.Evidence;
//				break;
//			default:
//				break;
//		}
//
//		if(nodeView.Source.HasDiff) {
//			stroke = this.stroke.Diff;
//		}
//
//		var temporaryColor = nodeView.GetTemporaryColor();
//
//		if(temporaryColor == null) {
//			nodeView.SVGShape.SetColor(fill, stroke);
//		}
//		else {
//			nodeView.SVGShape.SetColor(temporaryColor["fill"], temporaryColor["stroke"]);
//		}
//
//		return true;
//	}
//
//}
//class DefaultColorThemeSVGRenderPlugIn extends ColorThemeSVGRenderPlugIn {
//
//	constructor(public plugInManager: AssureIt.PlugInManager) {
//		super(plugInManager);
//		this.fill = {
//			"Goal":     "#E0E0E0",
//			"Strategy": "#C0C0C0",
//			"Context":  "#B0B0B0",
//			"Evidence": "#D0D0D0"
//		};
//	}
//
//}
//
//class TiffanyBlueThemeSVGRenderPlugIn extends ColorThemeSVGRenderPlugIn {
//
//	constructor(public plugInManager: AssureIt.PlugInManager) {
//		super(plugInManager);
//		this.fill = {
//			"Goal":     "#b4d8df",
//			"Strategy": "#b4d8df",
//			"Context":  "#dbf5f3",
//			"Evidence": "#dbf5f3"
//		};
//	}
//
//}
//
//class SimpleColorThemeSVGRenderPlugIn extends ColorThemeSVGRenderPlugIn {
//
//	constructor(public plugInManager: AssureIt.PlugInManager) {
//		super(plugInManager);
//		this.stroke = {
//			"Goal":     "#000000",
//			"Strategy": "#000000",
//			"Context":  "#000000",
//			"Evidence": "#000000",
//			"Diff": "#FF0000"
//		};
//		this.fill = {
//			"Goal":     "#ffffff",
//			"Strategy": "#ffffff",
//			"Context":  "#ffffff",
//			"Evidence": "#ffffff"
//		};
//	}
//
//}
var HoverActionPlugIn = (function (_super) {
    __extends(HoverActionPlugIn, _super);
    function HoverActionPlugIn() {
        _super.apply(this, arguments);
    }
    HoverActionPlugIn.prototype.IsEnabled = function (caseViewer, case0) {
        return true;
    };

    HoverActionPlugIn.prototype.Delegate = function (caseViewer, case0, serverApi) {
        $('.node').hover(function () {
            var thisNodeLabel = $(this).children('h4').text();
            caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(AssureIt.Color.HighLight);
        }, function () {
            var thisNodeLabel = $(this).children('h4').text();
            caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(AssureIt.Color.Default);
        });

        return true;
    };
    return HoverActionPlugIn;
})(AssureIt.ActionPlugIn);
