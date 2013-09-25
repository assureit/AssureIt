/// <reference path="../../src/CaseViewer.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Scale = (function () {
    function Scale(ScreenManager) {
        this.IsScaledUp = false;
        this.ScreenManager = ScreenManager;
    }
    Scale.prototype.Up = function (e) {
        this.ScaleRate = this.ScreenManager.GetScaleRate();

        if (this.ScaleRate >= 1.0) {
            /* We don't have to scale the view up */
            return false;
        }

        this.OriginalOffsetX = this.ScreenManager.GetLogicalOffsetX();
        this.OriginalOffsetY = this.ScreenManager.GetLogicalOffsetY();

        this.Zoom(0, 0, 1.0, this.ScaleRate, 500);
        return true;
    };

    Scale.prototype.DownAtOriginalPlace = function (e) {
        this.Zoom(this.OriginalOffsetX, this.OriginalOffsetY, this.ScaleRate, 1.0, 500);
    };

    Scale.prototype.DownAtCurrentPlace = function (e) {
        var x = this.ScreenManager.CalcLogicalOffsetXFromPageX(e.pageX);
        var y = this.ScreenManager.CalcLogicalOffsetYFromPageY(e.pageY);

        this.Zoom(x, y, this.ScaleRate, 1.0, 500);
    };

    Scale.prototype.Zoom = function (logicalOffsetX, logicalOffsetY, initialS, target, duration) {
        var _this = this;
        var cycle = 1000 / 30;
        var cycles = duration / cycle;
        var initialX = this.ScreenManager.GetLogicalOffsetX();
        var initialY = this.ScreenManager.GetLogicalOffsetY();
        var deltaS = (target - initialS) / cycles;
        var deltaX = (logicalOffsetX - initialX) / cycles;
        var deltaY = (logicalOffsetY - initialY) / cycles;

        var currentS = initialS;
        var currentX = initialX;
        var currentY = initialY;
        var count = 0;

        var zoom = function () {
            if (count < cycles) {
                count += 1;
                currentS += deltaS;
                currentX += deltaX;
                currentY += deltaY;
                _this.ScreenManager.SetLogicalOffset(currentX, currentY, currentS);
                setTimeout(zoom, cycle);
            } else {
                _this.ScreenManager.SetScale(1);
                _this.ScreenManager.SetLogicalOffset(logicalOffsetX, logicalOffsetY, target);
            }
        };
        zoom();
    };
    return Scale;
})();

var ScalePlugIn = (function (_super) {
    __extends(ScalePlugIn, _super);
    function ScalePlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.ActionPlugIn = new ScaleActionPlugIn(plugInManager);
    }
    return ScalePlugIn;
})(AssureIt.PlugInSet);

var ScaleActionPlugIn = (function (_super) {
    __extends(ScaleActionPlugIn, _super);
    function ScaleActionPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.Scale == null;
    }
    ScaleActionPlugIn.prototype.IsEnabled = function (caseViewer, case0) {
        return true;
    };

    ScaleActionPlugIn.prototype.Delegate = function (caseViewer, case0, serverApi) {
        if (this.Scale == null) {
            this.Scale = new Scale(caseViewer.Screen);
            var self = this;

            this.EscapeKeyEventHandler = function (e) {
                if (e.keyCode == 27) {
                    e.stopPropagation();
                    if (self.Scale.IsScaledUp) {
                        self.Scale.DownAtOriginalPlace(e);
                        self.Scale.IsScaledUp = false;
                    } else {
                        self.Scale.IsScaledUp = self.Scale.Up(e);
                    }
                }
            };

            this.ClickEventHandler = function (e) {
            };

            this.DoubleClickEventHandler = function (e) {
                if (self.Scale.IsScaledUp) {
                    self.Scale.DownAtCurrentPlace(e);
                    self.Scale.IsScaledUp = false;
                }
            };

            $('body').keydown(this.EscapeKeyEventHandler);

            $('#background').click(this.ClickEventHandler);

            $('#background').dblclick(this.DoubleClickEventHandler);
        }

        return true;
    };

    ScaleActionPlugIn.prototype.DisableEvent = function (caseViewer, case0, serverApi) {
        $('body').unbind('keydown', this.EscapeKeyEventHandler);
        $('#background').unbind('click', this.ClickEventHandler);
        $('#background').unbind('dblclick', this.DoubleClickEventHandler);
    };
    return ScaleActionPlugIn;
})(AssureIt.ActionPlugIn);
