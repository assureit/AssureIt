/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseEncoder.ts" />
/// <reference path="../../src/ServerApi.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../Editor/Editor.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var SearchNodePlugIn = (function (_super) {
    __extends(SearchNodePlugIn, _super);
    function SearchNodePlugIn(plugInManager) {
        _super.call(this, plugInManager);
        //var plugin: SearchNodeActionPlugIn = new SearchNodeActionPlugIn(plugInManager);
        //this.ActionPlugIn = plugin;
    }
    return SearchNodePlugIn;
})(AssureIt.PlugInSet);
