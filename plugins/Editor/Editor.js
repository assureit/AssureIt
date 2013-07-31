var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var EditorPlugIn = (function (_super) {
    __extends(EditorPlugIn, _super);
    function EditorPlugIn() {
        _super.call(this);
        wideArea();
        $('#editor').css({ display: 'none' });
    }
    EditorPlugIn.prototype.IsEnabled = function (caseViewer, case0) {
        return true;
    };

    EditorPlugIn.prototype.Delegate = function (caseViewer, case0, serverApi) {
        $('.node').click(function (ev) {
            ev.stopPropagation();
            var node = $(this);
            var p = node.position();
            $('#editor').css({ position: 'absolute', top: p.top, left: p.left, display: 'block' }).appendTo($('#layer2')).focus().one("blur", { node: node }, function (e, node) {
                e.stopPropagation();
                var label = e.data.node.text();
                var orig_model = case0.ElementMap[label];
                var orig_shape = caseViewer.ViewMap[label];
                var decoder = new CaseDecoder();
                var new_model = decoder.ParseASN(case0, $(this).val(), orig_model);
                var new_shape = new ElementShape(caseViewer, new_model);
                (function (model, shape) {
                    for (var i = 0; i < model.Children.length; i++) {
                        var child_model = model.Children[i];
                        var child_shape = new ElementShape(caseViewer, child_model);
                        arguments.callee(child_model, child_shape);
                    }
                    caseViewer.ViewMap[model.Label] = shape;
                    if (model.Parent != null)
                        shape.ParentShape = caseViewer.ViewMap[model.Parent.Label];
                })(new_model, new_shape);
                caseViewer.Resize();
                orig_shape.DeleteHTMLElementRecursive($("#layer0"), $("#layer1"));
                new_shape.AppendHTMLElementRecursive($("#layer0"), $("#layer1"), caseViewer);
                caseViewer.LayoutElement();
                for (var viewkey in caseViewer.ViewMap) {
                    caseViewer.ViewMap[viewkey].Update();
                }
                $(this).css({ display: 'none' });
            }).on("keydown", function (e) {
                if (e.keyCode == 27) {
                    e.stopPropagation();
                    $(this).css({ display: 'none' });
                }
            });
        });
        $('#layer1').click(function () {
            $('#editor').blur();
        });
        return true;
    };
    return EditorPlugIn;
})(ActionPlugIn);
