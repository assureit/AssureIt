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
        this.MenuBarContentsPlugIn = new SearchNodeMenuPlugIn(plugInManager);
    }
    return SearchNodePlugIn;
})(AssureIt.PlugInSet);

var SearchNodeMenuPlugIn = (function (_super) {
    __extends(SearchNodeMenuPlugIn, _super);
    function SearchNodeMenuPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.element = null;
        this.caseViewer = null;
    }
    SearchNodeMenuPlugIn.prototype.IsEnabled = function (caseViewer, caseModel) {
        return true;
    };

    SearchNodeMenuPlugIn.prototype.Delegate = function (caseViewer, caseModel, element, serverApi) {
        var _this = this;
        this.caseViewer = caseViewer;
        this.element = element;
        element.append('<a href="#" ><img id="center" src="' + serverApi.basepath + 'images/scale.png" title="Search" alt="Search" /></a>');
        $('#center').unbind('click');
        $('#center').click(function () {
            _this.Center();
        });

        //element.append('<a href="#" ><img id="SearchNode-xml" src="' + serverApi.basepath + 'images/icon.png" title="SearchNode XML" alt="XML" /></a>');
        //$('#SearchNode-xml').unbind('click');
        //$('#SearchNode-xml').click(this.editorPlugIn.SearchNodeXml);
        return true;
    };

    SearchNodeMenuPlugIn.prototype.Center = function () {
        var thisLabel = this.element.children('h4').text();
        var thisNodeView = this.caseViewer.ViewMap[thisLabel];
        return;
    };
    return SearchNodeMenuPlugIn;
})(AssureIt.MenuBarContentsPlugIn);
