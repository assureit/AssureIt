/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/ServerApi.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../../src/EditorUtil.ts" />

//--- CodeMirror

class FullScreenEditorPlugIn extends AssureIt.PlugInSet {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		var plugin: FullScreenEditorActionPlugIn = new FullScreenEditorActionPlugIn(plugInManager);
		this.ActionPlugIn = plugin;
		this.MenuBarContentsPlugIn = new FullScreenMenuPlugIn(plugInManager, plugin);
		this.HTMLRenderPlugIn = new FullScreenEditorLayoutPlugIn(plugInManager);
	}

}

class FullScreenMenuPlugIn extends AssureIt.MenuBarContentsPlugIn {
	editorPlugIn: FullScreenEditorActionPlugIn;
	constructor(plugInManager: AssureIt.PlugInManager, editorPlugIn: FullScreenEditorActionPlugIn) {
		super(plugInManager);
		this.editorPlugIn = editorPlugIn;
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel): boolean {
		return caseViewer.Source.IsEditable();
	}

	Delegate(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel, element: JQuery, serverApi: AssureIt.ServerAPI): boolean {
		element.append('<a href="#" ><img id="fullscreen-menu" src="' + serverApi.basepath + 'images/max.png" title="FullScreen" alt="fullscreen" /></a>');
		$('#fullscreen-menu').unbind('click');
		$('#fullscreen-menu').click((ev) => {
				this.editorPlugIn.rootModel = caseModel;
				this.editorPlugIn.ShowFullScreenEditor(ev);});
		return true;
	}
}

class FullScreenEditorLayoutPlugIn extends AssureIt.HTMLRenderPlugIn {
	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	IsEnabled (caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel) : boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel, element: JQuery) : boolean {
		//if (caseModel.IsEditing) {
		//	element.height(ExpandedNodeHeight);
		//}
		return true;
	}
}

class FullScreenEditorActionPlugIn extends AssureIt.ActionPlugIn {
	editor;
	selector: string;
	ShowFullScreenEditor: (ev: Event) => void;
	isDisplayed: boolean;
	rootModel: AssureIt.NodeModel;
	ErrorHighlight: ErrorHighlight;
	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.editor = CodeMirror.fromTextArea(document.getElementById('fullscreen-editor'), {
			lineNumbers: true,
			mode: "text/x-csrc",
			lineWrapping: true,
		});
		$(this.editor.getWrapperElement()).css({
			height : "100%",
			width : "100%",
			background : "rgba(255, 255, 255, 0.85)"
		})
		$('#fullscreen-editor-wrapper').css({
			position : "absolute",
			top : "5%",
			left : "5%",
			height : "90%",
			width : "90%",
			display : 'none',
			//			background : "rgba(255, 255, 255, 0)"
		});
		this.ShowFullScreenEditor = null;
		this.ErrorHighlight = new ErrorHighlight(this.editor);
	}

	IsEnabled (caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case) : boolean {
		return true;
	}

	static Object_Clone(obj: any) : any {
		var f = {};
		var keys = Object.keys(obj);
		for (var i in keys) {
			f[keys[i]] = obj[keys[i]];
		}
		return f;
	}

	static ElementMap_Clone(obj: any) : any {
		return this.Object_Clone(obj);
	}
	
	static IdCounters_Clone(obj: any[]) : any[] {
		var IdCounters = [];
		for (var i in obj) {
			IdCounters.push(this.Object_Clone(obj[i]));
		}
		return IdCounters;
	}
	
	static ElementMap_removeChild(ElementMap, model: AssureIt.NodeModel) {
		if (ElementMap[model.Label] == undefined) {
			console.log("wrong with nodemodel");
		}
		delete(ElementMap[model.Label]);
		for (var i in model.Children) {
			this.ElementMap_removeChild(ElementMap, model.Children[i]);
		}
		return ElementMap;
	}
	
	static IdCounters_removeChild(IdCounters: any[], model: AssureIt.NodeModel) {
		var count = Number(model.Label.substring(1));
		if (IdCounters[model.Type][count] == undefined) {
			console.log("wrong with idcounters");
		}
		delete(IdCounters[model.Type][count]);
		for (var i in model.Children) {
			this.IdCounters_removeChild(IdCounters, model.Children[i]);
		}
		return IdCounters;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI)  : boolean {
		var editor = this.editor;
		var self = this; //FIXME

		if(!this.ShowFullScreenEditor) {
			this.ShowFullScreenEditor = function (ev: Event) {
				ev.stopPropagation();
				self.plugInManager.UseUILayer(self);
				self.isDisplayed = true;

				var label: string = this.rootModel.Label;

				var encoder : AssureIt.CaseEncoder = new AssureIt.CaseEncoder();
				var encoded = encoder.ConvertToASN(case0.ElementMap[label], false/* whole node */);

				$('#fullscreen-editor-wrapper')
					.css({display: 'block'})
					.addClass("animated fadeInDown")
					.focus()
					.on("blur", function(e: JQueryEventObject) {
						e.stopPropagation();
						self.ErrorHighlight.ClearHighlight();

						var orig_model : AssureIt.NodeModel = case0.ElementMap[label];
						var orig_view : AssureIt.NodeView = caseViewer.ViewMap[label];

						/* In order to keep labels the same as much as possible */
						var orig_idCounters = case0.ReserveIdCounters(orig_model);
						var orig_ElementMap = case0.ReserveElementMap(orig_model);

						orig_view.DeleteHTMLElementRecursive(null, null);

						var decoder    : AssureIt.CaseDecoder = new AssureIt.CaseDecoder();
						var new_model  : AssureIt.NodeModel = decoder.ParseASN(case0, editor.getValue(), orig_model);

						if (new_model != null) {
							orig_view.DeleteHTMLElementRecursive($("#layer0"), $("#layer1"));
							caseViewer.DeleteViewsRecursive(orig_view);
							var new_view  : AssureIt.NodeView = new AssureIt.NodeView(caseViewer, new_model);
							var Parent: AssureIt.NodeModel = orig_model.Parent;
							if (Parent != null) {
								new_model.Parent = Parent;
								for (var j in Parent.Children) {
									if (Parent.Children[j].Label == orig_model.Label) {
										Parent.Children[j] = new_model;
									}
								}
								new_view.ParentShape = caseViewer.ViewMap[Parent.Label];
							} else {
								caseViewer.ElementTop = new_model;
								case0.ElementTop = new_model;
							}
							(function(model : AssureIt.NodeModel, view : AssureIt.NodeView) : void {
								caseViewer.ViewMap[model.Label] = view;
								for (var i = 0; i < model.Children.length; i++) {
									var child_model = model.Children[i];
									var child_view : AssureIt.NodeView = new AssureIt.NodeView(caseViewer, child_model);
									arguments.callee(child_model, child_view);
								}
								if (model.Parent != null) view.ParentShape = caseViewer.ViewMap[model.Parent.Label];
							})(new_model, new_view);
							new_model.EnableEditFlag();

							/* Close the editor */
							var $this = $(this);
							self.isDisplayed = false;
							$this.addClass("animated fadeOutUp");
							window.setTimeout(function() {
								$this.removeClass();
								$this.css({display: 'none'});
							}, 1300);
							$('#fullscreen-editor-wrapper').unbind(); 
						} else {
							/* Show an error */
							self.ErrorHighlight.Highlight(decoder.GetASNError().line,"");
							case0.ElementMap = orig_ElementMap;
							case0.IdCounters = orig_idCounters;
						}
						caseViewer.Draw();
						/* TODO We need to Draw twice for some unknown reason */ 
						caseViewer.Draw();

					})
					.on("keydown", function(e: JQueryEventObject) {
						if(e.keyCode == 27 /* ESC */){
							e.stopPropagation();
							$('#fullscreen-editor-wrapper').blur();
						}
					});
				editor.setValue(encoded);
				editor.refresh();

				editor.focus();
				$('#CodeMirror').focus();
				$('#background').click(function(){
					$('#fullscreen-editor-wrapper').blur(); 
				});
				window.setTimeout(function() {
					if (!self.isDisplayed) {
						$('#fullscreen-editor-wrapper').css({display: 'none'});
					}
					$('#fullscreen-editor-wrapper').removeClass();
				}, 1300);
			}
		}

		return true;
	}

	//ShowAnError(decoder: AssureIt.CaseDecoder) {
	//	var error = decoder.GetASNError();
	//	this.Blink(error.line);
	//	this.editor.scrollIntoView({line:error.line, ch: error.column});
	//	this.editor.setCursor({line:error.line-1});
	//}

	DeleteFromDOM(): void {
		$('#fullscreen-editor-wrapper').blur();
	}
}
