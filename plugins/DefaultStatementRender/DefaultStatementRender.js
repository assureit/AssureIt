var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var DefaultStatementRenderPlugIn = (function (_super) {
    __extends(DefaultStatementRenderPlugIn, _super);
    function DefaultStatementRenderPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.HTMLRenderPlugIn = new DefaultStatementHTMLRenderPlugIn(plugInManager);
    }
    return DefaultStatementRenderPlugIn;
})(AssureIt.PlugIn);

var DefaultStatementHTMLRenderPlugIn = (function (_super) {
    __extends(DefaultStatementHTMLRenderPlugIn, _super);
    function DefaultStatementHTMLRenderPlugIn() {
        _super.apply(this, arguments);
    }
    DefaultStatementHTMLRenderPlugIn.prototype.IsEnabled = function (caseViewer, caseModel) {
        return true;
    };

    DefaultStatementHTMLRenderPlugIn.prototype.Delegate = function (caseViewer, caseModel, element) {
        var statements = caseModel.Statement.split("\n");
        var content = "";
        for (var i = 0; i < statements.length; i++) {
            content += statements[i] + "<br>";
        }
        $('<p>' + content + '</p>').appendTo(element);
        return true;
    };
    return DefaultStatementHTMLRenderPlugIn;
})(AssureIt.HTMLRenderPlugIn);
