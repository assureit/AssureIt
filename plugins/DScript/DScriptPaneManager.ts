class DScriptPaneManager {
	ParentWidget: JQuery;
	Widgets: HTMLElement[];
	Options: any;
	
 	constructor(parentWidget: JQuery, widget0: JQuery, keepStyle: boolean = false) {
		this.ParentWidget = parentWidget;
		this.Widgets = [widget0.get(0)];
		this.Options = {};

		var frame: JQuery = this.CreateFrame();;
		if (widget0 != null) {
			parentWidget.append(frame.append(widget0.addClass("managed-widget")));
		}
		else {
			parentWidget.append(this.CreateDefaultWidget())
		}
		DScriptPaneManager.ExpandWidget(frame);
		if (!keepStyle) DScriptPaneManager.ExpandWidget(widget0);
 	}

	static ExpandWidget(widget: JQuery): void {
		widget.css({
			position : 'absolute',
			top : 0,
			left : 0,
			height : '100%',
			width : '100%',
		});
	}

	public AddToOptionsList(widget: JQuery, name: string, overrideFlag: boolean = false): void {
		if (name in this.Options && !overrideFlag) {
			console.log("DScriptPaneManaer:Warning!! Cannot append the Option " + name);
		}
		else {
			DScriptPaneManager.ExpandWidget(widget);
			this.Options[name] = widget;
		}
	}

	public CreateDefaultWidget(): JQuery { // create buttons from OptionsList
		var defaultWidget = $("<div/>");
		var self = this;
		for (var key in self.Options) {
			var newButton = $("<div/>");
			newButton.text(key);
			newButton.click(function() {
				var frame = defaultWidget.parent();
				var widget = self.Options[$(this).text()];
				widget.addClass("managed-widget");
				self.Widgets.push(widget.get(0));
				frame.append(widget);
				defaultWidget.remove();
			});
			defaultWidget.append(newButton);
		}
		return defaultWidget;
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
				self.AddWidgetOnBottom(widget, self.CreateDefaultWidget());
			}
		});
		var buttonDown: JQuery = $("<div/>");
		buttonDown.addClass("simple-arrow-down");
		buttonDown.click(function() {
			console.log("click down");
			var widget = newFrame.children(".managed-widget");
			if (widget.length == 1 && self.Widgets.indexOf(widget.get(0)) != -1) {
				self.AddWidgetOnTop(widget, self.CreateDefaultWidget());
			}
		});
		var buttonLeft: JQuery = $("<div/>");
		buttonLeft.addClass("simple-arrow-left");
		buttonLeft.click(function() {
			console.log("click left");
			var widget = newFrame.children(".managed-widget");
			if (widget.length == 1 && self.Widgets.indexOf(widget.get(0)) != -1) {
				self.AddWidgetOnRight(widget, self.CreateDefaultWidget());
			}
		});
		var buttonRight: JQuery = $("<div/>");
		buttonRight.addClass("simple-arrow-right");
		buttonRight.click(function() {
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
