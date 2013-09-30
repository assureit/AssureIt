///<reference path="../../src/CaseModel.ts" />
///<reference path="../../src/CaseEncoder.ts" />
///<reference path="../../src/ServerApi.ts" />
///<reference path="../../src/PlugInManager.ts" />
///<reference path="../Editor/Editor.ts" />
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
        this.ShortcutKeyPlugIn = new SearchWordKeyPlugIn(plugInManager);
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

var SearchWordKeyPlugIn = (function (_super) {
    __extends(SearchWordKeyPlugIn, _super);
    function SearchWordKeyPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
    }
    SearchWordKeyPlugIn.prototype.RegisterKeyEvents = function (Case0, caseViewer, serverApi) {
        var _this = this;
        this.caseViewer = caseViewer;
        $("body").keydown(function (e) {
            if (e.ctrlKey) {
                if (e.keyCode == 70) {
                    console.log("here");
                    _this.Search(Case0, caseViewer, serverApi);
                }
            }
        });
        return true;
    };

    SearchWordKeyPlugIn.prototype.Search = function (Case0, caseViewer, serverApi) {
        var _this = this;
        var Keyword = prompt("Enter some words you want to search");
        if (Keyword == "") {
            return;
        }

        var TopNodeModel = Case0.ElementTop;

        var HitNodes = [];

        console.log(TopNodeModel.SearchNode(Keyword, HitNodes));

        var currentNodeColor = [];

        for (var i = 0; i < HitNodes.length; i++) {
            var thisNodeLabel = HitNodes[i].Label;
            currentNodeColor[i] = caseViewer.ViewMap[thisNodeLabel].SVGShape.GetColor();
            caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor("#ffff00", "#ffff00");
        }

        var nodeIndex = 0;
        var moveFlag = false;

        var screenManager = caseViewer.Screen;

        var NodePosX = caseViewer.ViewMap[HitNodes[nodeIndex].Label].AbsX;
        var NodePosY = caseViewer.ViewMap[HitNodes[nodeIndex].Label].AbsY;
        var currentHTML = caseViewer.ViewMap[HitNodes[nodeIndex].Label].HTMLDoc;

        var destinationX = screenManager.ConvertX(NodePosX, currentHTML);
        var destinationY = screenManager.ConvertY(NodePosY, currentHTML);

        this.Move(destinationX, destinationY, 500, function () {
        });

        var controllSearch = function (e) {
            if (e.keyCode == 81) {
                $("body").unbind("keydown", controllSearch);
                for (var i = 0; i < HitNodes.length; i++) {
                    var thisNodeLabel = HitNodes[i].Label;
                    caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(currentNodeColor[i]["fill"], currentNodeColor[i]["stroke"]);
                }
            }

            if (e.keyCode == 13) {
                if (!moveFlag) {
                    if (HitNodes.length == 1) {
                        return;
                    }

                    nodeIndex++;
                    if (nodeIndex == HitNodes.length) {
                        nodeIndex = 0;
                    }

                    NodePosX = caseViewer.ViewMap[HitNodes[nodeIndex].Label].AbsX;
                    NodePosY = caseViewer.ViewMap[HitNodes[nodeIndex].Label].AbsY;
                    currentHTML = caseViewer.ViewMap[HitNodes[nodeIndex].Label].HTMLDoc;
                    destinationX = screenManager.ConvertX(NodePosX, currentHTML);
                    destinationY = screenManager.ConvertY(NodePosY, currentHTML);
                    moveFlag = true;
                    _this.Move(destinationX, destinationY, 500, function () {
                        moveFlag = false;
                    });
                    console.log("after calling Move");
                }
            }
        };
        $("body").keydown(controllSearch);
    };

    SearchWordKeyPlugIn.prototype.Move = function (logicalOffsetX, logicalOffsetY, duration, callback) {
        var cycle = 1000 / 30;
        var cycles = duration / cycle;
        var screenManager = this.caseViewer.Screen;
        var initialX = screenManager.GetOffsetX();
        var initialY = screenManager.GetOffsetY();

        var deltaX = (logicalOffsetX - initialX) / cycles;
        var deltaY = (logicalOffsetY - initialY) / cycles;

        var currentX = initialX;
        var currentY = initialY;
        var count = 0;

        var move = function () {
            console.log("move function");
            if (count < cycles) {
                count += 1;
                currentX += deltaX;
                currentY += deltaY;
                screenManager.SetLogicalOffset(currentX, currentY, 1);
                setTimeout(move, cycle);
            } else {
                screenManager.SetLogicalOffset(logicalOffsetX, logicalOffsetY, 1);
                callback();
            }
        };
        move();
    };
    return SearchWordKeyPlugIn;
})(AssureIt.ShortcutKeyPlugIn);
