class DScriptPaneManager {
	ParentWidget: JQuery;
	Widgets: HTMLElement[];
	BasePath: string;
	
 	constructor(parentWidget: JQuery, widget0: JQuery, keepStyle: boolean = false) {
		this.ParentWidget = parentWidget;
		this.Widgets = [widget0.get(0)];

		var frame: JQuery = this.CreateFrame();;
		parentWidget.append(frame.append(widget0.addClass("managed-widget")));
		DScriptPaneManager.ExpandWidget(frame);
		if (!keepStyle) DScriptPaneManager.ExpandWidget(widget0);
 	}

	static ExpandWidget(widget: JQuery) {
		widget.css({
			position : 'absolute',
			top : 0,
			left : 0,
			height : '100%',
			width : '100%',
		});
	}

	private CreateFrame(): JQuery {
		var self = this;
		var newFrame: JQuery = $("<div/>");
		newFrame.addClass("managed-frame");

		var buttonUp: JQuery = $("<div/>");
		buttonUp.addClass("simple-arrow-up");
		buttonUp.click(function() {
			console.log("click up");
			var widget = newFrame.children(".managed-widget");
			if (widget.length == 1 && self.Widgets.indexOf(widget.get(0)) != -1) {
				self.AddWidgetOnBottom(widget, $("<div/>"));
			}
		});
		var buttonDown: JQuery = $("<div/>");
		buttonDown.addClass("simple-arrow-down");
		buttonDown.click(function() {
			console.log("click down");
			var widget = newFrame.children(".managed-widget");
			if (widget.length == 1 && self.Widgets.indexOf(widget.get(0)) != -1) {
				self.AddWidgetOnTop(widget, $("<div/>"));
			}
		});
		var buttonLeft: JQuery = $("<div/>");
		buttonLeft.addClass("simple-arrow-left");
		buttonLeft.click(function() {
			console.log("click left");
			var widget = newFrame.children(".managed-widget");
			if (widget.length == 1 && self.Widgets.indexOf(widget.get(0)) != -1) {
				self.AddWidgetOnRight(widget, $("<div/>"));
			}
		});
		var buttonRight: JQuery = $("<div/>");
		buttonRight.addClass("simple-arrow-right");
		buttonRight.click(function() {
			console.log("click right");
			var widget = newFrame.children(".managed-widget");
			if (widget.length == 1 && self.Widgets.indexOf(widget.get(0)) != -1) {
				self.AddWidgetOnLeft(widget, $("<div/>"));
			}
		});

		newFrame.append(buttonUp);
		newFrame.append(buttonDown);
		newFrame.append(buttonLeft);
		newFrame.append(buttonRight);
		return newFrame;
	}

	private AddWidgetCommon(locatedWidget: JQuery, newWidget: JQuery, keepStyle: boolean = false) {
		var ret: boolean = false;
		var index: number = this.Widgets.indexOf(locatedWidget.get(0));
		if (index != -1) {
			ret = true;
			this.Widgets.push(newWidget.get(0));
			newWidget.addClass("managed-widget");
			var childFrame1: JQuery = this.CreateFrame();
			var childFrame2: JQuery = this.CreateFrame();
			var parentFrame: JQuery = locatedWidget.parent();
			childFrame1.append(locatedWidget);
			childFrame2.append(newWidget);
			if (!keepStyle) DScriptPaneManager.ExpandWidget(newWidget);
			parentFrame.append(childFrame1).append(childFrame2);
		}
		else {
			//pass
		}
		return ret;
	}

 	public AddWidgetOnRight(locatedWidget: JQuery, newWidget: JQuery, keepStyle: boolean = false) {
		var ret: boolean = false;
		if (this.AddWidgetCommon(locatedWidget, newWidget, keepStyle)) {
			locatedWidget.parent().css({
				position : 'absolute',
				top : 0,
				left : 0,
				height : '100%',
				width : '50%',
				borderRight: '1px solid #000000'
			});
			newWidget.parent().css({
				position : 'absolute',
				top : 0,
				left : '50%',
				height : '100%',
				width : '50%',
			});
		}
		else {
			//pass
		}
 	}

 	public AddWidgetOnLeft(locatedWidget: JQuery, newWidget: JQuery, keepStyle: boolean = false) {
		var ret: boolean = false;
		if (this.AddWidgetCommon(locatedWidget, newWidget, keepStyle)) {
			locatedWidget.parent().css({
				position : 'absolute',
				top : 0,
				left : '50%',
				height : '100%',
				width : '50%',
				borderLeft: '1px solid #000000'
			});
			newWidget.parent().css({
				position : 'absolute',
				top : 0,
				left : 0,
				height : '100%',
				width : '50%',
			});
		}
		else {
			//pass
		}
 	}

 	public AddWidgetOnTop(locatedWidget: JQuery, newWidget: JQuery, keepStyle: boolean = false) {
		var ret: boolean = false;
		if (this.AddWidgetCommon(locatedWidget, newWidget, keepStyle)) {
			locatedWidget.parent().css({
				position : 'absolute',
				top : '50%',
				left : 0,
				height : '50%',
				width : '100%',
				borderTop: '1px solid #000000'
			});
			newWidget.parent().css({
				position : 'absolute',
				top : 0,
				left : 0,
				height : '50%',
				width : '100%',
			});
		}
		else {
			//pass
		}
 	}

 	public AddWidgetOnBottom(locatedWidget: JQuery, newWidget: JQuery, keepStyle: boolean = false) {
		var ret: boolean = false;
		if (this.AddWidgetCommon(locatedWidget, newWidget, keepStyle)) {
			locatedWidget.parent().css({
				position : 'absolute',
				top : 0,
				left : 0,
				height : '50%',
				width : '100%',
				borderBottom: '1px solid #000000'
			});
			newWidget.parent().css({
				position : 'absolute',
				top : '50%',
				left : 0,
				height : '50%',
				width : '100%',
			});
		}
		else {
			//pass
		}
 	}
}
