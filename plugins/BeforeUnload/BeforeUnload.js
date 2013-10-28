var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BeforeUnloadPlugIn = (function (_super) {
    __extends(BeforeUnloadPlugIn, _super);
    function BeforeUnloadPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.ActionPlugIn = new BeforeUnloadActionPlugIn(plugInManager);
        this.HTMLRenderPlugIn = new BeforeUnloadHTMLPlugIn(plugInManager);
    }
    return BeforeUnloadPlugIn;
})(AssureIt.PlugInSet);

var BeforeUnloadActionPlugIn = (function (_super) {
    __extends(BeforeUnloadActionPlugIn, _super);
    function BeforeUnloadActionPlugIn(plugInManager) {
        _super.call(this, plugInManager);
    }
    BeforeUnloadActionPlugIn.prototype.IsEnabled = function (caseViewer, case0) {
        return case0.IsEditable();
    };

    BeforeUnloadActionPlugIn.prototype.Delegate = function (caseViewer, case0, serverApi) {
        $(window).unbind("beforeunload");
        $(window).bind("beforeunload", function (e) {
            if (case0.IsModified() && case0.IsLatest()) {
                return "You have uncommited change.";
            }
        });
        return true;
    };
    return BeforeUnloadActionPlugIn;
})(AssureIt.ActionPlugIn);

var BeforeUnloadHTMLPlugIn = (function (_super) {
    __extends(BeforeUnloadHTMLPlugIn, _super);
    function BeforeUnloadHTMLPlugIn(plugInManager) {
        _super.call(this, plugInManager);
    }
    BeforeUnloadHTMLPlugIn.prototype.IsEnabled = function (caseViewer, nodeModel) {
        return true;
    };

    BeforeUnloadHTMLPlugIn.prototype.Delegate = function (caseViewer, nodeModel, element) {
        return true;
    };
    return BeforeUnloadHTMLPlugIn;
})(AssureIt.HTMLRenderPlugIn);
