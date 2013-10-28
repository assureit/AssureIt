/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var LastModifiedPlugIn = (function (_super) {
    __extends(LastModifiedPlugIn, _super);
    function LastModifiedPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.HTMLRenderPlugIn = new LastModifiedHTMLRenderPlugIn(plugInManager);
    }
    return LastModifiedPlugIn;
})(AssureIt.PlugInSet);

var LastModifiedHTMLRenderPlugIn = (function (_super) {
    __extends(LastModifiedHTMLRenderPlugIn, _super);
    function LastModifiedHTMLRenderPlugIn() {
        _super.apply(this, arguments);
    }
    LastModifiedHTMLRenderPlugIn.prototype.IsEnabled = function (caseViewer, nodeModel) {
        return true;
    };

    LastModifiedHTMLRenderPlugIn.prototype.Delegate = function (caseViewer, nodeModel, element) {
        element.children("#lastmodified").remove();
        var summary = caseViewer.Source.oldsummary;
        if (summary && summary.lastModified && summary.lastModified[nodeModel.Label]) {
            console.log("hi");
            var $modified = $('<div id="lastmodified" class="text-right" ><small>Last Updated: ' + summary.lastModified[nodeModel.Label].userName + '</small></div>');
            $modified.appendTo(element);
        }

        return true;
    };
    return LastModifiedHTMLRenderPlugIn;
})(AssureIt.HTMLRenderPlugIn);
