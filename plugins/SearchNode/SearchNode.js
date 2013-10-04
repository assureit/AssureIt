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
        this.SearchStarted = false;
        this.HasStarted = false;
        $("body").keydown(function (e) {
            if (e.ctrlKey) {
                if (e.keyCode == 70) {
                    e.preventDefault();
                    if ($('#searchform').length != 1) {
                        console.log("here");
                        _this.CreateSearchWindow();
                        $('#searchform').show(2000);
                        $('#searchform input:first').focus();
                        $('#searchbutton').click(function (ev) {
                            ev.preventDefault();
                            if (!_this.HasStarted) {
                                _this.Search(Case0, caseViewer, serverApi, _this.SearchStarted);
                                _this.HasStarted = true;
                            } else {
                                var tempstring = $('#searchform input:first').val();
                                console.log(tempstring);
                            }
                        });
                    }
                }
            }
        });
        return true;
    };

    SearchWordKeyPlugIn.prototype.Search = function (Case0, caseViewer, serverApi, SearchStarted) {
        var _this = this;
        var Keyword = $('#searchform input:first').val();
        var nodeIndex = 0;
        var moveFlag = false;
        var TopNodeModel = Case0.ElementTop;
        var HitNodes = [];

        if (Keyword == "") {
            return;
        }

        console.log(TopNodeModel.SearchNode(Keyword, HitNodes));

        var currentNodeColor = [];

        this.Color(HitNodes, currentNodeColor, caseViewer, SearchStarted);
        var NodePosX = caseViewer.ViewMap[HitNodes[nodeIndex].Label].AbsX;
        var NodePosY = caseViewer.ViewMap[HitNodes[nodeIndex].Label].AbsY;
        var currentHTML = caseViewer.ViewMap[HitNodes[nodeIndex].Label].HTMLDoc;
        var screenManager = caseViewer.Screen;
        var destinationX = screenManager.ConvertX(NodePosX, currentHTML);
        var destinationY = screenManager.ConvertY(NodePosY, currentHTML);

        console.log('X=' + destinationX + 'Y=' + destinationY);
        console.log("start moving");
        this.Move(destinationX, destinationY, 100, function () {
        });

        SearchStarted = true;

        var controllSearch = function (e) {
            if (e.keyCode == 81) {
                $('body').unbind("keydown", controllSearch);
                _this.Color(HitNodes, currentNodeColor, caseViewer, SearchStarted);
                $('#searchform').remove();
                _this.HasStarted = false;
            }

            if (e.keyCode == 13) {
                console.log("pushed enter button");
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

                    console.log('X=' + destinationX + 'Y=' + destinationY);
                    moveFlag = true;

                    _this.Move(destinationX, destinationY, 100, function () {
                        moveFlag = false;
                    });
                    console.log("after calling Move");
                }
            }
        };
        $('body').keydown(controllSearch);
    };

    SearchWordKeyPlugIn.prototype.CreateSearchWindow = function () {
        $('<form name="searchform" id="searchform" action="#"><input type="text" name="keyword" class="keyword"/><input type="submit" value="search" name="searchbutton" id="searchbutton"/></form>').appendTo($('body'));

        $('#searchform').css({ width: '200px', background: '"url(./img/input.gif)" "left" "top" "no-repeat"', display: 'block', height: '24px', position: 'float', top: 0, left: 0 });

        $('.keyword').css({ width: '156px', position: 'absolute', top: '3px', left: '12px', border: "'1px' 'solid' '#FFF'" });

        $('#searchbutton').css({ position: 'absolute', top: '3px', left: '174px' });
    };

    SearchWordKeyPlugIn.prototype.Color = function (HitNodes, currentNodeColor, caseViewer, enterFlag) {
        if (enterFlag) {
            for (var i = 0; i < HitNodes.length; i++) {
                var thisNodeLabel = HitNodes[i].Label;
                caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(currentNodeColor[i]["fill"], currentNodeColor[i]["stroke"]);
            }
        } else {
            for (var i = 0; i < HitNodes.length; i++) {
                var thisNodeLabel = HitNodes[i].Label;
                currentNodeColor[i] = caseViewer.ViewMap[thisNodeLabel].SVGShape.GetColor();
                caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor("#ffff00", "#ffff00");
            }
        }
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
