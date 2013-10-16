var DScriptPaneManager = (function () {
    function DScriptPaneManager(parentWidget, widget0, keepStyle) {
        if (typeof keepStyle === "undefined") { keepStyle = false; }
        this.ParentWidget = parentWidget;
        this.Widgets = [widget0.get(0)];
        this.Options = {};
        this.RefreshFunc = function () {
        };

        var frame = this.CreateFrame();
        ;
        if (widget0 != null) {
            parentWidget.append(frame.append(widget0.addClass("managed-widget")));
        } else {
            parentWidget.append(this.CreateDefaultWidget());
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

    DScriptPaneManager.prototype.RefreshDefaultWidget = function () {
        var usedList = [];
        for (var key in this.Options) {
            if (this.Widgets.indexOf(this.Options[key].get(0)) != -1) {
                usedList.push(key);
            }
        }
        $(".widget-select-button").each(function () {
            if (usedList.indexOf($(this).text()) != -1) {
                this.remove();
            }
        });
    };

    DScriptPaneManager.prototype.CreateDefaultWidget = function () {
        var defaultWidget = $("<div/>").addClass("btn-group-vertical default-widget");
        var self = this;
        for (var key in self.Options) {
            if (this.Widgets.indexOf(self.Options[key].get(0)) != -1)
                continue;
            var newButton = $("<button/>").addClass("btn btn-default widget-select-button");
            newButton.text(key);
            newButton.click(function () {
                var frame = defaultWidget.parent();
                var widget = self.Options[$(this).text()];
                widget.addClass("managed-widget");
                self.Widgets.push(widget.get(0));
                frame.append(widget);
                defaultWidget.remove();
                self.RefreshFunc();
                self.RefreshDefaultWidget();
            });
            defaultWidget.append(newButton);
        }
        return defaultWidget;
    };

    DScriptPaneManager.prototype.CreateFrame = function () {
        var self = this;
        var newFrame = $("<div/>");
        newFrame.addClass("managed-frame");

        var buttonUp = $("<div/>");
        buttonUp.addClass("simple-arrow-up");
        buttonUp.click(function () {
            console.log("click up");
            var widget = newFrame.children(".managed-widget");
            if (widget.length == 1 && (self.Widgets.indexOf(widget.get(0)) != -1 || widget.hasClass("default-widget"))) {
                self.AddWidgetOnBottom(widget, self.CreateDefaultWidget());
            } else {
                console.log("DScriptPaneManager error");
                console.log(widget);
                console.log(self.Widgets);
            }
        });
        var buttonDown = $("<div/>");
        buttonDown.addClass("simple-arrow-down");
        buttonDown.click(function () {
            console.log("click down");
            var widget = newFrame.children(".managed-widget");
            if (widget.length == 1 && (self.Widgets.indexOf(widget.get(0)) != -1 || widget.hasClass("default-widget"))) {
                self.AddWidgetOnTop(widget, self.CreateDefaultWidget());
            } else {
                console.log("DScriptPaneManager error");
                console.log(widget);
                console.log(self.Widgets);
            }
        });
        var buttonLeft = $("<div/>");
        buttonLeft.addClass("simple-arrow-left");
        buttonLeft.click(function () {
            console.log("click left");
            var widget = newFrame.children(".managed-widget");
            if (widget.length == 1 && (self.Widgets.indexOf(widget.get(0)) != -1 || widget.hasClass("default-widget"))) {
                self.AddWidgetOnRight(widget, self.CreateDefaultWidget());
            } else {
                console.log("DScriptPaneManager error");
                console.log(widget);
                console.log(self.Widgets);
            }
        });
        var buttonRight = $("<div/>");
        buttonRight.addClass("simple-arrow-right");
        buttonRight.click(function () {
            console.log("click right");
            var widget = newFrame.children(".managed-widget");
            if (widget.length == 1 && (self.Widgets.indexOf(widget.get(0)) != -1 || widget.hasClass("default-widget"))) {
                self.AddWidgetOnLeft(widget, self.CreateDefaultWidget());
            } else {
                console.log("DScriptPaneManager error");
                console.log(widget);
                console.log(self.Widgets);
            }
        });
        var buttonDelete = $("<div/>");
        buttonDelete.addClass("simple-arrow-delete");
        buttonDelete.click(function () {
            console.log("click delete");
            self.DeleteWidget($(this).parent().children(".managed-widget"));
        });

        newFrame.append(buttonUp);
        newFrame.append(buttonDown);
        newFrame.append(buttonLeft);
        newFrame.append(buttonRight);
        newFrame.append(buttonDelete);
        newFrame.css({
            borderColor: "#000000",
            borderStyle: "solid",
            borderWidth: 0
        });
        return newFrame;
    };

    DScriptPaneManager.prototype.DeleteWidget = function (locatedWidget) {
        var currentFrame = locatedWidget.parent(".managed-frame");
        var parentFrame = currentFrame.parent(".managed-frame");
        var siblingFrame = currentFrame.siblings(".managed-frame");
        if (parentFrame.length == 0) {
        } else {
            DScriptPaneManager.CopyStyle(parentFrame, siblingFrame);
            parentFrame.parent().append(siblingFrame);
            parentFrame = currentFrame.parent(".managed-frame");
            parentFrame.remove();
            var idx = this.Widgets.indexOf(locatedWidget.get(0));
            if (idx != -1)
                this.Widgets.splice(idx, 1);
        }
        this.RefreshFunc();
    };

    DScriptPaneManager.prototype.AddWidgetCommon = function (locatedWidget, newWidget, keepStyle) {
        if (typeof keepStyle === "undefined") { keepStyle = false; }
        var ret = false;
        var index = this.Widgets.indexOf(locatedWidget.get(0));
        var isDefaultWidget = locatedWidget.hasClass("default-widget");
        if (index != -1 || isDefaultWidget) {
            ret = true;
            newWidget.addClass("managed-widget");
            if (isDefaultWidget)
                this.Widgets.push(newWidget.get(0));
            var childFrame1 = this.CreateFrame();
            var childFrame2 = this.CreateFrame();
            var parentFrame = locatedWidget.parent();
            childFrame1.append(locatedWidget);
            childFrame2.append(newWidget);
            if (!keepStyle)
                DScriptPaneManager.ExpandWidget(newWidget);
            parentFrame.append(childFrame1).append(childFrame2);
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
    };
    return DScriptPaneManager;
})();
