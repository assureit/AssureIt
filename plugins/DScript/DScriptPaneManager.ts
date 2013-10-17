class DScriptPaneManager {
	ParentWidget: JQuery;
	Widgets: HTMLElement[];
	Options: any;
	RefreshFunc;
	ButtonUtil;
	
 	constructor(parentWidget: JQuery, widget0: JQuery, keepStyle: boolean = false) {
		this.ParentWidget = parentWidget;
		this.Widgets = [widget0.get(0)];
		this.Options = {};
		this.RefreshFunc = function(){};
		this.ButtonUtil = this.CreateButtonUtil();

		var frame: JQuery = this.CreateFrame();;
		if (widget0 != null) {
			parentWidget.append(frame.append(widget0.addClass("managed-widget")));
		}
		else {
			parentWidget.append(frame.append(this.CreateDefaultWidget().addClass("managed-widget")));
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
	static CopyStyle(src: JQuery, dist: JQuery): void {
		dist.css({
			top : src.css("top"),
			left : src.css("left"),
			height : src.css("height"),
			width : src.css("width"),
			borderRightWidth : src.css("border-right-width"),
			borderLeftWidth : src.css("border-left-width"),
			borderTopWidth : src.css("border-top-width"),
			borderBottomWidth : src.css("border-bottom-width"),
		});
	}

	public AddToOptionsList(widget: JQuery, name: string, overrideFlag: boolean, keepStyle = false): void {
		if (name in this.Options && !overrideFlag) {
			console.log("DScriptPaneManaer:Warning!! Cannot append the Option " + name);
		}
		else {
			if (!keepStyle) DScriptPaneManager.ExpandWidget(widget);
			this.Options[name] = widget;
		}
	}

	public SetRefreshFunc(func) {
		this.RefreshFunc = func;
	}

	private RefreshDefaultWidget(): void {
		var usedList = [];
		for (var key in this.Options) {
			if (this.Widgets.indexOf(this.Options[key].get(0)) != -1) {
				usedList.push(key);
			}
		}
		$(".widget-select-button").each(function() {
			if (usedList.indexOf($(this).text()) != -1) {
				$(this).css("display", "none");
			}
			else {
				$(this).css("display", "block");
			}
		});
	}

	private CreateDefaultWidget(): JQuery { // create buttons from OptionsList
		var defaultWidget = $("<div/>").addClass("btn-group-vertical default-widget");
		var self = this;
		for (var key in self.Options) {
			var newButton = $("<button/>");
			newButton.text(key);
			newButton.addClass("btn btn-default widget-select-button");
			newButton.click(function() {
				var frame = defaultWidget.parent();
				var widget = self.Options[$(this).text()];
				widget.addClass("managed-widget");
				self.Widgets.push(widget.get(0));
				frame.append(widget);
				defaultWidget.remove();
				self.RefreshFunc();
				self.RefreshDefaultWidget();
			});
			newButton.css({
				overflow : "hidden",
				textOverflow : "ellipsis",
			});
			if (this.Widgets.indexOf(self.Options[key].get(0)) != -1) newButton.css("display", "none");
			defaultWidget.append(newButton);
		}
		return defaultWidget;
	}

	private CheckFrameSize(frame: JQuery): void { // if frame is too small to split, disable widget-split-buttons
		var vButton: JQuery = frame.children(".widget-split-button.vertical");
		var hButton: JQuery = frame.children(".widget-split-button.horizontal");
		var vCtx:CanvasRenderingContext2D = vButton.get(0).getContext("2d");
		var hCtx: CanvasRenderingContext2D = hButton.get(0).getContext("2d");
		this.ButtonUtil.CanvasClear(vCtx);
		this.ButtonUtil.CanvasClear(hCtx);
		vButton.unbind("click");
		hButton.unbind("click");
		if (Number(frame.css("width").replace("px", "")) < this.ButtonUtil.Size * 3) {
			this.ButtonUtil.CanvasRenderVButton(vCtx, "#CCCCCC");
		}
		else {
			this.ButtonUtil.CanvasRenderVButton(vCtx);
			vButton.bind("click", { frame : frame }, this.ButtonUtil.VSplit);
		}
		if (Number(frame.css("height").replace("px", "")) < this.ButtonUtil.Size * 6) {
			this.ButtonUtil.CanvasRenderHButton(hCtx, "#CCCCCC");
		}
		else {
			this.ButtonUtil.CanvasRenderHButton(hCtx);
			hButton.bind("click", { frame : frame }, this.ButtonUtil.HSplit);
		}

		var childrenFrame = frame.children(".managed-frame");
		if (childrenFrame.length > 0) {
			var self = this;
			childrenFrame.each(function() {
				self.CheckFrameSize($(this));
			});
		}
	}

	private CreateFrame(): JQuery {
		var self = this;
		var newFrame: JQuery = $("<div/>");

		var buttonUp: JQuery = $("<canvas width='${size}px' height='${size}px'></canvas>".replace(/\$\{size\}/g, String(this.ButtonUtil.Size)));
		buttonUp.css({
			position : "absolute",
			right : 0,
			top : 0,
			zIndex : 10,
		});
		var ctx = buttonUp.get(0).getContext("2d");
		this.ButtonUtil.CanvasRenderHButton(ctx);
		buttonUp.bind("click", { frame : newFrame }, this.ButtonUtil.HSplit);
		var buttonLeft: JQuery = $("<canvas width='${size}px' height='${size}px'></canvas>".replace(/\$\{size\}/g, String(this.ButtonUtil.Size)));
		buttonLeft.css({
			position : "absolute",
			right : 0,
			top : this.ButtonUtil.Size,
			zIndex : 10,
		});
		var ctx = buttonLeft.get(0).getContext("2d");
		this.ButtonUtil.CanvasRenderVButton(ctx);
		buttonLeft.bind("click", { frame : newFrame }, this.ButtonUtil.VSplit);
		var buttonDelete: JQuery = $("<canvas width='${size}px' height='${size}px'></canvas>".replace(/\$\{size\}/g, String(this.ButtonUtil.Size)));
		buttonDelete.css({
			position : "absolute",
			right : 0,
			top : this.ButtonUtil.Size * 2,
			zIndex : 10,
		});
		var ctx = buttonDelete.get(0).getContext("2d");
		this.ButtonUtil.CanvasRenderDeleteButton(ctx);
		buttonDelete.bind("click", {frame : newFrame }, this.ButtonUtil.Delete);
		
		newFrame.append(buttonUp);
		newFrame.append(buttonLeft);
		newFrame.append(buttonDelete);
		newFrame.addClass("managed-frame");
		newFrame.css({
			borderColor : "#000000",
			borderStyle : "solid",
			borderWidth : 0,
		});
		newFrame.children("canvas").addClass("widget-split-button");
		buttonUp.addClass("horizontal");
		buttonLeft.addClass("vertical");

		return newFrame;
	}

	private DeleteWidget(locatedWidget: JQuery) { // don't delete widget, but delete the frame which has the widget
		var currentFrame = locatedWidget.parent(".managed-frame");
		var parentFrame = currentFrame.parent(".managed-frame");
		var siblingFrame = currentFrame.siblings(".managed-frame");
		var idx = this.Widgets.indexOf(locatedWidget.get(0));
		if (idx != -1) this.Widgets.splice(idx, 1);
		if (parentFrame.length == 0) { // exist one widget in panemanager
			var newWidget = this.CreateDefaultWidget().addClass("managed-widget");
			DScriptPaneManager.ExpandWidget(newWidget);
			locatedWidget.after(newWidget);
			locatedWidget.remove();
			this.CheckFrameSize(currentFrame);
		}
		else {
			DScriptPaneManager.CopyStyle(parentFrame, siblingFrame);
			parentFrame.parent().append(siblingFrame);
			parentFrame = currentFrame.parent(".managed-frame");
			parentFrame.remove();
			this.CheckFrameSize(siblingFrame);
		}
		this.RefreshDefaultWidget();
		this.RefreshFunc();
	}

	private AddWidgetCommon(locatedWidget: JQuery, newWidget: JQuery, keepStyle: boolean = false) {
		var ret: boolean = false;
		var index: number = this.Widgets.indexOf(locatedWidget.get(0));
		var isDefaultWidget = locatedWidget.hasClass("default-widget");
		if (index != -1 || isDefaultWidget) {
			ret = true;
			newWidget.addClass("managed-widget");
			if (isDefaultWidget) this.Widgets.push(newWidget.get(0));
			var childFrame1: JQuery = this.CreateFrame();
			var childFrame2: JQuery = this.CreateFrame();
			var parentFrame: JQuery = locatedWidget.parent();
			childFrame1.append(locatedWidget);
			childFrame2.append(newWidget);
			if (!keepStyle) DScriptPaneManager.ExpandWidget(newWidget);
			parentFrame.children(".widget-split-button").css("display", "none");
			parentFrame.append(childFrame1).append(childFrame2);
			this.RefreshFunc();
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
				borderRightWidth: '1px'
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
		this.CheckFrameSize(locatedWidget.parent());
		this.CheckFrameSize(newWidget.parent());
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
				borderLeftWidth: '1px'
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
		this.CheckFrameSize(locatedWidget.parent());
		this.CheckFrameSize(newWidget.parent());
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
				borderTopWidth: '1px'
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
		this.CheckFrameSize(locatedWidget.parent());
		this.CheckFrameSize(newWidget.parent());
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
				borderBottomWidth: '1px'
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
		this.CheckFrameSize(locatedWidget.parent());
		this.CheckFrameSize(newWidget.parent());
 	}

	private CreateButtonUtil() {
		var self = this;
		var ret = {
			Size : 36,
			Padding : 5,
			LineWidth : 2,
			CanvasClear : function(ctx: CanvasRenderingContext2D) {
				ctx.clearRect(0, 0, this.Size, this.Size);
			},
			CanvasRenderHButton : function(ctx: CanvasRenderingContext2D, color: string = "#000000") {
				ctx.strokeStyle = color;
				ctx.lineWidth = this.LineWidth;
				ctx.beginPath();
				ctx.moveTo(this.Padding, this.Size / 2);
				ctx.lineTo(this.Size - this.Padding, this.Size / 2);
				ctx.strokeRect(this.Padding, this.Padding, this.Size - this.Padding * 2, this.Size - this.Padding * 2);
				ctx.closePath();
				ctx.stroke();
			},
			CanvasRenderVButton : function(ctx: CanvasRenderingContext2D, color: string = "#000000") {
				ctx.strokeStyle = color;
				ctx.lineWidth = this.LineWidth;
				ctx.beginPath();
				ctx.moveTo(this.Size / 2, this.Padding);
				ctx.lineTo(this.Size / 2, this.Size - this.Padding);
				ctx.strokeRect(this.Padding, this.Padding, this.Size - this.Padding * 2, this.Size - this.Padding * 2);
				ctx.closePath();
				ctx.stroke();
			},
			CanvasRenderDeleteButton : function(ctx: CanvasRenderingContext2D, color: string = "#000000") {
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
			HSplit : function(e) {
				var widget = e.data.frame.children(".managed-widget");
				if (widget.length == 1 &&
					(self.Widgets.indexOf(widget.get(0)) != -1 ||
					 widget.hasClass("default-widget"))) {
					self.AddWidgetOnBottom(widget, self.CreateDefaultWidget());
				}
				else {
					console.log("DScriptPaneManager error");
					console.log(widget);
					console.log(self.Widgets);
				}
			},
			VSplit : function(e) {
				var widget = e.data.frame.children(".managed-widget");
				if (widget.length == 1 &&
					(self.Widgets.indexOf(widget.get(0)) != -1 ||
					 widget.hasClass("default-widget"))) {
					self.AddWidgetOnRight(widget, self.CreateDefaultWidget());
				}
				else {
					console.log("DScriptPaneManager error");
					console.log(widget);
					console.log(self.Widgets);
				}
			},
			Delete : function(e) {
				self.DeleteWidget(e.data.frame.children(".managed-widget"));
			},
		};
		return ret;
	}
}
