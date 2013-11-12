/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/ServerApi.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../../src/EditorUtil.ts" />

//--- CodeMirror

/* const */

var ExpandedNodeHeight = 200;
var InplaceEditorHeight = ExpandedNodeHeight - 50;

class EditorPlugIn extends AssureIt.PlugInSet {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.ActionPlugIn = new EditorActionPlugIn(plugInManager);
		this.HTMLRenderPlugIn = new EditorLayoutPlugIn(plugInManager);
	}
}

class EditorLayoutPlugIn extends AssureIt.HTMLRenderPlugIn {
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

class EditorActionPlugIn extends AssureIt.ActionPlugIn {
	editor: any;
	selector: string;
	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
			lineNumbers: false,
			mode: "text/x-asn",
			lineWrapping: true,
		});
		this.editor.setSize("300px","200px"); //FIXME
		$('#editor-wrapper').css({display: 'none', opacity: '1.0'});
	}

	IsEnabled (caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case) : boolean {
		return case0.IsEditable();
	}

	Delegate(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI)  : boolean {
		var editor = this.editor;
		var self = this; //FIXME
		$('.node').unbind('dblclick');
		$('.node').dblclick(function(ev) { //FIXME
			ev.stopPropagation();
			self.plugInManager.UseUILayer(self);
			var node = $(this);
			var p = node.position();
			var p_contents = node.children("p").position();
			var label : string = node.attr('id');
			var selector = "#" + label;
			console.log(selector);
			console.log($(selector).height() + ", " + p_contents.top);
			editor.setSize(node.children("p").width(), InplaceEditorHeight);

			var encoder : AssureIt.CaseEncoder = new AssureIt.CaseEncoder();
			var encoded = encoder.ConvertToASN(case0.ElementMap[label], true/*single node*/);

			var orig_model : AssureIt.NodeModel = case0.ElementMap[label];
			var orig_shape : AssureIt.NodeView = caseViewer.ViewMap[label];

			//orig_model.EnableEditFlag();
			orig_shape.HTMLDoc.Render(caseViewer, orig_model);

			caseViewer.Draw();

			p = $(selector).position();
			p_contents = $(selector).children("p").position();
			$('#editor-wrapper')
				.css({position: 'absolute', top: p.top + p_contents.top, left: p.left + p_contents.left, display: 'block'})
				.appendTo($('#layer2'))
				.focus()
				.on("keydown", function(e: JQueryEventObject) {
					if(e.keyCode == 27 /* ESC */){
						e.stopPropagation();
						$(selector).blur();
					}
				})
			self.selector = selector;
			$(selector)
				.unbind('hover')
				.on("blur", {node : node}, function(e: JQueryEventObject, node: JQuery) {
					console.log("blur");
					e.stopPropagation();
					var label : string = e.data.node.attr('id');
					var decoder    : AssureIt.CaseDecoder = new AssureIt.CaseDecoder();
					var new_model  : AssureIt.NodeModel = decoder.ParseASN(case0, editor.getValue().trim(), orig_model);
					if (new_model != null) {
						/*update orig_model and redraw html*/
						//orig_model.IsEditing = false;
						orig_model.Statement = new_model.Statement == null ? "" : new_model.Statement;
						orig_model.Annotations = new_model.Annotations;
						orig_model.Notes = new_model.Notes;
						orig_shape.HTMLDoc.Render(caseViewer, orig_model);
						orig_model.EnableEditFlag();

						caseViewer.Draw();
					}
					$('#editor-wrapper').css({display: 'none'});
				});
			editor.setValue(encoded);
			editor.refresh();
			editor.focus();
			$('#CodeMirror').focus();
			$('#background').click(function(){
					$(selector).blur(); 
				});
		});
		return true;
	}

	DeleteFromDOM(): void {
		$(this.selector).blur();
	}

	DisableEvent(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): void {
		$('.node').unbind('dblclick');
	}
}
