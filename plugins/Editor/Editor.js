var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ExpandedNodeHeight = 200;
var InplaceEditorHeight = ExpandedNodeHeight - 50;

var EditorPlugIn = (function (_super) {
    __extends(EditorPlugIn, _super);
    function EditorPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.ActionPlugIn = new EditorActionPlugIn(plugInManager);
        this.HTMLRenderPlugIn = new EditorLayoutPlugIn(plugInManager);
    }
    return EditorPlugIn;
})(AssureIt.PlugInSet);

var EditorLayoutPlugIn = (function (_super) {
    __extends(EditorLayoutPlugIn, _super);
    function EditorLayoutPlugIn(plugInManager) {
        _super.call(this, plugInManager);
    }
    EditorLayoutPlugIn.prototype.IsEnabled = function (caseViewer, caseModel) {
        return true;
    };

    EditorLayoutPlugIn.prototype.Delegate = function (caseViewer, caseModel, element) {
        return true;
    };
    return EditorLayoutPlugIn;
})(AssureIt.HTMLRenderPlugIn);

var EditorActionPlugIn = (function (_super) {
    __extends(EditorActionPlugIn, _super);
    function EditorActionPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
            lineNumbers: false,
            mode: "text/x-asn",
            lineWrapping: true
        });
        this.editor.setSize("300px", "200px");
        $('#editor-wrapper').css({ display: 'none', opacity: '1.0' });
    }
    EditorActionPlugIn.prototype.IsEnabled = function (caseViewer, case0) {
        return case0.IsEditable();
    };

    EditorActionPlugIn.prototype.Delegate = function (caseViewer, case0, serverApi) {
        var editor = this.editor;
        var self = this;
        $('.node').unbind('dblclick');
        $('.node').dblclick(function (ev) {
            ev.stopPropagation();
            self.plugInManager.UseUILayer(self);
            var node = $(this);
            var p = node.position();
            var p_contents = node.children("p").position();
            var label = node.attr('id');
            var selector = "#" + label;
            console.log(selector);
            console.log($(selector).height() + ", " + p_contents.top);
            editor.setSize(node.children("p").width(), InplaceEditorHeight);

            var encoder = new AssureIt.CaseEncoder();
            var encoded = encoder.ConvertToASN(case0.ElementMap[label], true);

            var orig_model = case0.ElementMap[label];
            var orig_shape = caseViewer.ViewMap[label];

            orig_shape.HTMLDoc.Render(caseViewer, orig_model);

            caseViewer.Draw();

            p = $(selector).position();
            p_contents = $(selector).children("p").position();
            $('#editor-wrapper').css({ position: 'absolute', top: p.top + p_contents.top, left: p.left + p_contents.left, display: 'block' }).appendTo($('#layer2')).focus().on("keydown", function (e) {
                if (e.keyCode == 27) {
                    e.stopPropagation();
                    $(selector).blur();
                }
            });
            self.selector = selector;
            $(selector).unbind('hover').on("blur", { node: node }, function (e, node) {
                console.log("blur");
                e.stopPropagation();
                var label = e.data.node.attr('id');
                var decoder = new AssureIt.CaseDecoder();
                var new_model = decoder.ParseASN(case0, editor.getValue().trim(), orig_model);
                if (new_model != null) {
                    orig_model.Statement = new_model.Statement == null ? "" : new_model.Statement;
                    orig_model.Annotations = new_model.Annotations;
                    orig_model.Notes = new_model.Notes;
                    orig_shape.HTMLDoc.Render(caseViewer, orig_model);
                    orig_model.EnableEditFlag();

                    caseViewer.Draw();
                }
                $('#editor-wrapper').css({ display: 'none' });
            });
            editor.setValue(encoded);
            editor.refresh();
            editor.focus();
            $('#CodeMirror').focus();
            $('#background').click(function () {
                $(selector).blur();
            });
        });
        return true;
    };

    EditorActionPlugIn.prototype.DeleteFromDOM = function () {
        $(this.selector).blur();
    };

    EditorActionPlugIn.prototype.DisableEvent = function (caseViewer, case0, serverApi) {
        $('.node').unbind('dblclick');
    };
    return EditorActionPlugIn;
})(AssureIt.ActionPlugIn);
