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
        this.MenuBarContentsPlugIn = new CopyPasteMenuBarPlugIn(plugInManager);
    }
    return CopyPastePlugIn;
})(AssureIt.PlugInSet);

var CopyPasteMenuBarPlugIn = (function (_super) {
    __extends(CopyPasteMenuBarPlugIn, _super);
    function CopyPasteMenuBarPlugIn(plugInManager) {
        _super.call(this, plugInManager);
    }
    return CopyPasteMenuBarPlugIn;
})(AssureIt.MenuBarContentsPlugIn);
