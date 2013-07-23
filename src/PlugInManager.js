var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var PlugIn = (function () {
    function PlugIn() {
    }
    return PlugIn;
})();

var ActionPlugIn = (function (_super) {
    __extends(ActionPlugIn, _super);
    function ActionPlugIn() {
        _super.apply(this, arguments);
    }
    return ActionPlugIn;
})(PlugIn);

var CheckerPlugIn = (function (_super) {
    __extends(CheckerPlugIn, _super);
    function CheckerPlugIn() {
        _super.apply(this, arguments);
    }
    return CheckerPlugIn;
})(PlugIn);

var RenderPlugIn = (function (_super) {
    __extends(RenderPlugIn, _super);
    function RenderPlugIn() {
        _super.apply(this, arguments);
    }
    return RenderPlugIn;
})(PlugIn);

var PlugInManager = (function () {
    function PlugInManager() {
        this.ActionPlugIns = [];
        this.DefaultCheckerPlugIns = [];
        this.CheckerPlugInMap = {};
        this.DefaultRenderPlugIns = [];
        this.RenderPlugInMap = {};
    }
    return PlugInManager;
})();
