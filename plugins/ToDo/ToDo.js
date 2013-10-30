var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ToDoPlugIn = (function (_super) {
    __extends(ToDoPlugIn, _super);
    function ToDoPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.SVGRenderPlugIn = new ToDoSVGRenderPlugIn(plugInManager);
    }
    return ToDoPlugIn;
})(AssureIt.PlugInSet);

var ToDoSVGRenderPlugIn = (function (_super) {
    __extends(ToDoSVGRenderPlugIn, _super);
    function ToDoSVGRenderPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
    }
    ToDoSVGRenderPlugIn.prototype.IsEnabled = function (caseViewer, elementShape) {
        return true;
    };

    ToDoSVGRenderPlugIn.prototype.Delegate = function (caseViewer, elementShape) {
        var model = elementShape.Source;
        var found = false;
        for (var key in model.Notes) {
            if (key == 'TODO') {
                found = true;
            }
        }
        if (found) {
            elementShape.SVGShape.SetColor(AssureIt.Color.Danger);
        }
        return true;
    };
    return ToDoSVGRenderPlugIn;
})(AssureIt.SVGRenderPlugIn);
