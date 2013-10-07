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
        this.currentNodeColor = [];
        this.HitNodes = [];
    }
    SearchWordKeyPlugIn.prototype.RegisterKeyEvents = function (Case0, caseViewer, serverApi) {
        var _this = this;
        this.caseViewer = caseViewer;
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
                                _this.SearchStarted = false;
                                _this.Search(Case0, caseViewer, serverApi, _this.SearchStarted);
                                _this.HasStarted = true;
                            } else {
                                if ($('#searchform input:first').val() != _this.Keyword) {
                                    _this.Color(_this.HitNodes, _this.currentNodeColor, caseViewer, true);
                                    $('body').unbind("keydown", _this.Search.controllSearch);
                                    _this.HitNodes = [];
                                    _this.currentNodeColor = [];
                                    console.log($('#searchform input:first').val());
                                    _this.HasStarted = false;
                                }
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
        this.Keyword = $('#searchform input:first').val();
        var nodeIndex = 0;
        var moveFlag = false;
        var TopNodeModel = Case0.ElementTop;

        if (this.Keyword == "") {
            return;
        }

        console.log(TopNodeModel.SearchNode(this.Keyword, this.HitNodes));

        if (this.HitNodes.length == 0) {
            return;
        }

        this.Color(this.HitNodes, this.currentNodeColor, caseViewer, false);
        var NodeLabel = this.HitNodes[nodeIndex].Label;
        var CaseMap = caseViewer.ViewMap[NodeLabel];
        var NodePosX = CaseMap.AbsX;
        var NodePosY = CaseMap.AbsY;
        var currentHTML = CaseMap.HTMLDoc;
        var screenManager = caseViewer.Screen;
        var destinationX = screenManager.ConvertX(NodePosX, currentHTML);
        var destinationY = screenManager.ConvertY(NodePosY, currentHTML);

        console.log('X=' + destinationX + 'Y=' + destinationY);
        console.log("start moving");
        this.Move(destinationX, destinationY, 100, function () {
        });
        CaseMap.SVGShape.SetColor("#ffff00", "#ff4500");
        this.SearchStarted = true;

        var controllSearch = function (e) {
            if (e.keyCode == 81) {
                console.log('quitting');
                $('body').unbind("keydown", controllSearch);
                _this.Color(_this.HitNodes, _this.currentNodeColor, caseViewer, true);
                $('#searchform').remove();
                _this.HitNodes = [];
                _this.currentNodeColor = [];
                _this.HasStarted = false;
                _this.SearchStarted = false;
            }

            if (e.keyCode == 13) {
                console.log("pushed enter button");
                if (!moveFlag) {
                    if (_this.HitNodes.length == 1) {
                        return;
                    }

                    nodeIndex++;
                    if (nodeIndex == _this.HitNodes.length) {
                        nodeIndex = 0;
                    }

                    NodeLabel = _this.HitNodes[nodeIndex].Label;
                    CaseMap = caseViewer.ViewMap[NodeLabel];
                    NodePosX = CaseMap.AbsX;
                    NodePosY = CaseMap.AbsY;
                    currentHTML = CaseMap.HTMLDoc;
                    destinationX = screenManager.ConvertX(NodePosX, currentHTML);
                    destinationY = screenManager.ConvertY(NodePosY, currentHTML);

                    console.log('X=' + destinationX + 'Y=' + destinationY);
                    moveFlag = true;

                    _this.Move(destinationX, destinationY, 100, function () {
                        moveFlag = false;

                        if (nodeIndex == 0) {
                            caseViewer.ViewMap[_this.HitNodes[_this.HitNodes.length - 1].Label].SVGShape.SetColor("#ffff00", "#ffff00");
                        } else {
                            caseViewer.ViewMap[_this.HitNodes[nodeIndex - 1].Label].SVGShape.SetColor("#ffff00", "#ffff00");
                        }
                        CaseMap.SVGShape.SetColor("#ffff00", "#ff4500");
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
                if (i == 0) {
                    console.log('iicolor is ..' + this.currentNodeColor[i]['fill'] + 'and ' + this.currentNodeColor[i]['stroke']);
                }
                var thisNodeLabel = HitNodes[i].Label;
                caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(this.currentNodeColor[i]["fill"], this.currentNodeColor[i]["stroke"]);
            }
        } else {
            for (var i = 0; i < HitNodes.length; i++) {
                var thisNodeLabel = this.HitNodes[i].Label;
                this.currentNodeColor[i] = caseViewer.ViewMap[thisNodeLabel].SVGShape.GetColor();
                caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor("#ffff00", "#ffff00");
                if (i == 0) {
                    console.log('color is ..' + this.currentNodeColor[i]['fill'] + 'and ' + this.currentNodeColor[i]['stroke']);
                }
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
