var DScriptPaneManager = (function () {
    function DScriptPaneManager(parentWidget, widget0, keepStyle) {
        if (typeof keepStyle === "undefined") { keepStyle = false; }
        this.ParentWidget = parentWidget;
        this.Widgets = [widget0.get(0)];
        this.Options = {};
        this.RefreshFunc = function () {
        };
        this.ButtonUtil = this.CreateButtonUtil();

        var frame = this.CreateFrame();
        if (widget0 != null) {
            parentWidget.append(frame.append(widget0.addClass("managed-widget")));
        } else {
            parentWidget.append(frame.append(this.CreateDefaultWidget().addClass("managed-widget")));
        }
        DScriptPaneManager.ExpandWidget(frame);
        if (!keepStyle)
            DScriptPaneManager.ExpandWidget(widget0);
    }
    DScriptPaneManager.ExpandWidget = function (widget) {
        widget.css({
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%'
        });
    };
    DScriptPaneManager.CopyStyle = function (src, dist) {
        dist.css({
            top: src.css("top"),
            left: src.css("left"),
            height: src.css("height"),
            width: src.css("width"),
            borderRightWidth: src.css("border-right-width"),
            borderLeftWidth: src.css("border-left-width"),
            borderTopWidth: src.css("border-top-width"),
            borderBottomWidth: src.css("border-bottom-width")
        });
    };

    DScriptPaneManager.prototype.AddToOptionsList = function (widget, name, overrideFlag, keepStyle) {
        if (typeof keepStyle === "undefined") { keepStyle = false; }
        if (name in this.Options && !overrideFlag) {
            console.log("DScriptPaneManaer:Warning!! Cannot append the Option " + name);
        } else {
            if (!keepStyle)
                DScriptPaneManager.ExpandWidget(widget);
            this.Options[name] = widget;
        }
    };

    DScriptPaneManager.prototype.SetRefreshFunc = function (func) {
        this.RefreshFunc = func;
    };
    DScriptPaneManager.prototype.Refresh = function () {
        var self = this;
        $(".managed-frame").each(function () {
            self.CheckFrameSize($(this));
        });
        self.RefreshFunc();
    };

    DScriptPaneManager.prototype.RefreshDefaultWidget = function () {
        var usedList = [];
        for (var key in this.Options) {
            if (this.Widgets.indexOf(this.Options[key].get(0)) != -1) {
                usedList.push(key);
            }
        }
        $(".widget-select-button").each(function () {
            var self = $(this);
            if (usedList.indexOf(self.text()) != -1) {
                self.css("display", "none");
            } else {
                self.css("display", "block");
            }
        });
        $(".default-widget").each(function () {
            var self = $(this);
            if (self.children(":first").css("display") == "none") {
                self.css("margin-top", "1px");
            } else {
                self.css("margin-top", "0px");
            }
        });
    };

    DScriptPaneManager.prototype.CreateDefaultWidget = function () {
        var defaultWidget = $("<div/>").addClass("btn-group-vertical default-widget");
        var self = this;
        for (var key in self.Options) {
            var newButton = $("<button/>");
            newButton.text(key);
            newButton.addClass("btn btn-default widget-select-button");
            newButton.click(function () {
                var frame = defaultWidget.parent();
                var widget = self.Options[$(this).text()];
                widget.addClass("managed-widget");
                self.Widgets.push(widget.get(0));
                frame.append(widget);
                defaultWidget.remove();
                self.RefreshDefaultWidget();
                self.RefreshFunc();
            });
            newButton.css({
                overflow: "hidden",
                textOverflow: "ellipsis"
            });
            if (this.Widgets.indexOf(self.Options[key].get(0)) != -1)
                newButton.css("display", "none");
            defaultWidget.append(newButton);
        }
        return defaultWidget;
    };

    DScriptPaneManager.prototype.CheckFrameSize = function (frame) {
        var vButton = frame.children(".widget-split-button.vertical");
        var hButton = frame.children(".widget-split-button.horizontal");
        var vCtx = vButton.get(0).getContext("2d");
        var hCtx = hButton.get(0).getContext("2d");
        this.ButtonUtil.CanvasClear(vCtx);
        this.ButtonUtil.CanvasClear(hCtx);
        vButton.unbind("click");
        hButton.unbind("click");
        if (Number(frame.css("width").replace("px", "")) < this.ButtonUtil.Size * 3) {
            this.ButtonUtil.CanvasRenderVButton(vCtx, "#CCCCCC");
        } else {
            this.ButtonUtil.CanvasRenderVButton(vCtx);
            vButton.bind("click", { frame: frame }, this.ButtonUtil.VSplit);
        }
        if (Number(frame.css("height").replace("px", "")) < this.ButtonUtil.Size * 6) {
            this.ButtonUtil.CanvasRenderHButton(hCtx, "#CCCCCC");
        } else {
            this.ButtonUtil.CanvasRenderHButton(hCtx);
            hButton.bind("click", { frame: frame }, this.ButtonUtil.HSplit);
        }

        var childrenFrame = frame.children(".managed-frame");
        if (childrenFrame.length > 0) {
            var self = this;
            childrenFrame.each(function () {
                self.CheckFrameSize($(this));
            });
        }
    };

    DScriptPaneManager.prototype.CreateFrame = function () {
        var self = this;
        var newFrame = $("<div/>");

        var buttonUp = $("<canvas width='${size}px' height='${size}px'></canvas>".replace(/\$\{size\}/g, String(this.ButtonUtil.Size)));
        buttonUp.css({
            position: "absolute",
            right: 0,
            top: 0,
            zIndex: 10
        });
        var ctx = buttonUp.get(0).getContext("2d");
        this.ButtonUtil.CanvasRenderHButton(ctx);
        buttonUp.bind("click", { frame: newFrame }, this.ButtonUtil.HSplit);
        var buttonLeft = $("<canvas width='${size}px' height='${size}px'></canvas>".replace(/\$\{size\}/g, String(this.ButtonUtil.Size)));
        buttonLeft.css({
            position: "absolute",
            right: 0,
            top: this.ButtonUtil.Size,
            zIndex: 10
        });
        var ctx = buttonLeft.get(0).getContext("2d");
        this.ButtonUtil.CanvasRenderVButton(ctx);
        buttonLeft.bind("click", { frame: newFrame }, this.ButtonUtil.VSplit);
        var buttonDelete = $("<canvas width='${size}px' height='${size}px'></canvas>".replace(/\$\{size\}/g, String(this.ButtonUtil.Size)));
        buttonDelete.css({
            position: "absolute",
            right: 0,
            top: this.ButtonUtil.Size * 2,
            zIndex: 10
        });
        var ctx = buttonDelete.get(0).getContext("2d");
        this.ButtonUtil.CanvasRenderDeleteButton(ctx);
        buttonDelete.bind("click", { frame: newFrame }, this.ButtonUtil.Delete);

        newFrame.append(buttonUp);
        newFrame.append(buttonLeft);
        newFrame.append(buttonDelete);
        newFrame.addClass("managed-frame");
        newFrame.css({
            borderColor: "#000000",
            borderStyle: "solid",
            borderWidth: 0
        });
        newFrame.children("canvas").addClass("widget-split-button");
        buttonUp.addClass("horizontal");
        buttonLeft.addClass("vertical");

        return newFrame;
    };

    DScriptPaneManager.prototype.DeleteWidget = function (locatedWidget) {
        var currentFrame = locatedWidget.parent(".managed-frame");
        var parentFrame = currentFrame.parent(".managed-frame");
        var siblingFrame = currentFrame.siblings(".managed-frame");
        var idx = this.Widgets.indexOf(locatedWidget.get(0));
        if (idx != -1)
            this.Widgets.splice(idx, 1);
        if (parentFrame.length == 0) {
            var newWidget = this.CreateDefaultWidget().addClass("managed-widget");
            DScriptPaneManager.ExpandWidget(newWidget);
            locatedWidget.after(newWidget);
            locatedWidget.remove();
            this.CheckFrameSize(currentFrame);
        } else {
            DScriptPaneManager.CopyStyle(parentFrame, siblingFrame);
            parentFrame.parent().append(siblingFrame);
            parentFrame = currentFrame.parent(".managed-frame");
            parentFrame.remove();
            this.CheckFrameSize(siblingFrame);
        }
        this.RefreshDefaultWidget();
        this.RefreshFunc();
    };

    DScriptPaneManager.prototype.ShowWidget = function (widgetName) {
        var newWidget = this.Options[widgetName];
        if (newWidget != null) {
            var topFrame = this.ParentWidget.children(".managed-frame");
            topFrame.remove();
            topFrame = this.CreateFrame();
            this.ParentWidget.append(topFrame.append(newWidget.addClass("managed-widget")));
            DScriptPaneManager.ExpandWidget(topFrame);
            this.Widgets = [newWidget.get(0)];
        } else {
            console.log("DScriptPaneManager:Error!! cannot show widget, because the widget named " + widgetName + " is not exist");
        }
    };

    DScriptPaneManager.prototype.AddWidgetCommon = function (locatedWidget, newWidget, keepStyle) {
        if (typeof keepStyle === "undefined") { keepStyle = false; }
        var ret = false;
        var index = this.Widgets.indexOf(locatedWidget.get(0));
        var isDefaultWidget = locatedWidget.hasClass("default-widget");
        if (index != -1 || isDefaultWidget) {
            ret = true;
            newWidget.addClass("managed-widget");
            if (!isDefaultWidget)
                this.Widgets.push(newWidget.get(0));
            var childFrame1 = this.CreateFrame();
            var childFrame2 = this.CreateFrame();
            var parentFrame = locatedWidget.parent();
            childFrame1.append(locatedWidget);
            childFrame2.append(newWidget);
            if (!keepStyle)
                DScriptPaneManager.ExpandWidget(newWidget);
            parentFrame.children(".widget-split-button").css("display", "none");
            parentFrame.append(childFrame1).append(childFrame2);
            this.RefreshDefaultWidget();
            this.RefreshFunc();
        } else {
        }
        return ret;
    };

    DScriptPaneManager.prototype.AddWidgetOnRight = function (locatedWidget, newWidget, keepStyle) {
        if (typeof keepStyle === "undefined") { keepStyle = false; }
        var ret = false;
        if (this.AddWidgetCommon(locatedWidget, newWidget, keepStyle)) {
            locatedWidget.parent().css({
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '50%',
                borderRightWidth: '1px'
            });
            newWidget.parent().css({
                position: 'absolute',
                top: 0,
                left: '50%',
                height: '100%',
                width: '50%'
            });
        } else {
        }
        this.CheckFrameSize(locatedWidget.parent());
        this.CheckFrameSize(newWidget.parent());
    };

    DScriptPaneManager.prototype.AddWidgetOnLeft = function (locatedWidget, newWidget, keepStyle) {
        if (typeof keepStyle === "undefined") { keepStyle = false; }
        var ret = false;
        if (this.AddWidgetCommon(locatedWidget, newWidget, keepStyle)) {
            locatedWidget.parent().css({
                position: 'absolute',
                top: 0,
                left: '50%',
                height: '100%',
                width: '50%',
                borderLeftWidth: '1px'
            });
            newWidget.parent().css({
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '50%'
            });
        } else {
        }
        this.CheckFrameSize(locatedWidget.parent());
        this.CheckFrameSize(newWidget.parent());
    };

    DScriptPaneManager.prototype.AddWidgetOnTop = function (locatedWidget, newWidget, keepStyle) {
        if (typeof keepStyle === "undefined") { keepStyle = false; }
        var ret = false;
        if (this.AddWidgetCommon(locatedWidget, newWidget, keepStyle)) {
            locatedWidget.parent().css({
                position: 'absolute',
                top: '50%',
                left: 0,
                height: '50%',
                width: '100%',
                borderTopWidth: '1px'
            });
            newWidget.parent().css({
                position: 'absolute',
                top: 0,
                left: 0,
                height: '50%',
                width: '100%'
            });
        } else {
        }
        this.CheckFrameSize(locatedWidget.parent());
        this.CheckFrameSize(newWidget.parent());
    };

    DScriptPaneManager.prototype.AddWidgetOnBottom = function (locatedWidget, newWidget, keepStyle) {
        if (typeof keepStyle === "undefined") { keepStyle = false; }
        var ret = false;
        if (this.AddWidgetCommon(locatedWidget, newWidget, keepStyle)) {
            locatedWidget.parent().css({
                position: 'absolute',
                top: 0,
                left: 0,
                height: '50%',
                width: '100%',
                borderBottomWidth: '1px'
            });
            newWidget.parent().css({
                position: 'absolute',
                top: '50%',
                left: 0,
                height: '50%',
                width: '100%'
            });
        } else {
        }
        this.CheckFrameSize(locatedWidget.parent());
        this.CheckFrameSize(newWidget.parent());
    };

    DScriptPaneManager.prototype.CreateButtonUtil = function () {
        var self = this;
        var ret = {
            Size: 36,
            Padding: 5,
            LineWidth: 2,
            CanvasClear: function (ctx) {
                ctx.clearRect(0, 0, this.Size, this.Size);
            },
            CanvasRenderHButton: function (ctx, color) {
                if (typeof color === "undefined") { color = "#000000"; }
                ctx.strokeStyle = color;
                ctx.lineWidth = this.LineWidth;
                ctx.beginPath();
                ctx.moveTo(this.Padding, this.Size / 2);
                ctx.lineTo(this.Size - this.Padding, this.Size / 2);
                ctx.strokeRect(this.Padding, this.Padding, this.Size - this.Padding * 2, this.Size - this.Padding * 2);
                ctx.closePath();
                ctx.stroke();
            },
            CanvasRenderVButton: function (ctx, color) {
                if (typeof color === "undefined") { color = "#000000"; }
                ctx.strokeStyle = color;
                ctx.lineWidth = this.LineWidth;
                ctx.beginPath();
                ctx.moveTo(this.Size / 2, this.Padding);
                ctx.lineTo(this.Size / 2, this.Size - this.Padding);
                ctx.strokeRect(this.Padding, this.Padding, this.Size - this.Padding * 2, this.Size - this.Padding * 2);
                ctx.closePath();
                ctx.stroke();
            },
            CanvasRenderDeleteButton: function (ctx, color) {
                if (typeof color === "undefined") { color = "#000000"; }
                ctx.strokeStyle = color;
                ctx.lineWidth = this.LineWidth + 1;
                ctx.beginPath();
                ctx.moveTo(this.Padding * 2, this.Padding * 2);
                ctx.lineTo(this.Size - this.Padding * 2, this.Size - this.Padding * 2);
                ctx.moveTo(this.Size - this.Padding * 2, this.Padding * 2);
                ctx.lineTo(this.Padding * 2, this.Size - this.Padding * 2);
                ctx.closePath();
                ctx.stroke();
            },
            HSplit: function (e) {
                var widget = e.data.frame.children(".managed-widget");
                if (widget.length == 1 && (self.Widgets.indexOf(widget.get(0)) != -1 || widget.hasClass("default-widget"))) {
                    self.AddWidgetOnBottom(widget, self.CreateDefaultWidget());
                } else {
                    console.log("DScriptPaneManager error");
                    console.log(widget);
                    console.log(self.Widgets);
                }
            },
            VSplit: function (e) {
                var widget = e.data.frame.children(".managed-widget");
                if (widget.length == 1 && (self.Widgets.indexOf(widget.get(0)) != -1 || widget.hasClass("default-widget"))) {
                    self.AddWidgetOnRight(widget, self.CreateDefaultWidget());
                } else {
                    console.log("DScriptPaneManager error");
                    console.log(widget);
                    console.log(self.Widgets);
                }
            },
            Delete: function (e) {
                self.DeleteWidget(e.data.frame.children(".managed-widget"));
            }
        };
        return ret;
    };
    return DScriptPaneManager;
})();
