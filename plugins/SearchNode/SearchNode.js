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

        this.ShortcutKeyPlugIn = new SearchWordKeyPlugIn(plugInManager);
    }
    return SearchNodePlugIn;
})(AssureIt.PlugInSet);

var SearchWordKeyPlugIn = (function (_super) {
    __extends(SearchWordKeyPlugIn, _super);
    function SearchWordKeyPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.currentNodeColor = [];
        this.HitNodes = [];
        this.FirstMove = false;
    }
    SearchWordKeyPlugIn.prototype.RegisterKeyEvents = function (caseViewer, Case0, serverApi) {
        var _this = this;
        this.caseViewer = caseViewer;
        this.HasStarted = false;
        $("body").keydown(function (e) {
            if (e.ctrlKey) {
                if (e.keyCode == 81) {
                    e.preventDefault();
                    $('nav').remove();
                }
                if (e.keyCode == 70) {
                    e.preventDefault();
                    console.log("form length" + $('nav').length);
                    if ($('nav').length == 0) {
                        _this.CreateSearchWindow();

                        $('.navbar-form input:first').focus();
                        $('.btn').click(function (ev) {
                            ev.preventDefault();
                            if (!_this.HasStarted) {
                                _this.Search(Case0, caseViewer, serverApi);
                                _this.HasStarted = true;
                            } else {
                                if ($('.navbar-form input:first').val() != _this.Keyword) {
                                    _this.FirstMove = true;
                                    _this.Color(_this.HitNodes, _this.currentNodeColor, caseViewer, true);
                                    $('body').unbind("keydown", _this.Search.controllSearch);
                                    _this.HitNodes = [];
                                    _this.currentNodeColor = [];
                                    console.log('before firstmove search');
                                    _this.Search(Case0, caseViewer, serverApi);
                                    if (_this.HitNodes.length == 0) {
                                        _this.HasStarted = false;
                                    }

                                    console.log($('.navbar-form input:first').val());
                                }
                            }
                        });
                    }
                }
            }
        });
        return true;
    };

    SearchWordKeyPlugIn.prototype.Search = function (Case0, caseViewer, serverApi) {
        var _this = this;
        this.Keyword = $('.navbar-form input:first').val();
        var nodeIndex = 0;
        var moveFlag = false;
        var TopNodeModel = Case0.ElementTop;

        if (this.Keyword == "") {
            return;
        }

        console.log('here is code');

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
            _this.FirstMove = false;
        });
        CaseMap.SVGShape.SetColor("#ffff00", "#ff4500");

        var controllSearch = function (e) {
            if (e.ctrlKey) {
                if (e.keyCode == 81) {
                    console.log('quitting');
                    $('body').unbind("keydown", controllSearch);
                    _this.Color(_this.HitNodes, _this.currentNodeColor, caseViewer, true);
                    $('nav').remove();
                    _this.HitNodes = [];
                    _this.currentNodeColor = [];
                    _this.HasStarted = false;
                }
            }
            if (!e.shiftKey) {
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

                            if (!_this.FirstMove) {
                                console.log('here for one');
                                CaseMap.SVGShape.SetColor("#ffff00", "#ff4500");
                            }
                        });
                        console.log("after calling Move");
                    }
                }
            } else {
                if (e.keyCode == 13) {
                    console.log("pushed enter button");
                    if (!moveFlag) {
                        if (_this.HitNodes.length == 1) {
                            return;
                        }

                        nodeIndex--;
                        if (nodeIndex == -1) {
                            nodeIndex = _this.HitNodes.length - 1;
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

                            if (nodeIndex == _this.HitNodes.length - 1) {
                                caseViewer.ViewMap[_this.HitNodes[0].Label].SVGShape.SetColor("#ffff00", "#ffff00");
                            } else {
                                caseViewer.ViewMap[_this.HitNodes[nodeIndex + 1].Label].SVGShape.SetColor("#ffff00", "#ffff00");
                            }

                            if (!_this.FirstMove) {
                                console.log('here for one');
                                CaseMap.SVGShape.SetColor("#ffff00", "#ff4500");
                            }
                        });
                        console.log("after calling Move");
                    }
                }
            }
        };
        $('body').keydown(controllSearch);
    };

    SearchWordKeyPlugIn.prototype.CreateSearchWindow = function () {
        $('<nav class="navbar pull-right" style="position: absolute"><form class="navbar-form" role="Search"><input type="text" class="form-control" placeholder="Search"/><input type="submit" value="search" class="btn"/></form></nav>').appendTo($('body'));

        $('nav').css({ width: '260px', margin: 0, height: '24px', top: '0', right: '0' });

        $('.navbar-form').css({ width: '230px', position: 'absolute' });

        $('.form-control').css({ width: '156px', position: 'absolute' });

        $('.btn').css({ position: 'absolute', left: '176px' });
    };

    SearchWordKeyPlugIn.prototype.Color = function (HitNodes, currentNodeColor, caseViewer, enterFlag) {
        if (enterFlag) {
            for (var i = 0; i < HitNodes.length; i++) {
                if (i == 0) {
                    console.log('iicolor is ..' + this.currentNodeColor[i]['fill'] + 'and  ' + this.currentNodeColor[i]['stroke']);
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
