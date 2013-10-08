var DScriptPaneManager = (function () {
    function DScriptPaneManager(base, widget0, keepStyle) {
        if (typeof keepStyle === "undefined") { keepStyle = false; }
        var frame = $("<div/>");
        base.append(frame.append(widget0));
        this.Base = base;
        this.Widgets = [widget0.get(0)];
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

    DScriptPaneManager.prototype.AddWidgetCommon = function (locatedWidget, newWidget, keepStyle) {
        if (typeof keepStyle === "undefined") { keepStyle = false; }
        var ret = false;
        var index = this.Widgets.indexOf(locatedWidget.get(0));
        if (index != -1) {
            ret = true;
            this.Widgets.push(newWidget.get(0));
            var childFrame1 = $("<div/>");
            var childFrame2 = $("<div/>");
            var parentFrame = locatedWidget.parent();
            childFrame1.append(locatedWidget);
            childFrame2.append(newWidget);
            if (!keepStyle)
                DScriptPaneManager.ExpandWidget(newWidget);
            parentFrame.append(childFrame1).append(childFrame2);
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
