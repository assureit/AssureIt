/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var DefaultColorThemePlugIn = (function (_super) {
    __extends(DefaultColorThemePlugIn, _super);
    function DefaultColorThemePlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.ActionPlugIn = new ColorThemeActionPlugIn(plugInManager);
        this.SVGRenderPlugIn = new DefaultColorThemeSVGRenderPlugIn(plugInManager);
    }
    return DefaultColorThemePlugIn;
})(AssureIt.PlugInSet);

var TiffanyBlueThemePlugIn = (function (_super) {
    __extends(TiffanyBlueThemePlugIn, _super);
    function TiffanyBlueThemePlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.ActionPlugIn = new ColorThemeActionPlugIn(plugInManager);
        this.SVGRenderPlugIn = new TiffanyBlueThemeSVGRenderPlugIn(plugInManager);
    }
    return TiffanyBlueThemePlugIn;
})(AssureIt.PlugInSet);

var SimpleColorThemePlugIn = (function (_super) {
    __extends(SimpleColorThemePlugIn, _super);
    function SimpleColorThemePlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.ActionPlugIn = new ColorThemeActionPlugIn(plugInManager);
        this.SVGRenderPlugIn = new SimpleColorThemeSVGRenderPlugIn(plugInManager);
    }
    return SimpleColorThemePlugIn;
})(AssureIt.PlugInSet);

var ColorThemeSVGRenderPlugIn = (function (_super) {
    __extends(ColorThemeSVGRenderPlugIn, _super);
    function ColorThemeSVGRenderPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.stroke = {
            "Goal": "none",
            "Strategy": "none",
            "Context": "none",
            "Evidence": "none",
            "Diff": "#FF0000"
        };
    }
    ColorThemeSVGRenderPlugIn.prototype.IsEnable = function (caseViewer, element) {
        return true;
    };

    ColorThemeSVGRenderPlugIn.prototype.Delegate = function (caseViewer, nodeView) {
        var thisNodeType = nodeView.Source.Type;

        var fill = "none";
        var stroke = "none";
        switch (thisNodeType) {
            case AssureIt.NodeType.Goal:
                fill = this.fill.Goal;
                stroke = this.stroke.Goal;
                break;
            case AssureIt.NodeType.Strategy:
                fill = this.fill.Strategy;
                stroke = this.stroke.Strategy;
                break;
            case AssureIt.NodeType.Context:
                fill = this.fill.Context;
                stroke = this.stroke.Context;
                break;
            case AssureIt.NodeType.Evidence:
                fill = this.fill.Evidence;
                stroke = this.stroke.Evidence;
                break;
            default:
                break;
        }

        if (nodeView.Source.HasDiff) {
            stroke = this.stroke.Diff;
        }

        var temporaryColor = nodeView.GetTemporaryColor();

        if (temporaryColor == null) {
            nodeView.SVGShape.SetColor(fill, stroke);
        } else {
            nodeView.SVGShape.SetColor(temporaryColor["fill"], temporaryColor["stroke"]);
        }

        return true;
    };
    return ColorThemeSVGRenderPlugIn;
})(AssureIt.SVGRenderPlugIn);

var DefaultColorThemeSVGRenderPlugIn = (function (_super) {
    __extends(DefaultColorThemeSVGRenderPlugIn, _super);
    function DefaultColorThemeSVGRenderPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.fill = {
            "Goal": "#E0E0E0",
            "Strategy": "#C0C0C0",
            "Context": "#B0B0B0",
            "Evidence": "#D0D0D0"
        };
    }
    return DefaultColorThemeSVGRenderPlugIn;
})(ColorThemeSVGRenderPlugIn);

var TiffanyBlueThemeSVGRenderPlugIn = (function (_super) {
    __extends(TiffanyBlueThemeSVGRenderPlugIn, _super);
    function TiffanyBlueThemeSVGRenderPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.fill = {
            "Goal": "#b4d8df",
            "Strategy": "#b4d8df",
            "Context": "#dbf5f3",
            "Evidence": "#dbf5f3"
        };
    }
    return TiffanyBlueThemeSVGRenderPlugIn;
})(ColorThemeSVGRenderPlugIn);

var SimpleColorThemeSVGRenderPlugIn = (function (_super) {
    __extends(SimpleColorThemeSVGRenderPlugIn, _super);
    function SimpleColorThemeSVGRenderPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.stroke = {
            "Goal": "#000000",
            "Strategy": "#000000",
            "Context": "#000000",
            "Evidence": "#000000",
            "Diff": "#FF0000"
        };
        this.fill = {
            "Goal": "#ffffff",
            "Strategy": "#ffffff",
            "Context": "#ffffff",
            "Evidence": "#ffffff"
        };
    }
    return SimpleColorThemeSVGRenderPlugIn;
})(ColorThemeSVGRenderPlugIn);

var ColorThemeActionPlugIn = (function (_super) {
    __extends(ColorThemeActionPlugIn, _super);
    function ColorThemeActionPlugIn() {
        _super.apply(this, arguments);
        this.currentNodeColor = {};
    }
    ColorThemeActionPlugIn.prototype.IsEnabled = function (caseViewer, case0) {
        return true;
    };

    ColorThemeActionPlugIn.prototype.Delegate = function (caseViewer, case0, serverApi) {
        var self = this;

        $('.node').hover(function () {
            var thisNodeLabel = $(this).children('h4').text();
            self.currentNodeColor = caseViewer.ViewMap[thisNodeLabel].SVGShape.GetColor();
            caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(self.currentNodeColor["fill"], "orange");
        }, function () {
            var thisNodeLabel = $(this).children('h4').text();
            caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(self.currentNodeColor["fill"], self.currentNodeColor["stroke"]);
        });

        return true;
    };
    return ColorThemeActionPlugIn;
})(AssureIt.ActionPlugIn);
