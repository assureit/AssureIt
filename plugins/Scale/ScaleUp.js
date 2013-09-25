///<reference path='../../d.ts/jquery.d.ts'/>
///<reference path='../../src/CaseModel.ts'/>
///<reference path='../../src/CaseViewer.ts'/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ScaleUpPlugIn = (function (_super) {
    __extends(ScaleUpPlugIn, _super);
    function ScaleUpPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.ActionPlugIn = new ScaleUpActionPlugIn(plugInManager);
    }
    return ScaleUpPlugIn;
})(AssureIt.PlugInSet);

var ScaleUpActionPlugIn = (function (_super) {
    __extends(ScaleUpActionPlugIn, _super);
    function ScaleUpActionPlugIn(plugInManager) {
        this.ScreenManager = null;
        this.THRESHHOLD = 0.5;
        this.ShapeGroup = null;
        this.DocBase = null;
        _super.call(this, plugInManager);
    }
    ScaleUpActionPlugIn.prototype.IsEnabled = function (caseViewer, case0) {
        return true;
    };

    ScaleUpActionPlugIn.prototype.SetPosition = function (x, y) {
        console.log(x, y);

        //x = $('#layer0').position().left;
        //y = $('#layer0').position().top;
        var mat = ((this.ShapeGroup[0])).transform.baseVal.getItem(0).matrix;
        mat.e = x;
        mat.f = y;

        this.DocBase.css({ left: x + "px", top: y + "px" });
    };

    ScaleUpActionPlugIn.prototype.Delegate = function (caseViewer, case0, serverApi) {
        var self = this;
        this.ScreenManager = caseViewer.Screen;

        //$('.node').unbind('mouseenter').unbind('mouseleave');
        $('.node').hover(function (e) {
            var scale = self.ScreenManager.GetScale();
            if (scale < self.THRESHHOLD) {
                var label = $(this).children('h4').text();
                var view = caseViewer.ViewMap[label];
                var oldShapeGroup = view.SVGShape.ShapeGroup;
                var oldDocBase = view.HTMLDoc.DocBase;

                self.oldLayer1 = $('#layer1');
                self.Layer0box = $('#layer0box').clone();
                self.Layer0 = self.Layer0box.children('g');
                self.Layer0.empty();
                self.Layer1 = $('#layer1').clone();
                self.Layer1.empty();

                self.ShapeGroup = $(oldShapeGroup).clone();
                self.ShapeGroup.attr("transform", "scale(" + (1 / caseViewer.Screen.GetScale()) + ")");
                self.ShapeGroup.appendTo(self.Layer0);
                self.ShapeGroup.children('rect,polygon,ellipse').attr('stroke', 'orange');

                self.DocBase = oldDocBase.clone();
                self.DocBase.attr("style", self.DocBase.attr("style") + "-webkit-transform-origin: 0% 0%;-webkit-transform: scale(" + (1 / caseViewer.Screen.GetScale()) + ")");
                self.DocBase.appendTo(self.Layer1);

                var left = oldDocBase.css('left');
                var top = oldDocBase.css('top');
                self.SetPosition(Number(left.substr(0, left.length - 2)) + 100 * (1 / scale), Number(top.substr(0, top.length - 2)) - 100 * (1 / scale));
                self.Layer0box.appendTo('#viewer');
                self.Layer1.appendTo('#viewer');
                $(this).appendTo(self.Layer1);
                $(this).clone(true).appendTo(self.oldLayer1);

                return;
            }
        }, function () {
            self.removeElement();
        });
        return true;
    };
    ScaleUpActionPlugIn.prototype.removeElement = function () {
        if (this.ShapeGroup) {
            this.Layer0box.remove();
            this.Layer1.remove();
            this.Layer0box = null;
            this.Layer0 = null;
            this.Layer1 = null;
            this.ShapeGroup = null;
            this.DocBase = null;
        }
    };
    return ScaleUpActionPlugIn;
})(AssureIt.ActionPlugIn);
