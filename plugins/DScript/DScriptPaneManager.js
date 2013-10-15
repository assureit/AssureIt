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

    DScriptPaneManager.prototype.CreateDefaultWidget = function () {
        var defaultWidget = $("<div/>").addClass("btn-group-vertical");
        var self = this;
        for (var key in self.Options) {
            var newButton = $("<button/>").addClass("btn btn-default");
            newButton.text(key);
            newButton.click(function () {
                var frame = defaultWidget.parent();
                var widget = self.Options[$(this).text()];
                widget.addClass("managed-widget");
                self.Widgets.push(widget.get(0));
                frame.append(widget);
                defaultWidget.remove();
                self.RefreshFunc();
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
            if (widget.length == 1 && self.Widgets.indexOf(widget.get(0)) != -1) {
                self.AddWidgetOnBottom(widget, self.CreateDefaultWidget());
            }
        });
        var buttonDown = $("<div/>");
        buttonDown.addClass("simple-arrow-down");
        buttonDown.click(function () {
            console.log("click down");
            var widget = newFrame.children(".managed-widget");
            if (widget.length == 1 && self.Widgets.indexOf(widget.get(0)) != -1) {
                self.AddWidgetOnTop(widget, self.CreateDefaultWidget());
            }
        });
        var buttonLeft = $("<div/>");
        buttonLeft.addClass("simple-arrow-left");
        buttonLeft.click(function () {
            console.log("click left");
            var widget = newFrame.children(".managed-widget");
            if (widget.length == 1 && self.Widgets.indexOf(widget.get(0)) != -1) {
                self.AddWidgetOnRight(widget, self.CreateDefaultWidget());
            }
        });
        var buttonRight = $("<div/>");
        buttonRight.addClass("simple-arrow-right");
        buttonRight.click(function () {
            console.log("click right");
            var widget = newFrame.children(".managed-widget");
            if (widget.length == 1 && self.Widgets.indexOf(widget.get(0)) != -1) {
                self.AddWidgetOnLeft(widget, self.CreateDefaultWidget());
            }
        });

        newFrame.append(buttonUp);
        newFrame.append(buttonDown);
        newFrame.append(buttonLeft);
        newFrame.append(buttonRight);
        return newFrame;
    };

    DScriptPaneManager.prototype.AddWidgetCommon = function (locatedWidget, newWidget, keepStyle) {
        if (typeof keepStyle === "undefined") { keepStyle = false; }
        var ret = false;
        var index = this.Widgets.indexOf(locatedWidget.get(0));
        if (index != -1) {
            ret = true;
            this.Widgets.push(newWidget.get(0));
            newWidget.addClass("managed-widget");
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
                borderRight: '1px solid #000000'
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
                borderLeft: '1px solid #000000'
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
                borderTop: '1px solid #000000'
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
                borderBottom: '1px solid #000000'
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
