var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var CopyPastePlugIn = (function (_super) {
    __extends(CopyPastePlugIn, _super);
    function CopyPastePlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.MenuBarContentsPlugIn = new CopyPasteMenuPlugIn(plugInManager);
    }
    return CopyPastePlugIn;
})(AssureIt.PlugInSet);

var CopyPasteMenuPlugIn = (function (_super) {
    __extends(CopyPasteMenuPlugIn, _super);
    function CopyPasteMenuPlugIn(plugInManager) {
        _super.call(this, plugInManager);
    }
    CopyPasteMenuPlugIn.prototype.IsEnabled = function (caseViewer, caseModel) {
        return true;
    };

    CopyPasteMenuPlugIn.prototype.Delegate = function (caseViewer, caseModel, element, serverApi) {
        return true;
    };
    return CopyPasteMenuPlugIn;
})(AssureIt.MenuBarContentsPlugIn);
