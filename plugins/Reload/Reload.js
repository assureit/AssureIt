var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ReloadPlugIn = (function (_super) {
    __extends(ReloadPlugIn, _super);
    function ReloadPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.ShortcutKeyPlugIn = new ReloadKeyPlugIn(plugInManager);
    }
    return ReloadPlugIn;
})(AssureIt.PlugInSet);

var ReloadKeyPlugIn = (function (_super) {
    __extends(ReloadKeyPlugIn, _super);
    function ReloadKeyPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
    }
    ReloadKeyPlugIn.prototype.IsEnabled = function (Case0, serverApi) {
        return true;
    };

    ReloadKeyPlugIn.prototype.RegisterKeyEvents = function (Case0, caseViewer, serverApi) {
        $("body").keydown(function (e) {
            if (e.keyCode == 82 && e.shiftKey) {
                caseViewer.DeleteHTMLElementAll();
                caseViewer.Draw();
            }
        });
        return true;
    };

    ReloadKeyPlugIn.prototype.DeleteFromDOM = function () {
    };

    ReloadKeyPlugIn.prototype.DisableEvent = function (caseViewer, case0, serverApi) {
    };
    return ReloadKeyPlugIn;
})(AssureIt.ShortcutKeyPlugIn);
