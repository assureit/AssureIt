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
    }
    SearchWordKeyPlugIn.prototype.RegisterKeyEvents = function (caseViewer, Case0, serverApi) {
        var Target = new Search();
        Target.CreateSearchWindow();

        $("body").keydown(function (e) {
            if (e.ctrlKey) {
                if (e.keyCode == 70) {
                    e.preventDefault();
                    $('nav').toggle();
                    if ($('nav').css('display') == 'block') {
                        $('.form-control').focus();
                    } else {
                        Target.SetAllNodesColor(Target.HitNodes, caseViewer, "Default");
                        Target.ResetParam();
                    }
                }
            }
        });

        $('#searchbtn').click(function (ev) {
            ev.preventDefault();
            if (!Target.MoveFlag && $('.form-control').val() != "") {
                Target.Search(Target.CheckInput(caseViewer), ev.shiftKey, caseViewer, Case0);
            } else {
                Target.SetAllNodesColor(Target.HitNodes, caseViewer, "Default");
                Target.ResetParam();
            }
        });
        return true;
    };
    return SearchWordKeyPlugIn;
})(AssureIt.ShortcutKeyPlugIn);

var Search = (function () {
    function Search() {
        this.SearchWord = "";
        this.DestinationX = 0;
        this.DestinationY = 0;
        this.NodeIndex = 0;
        this.MoveFlag = false;
        this.HitNodes = [];
    }
    Search.prototype.Search = function (IsFirst, ShiftKey, CaseViewer, Case0) {
        var _this = this;
        if (IsFirst) {
            var TopNodeModel = Case0.ElementTop;
            this.SearchWord = $('.form-control').val();

            if (this.SearchWord == "") {
                return;
            }
            TopNodeModel.SearchNode(this.SearchWord, this.HitNodes);

            if (this.HitNodes.length == 0) {
                this.SearchWord = "";
                return;
            }

            this.MoveFlag = true;
            this.SetAllNodesColor(this.HitNodes, CaseViewer, "Search");
            this.SetDestination(this.HitNodes[0], CaseViewer);
            CaseViewer.ViewMap[this.HitNodes[0].Label].SVGShape.EnableHighlight();
            this.MoveToNext(CaseViewer, function () {
                _this.MoveFlag = false;
            });
        } else {
            if (this.HitNodes.length == 1) {
                return;
            }
            if (!ShiftKey) {
                this.NodeIndex++;
                if (this.NodeIndex == this.HitNodes.length) {
                    this.NodeIndex = 0;
                }
            } else {
                this.NodeIndex--;
                if (this.NodeIndex == -1) {
                    this.NodeIndex = this.HitNodes.length - 1;
                }
            }

            this.MoveFlag = true;
            this.SetDestination(this.HitNodes[this.NodeIndex], CaseViewer);
            this.MoveToNext(CaseViewer, function () {
                CaseViewer.ViewMap[_this.HitNodes[_this.NodeIndex].Label].SVGShape.EnableHighlight();
                if (!ShiftKey) {
                    if (_this.NodeIndex == 0) {
                        CaseViewer.ViewMap[_this.HitNodes[_this.HitNodes.length - 1].Label].SVGShape.DisableHighlight();
                    } else {
                        CaseViewer.ViewMap[_this.HitNodes[_this.NodeIndex - 1].Label].SVGShape.DisableHighlight();
                    }
                } else {
                    if (_this.NodeIndex == _this.HitNodes.length - 1) {
                        CaseViewer.ViewMap[_this.HitNodes[0].Label].SVGShape.DisableHighlight();
                    } else {
                        CaseViewer.ViewMap[_this.HitNodes[_this.NodeIndex + 1].Label].SVGShape.DisableHighlight();
                    }
                }
                _this.MoveFlag = false;
            });
        }
    };

    Search.prototype.ResetParam = function () {
        this.HitNodes = [];
        this.NodeIndex = 0;
        this.SearchWord = "";
    };

    Search.prototype.CheckInput = function (CaseViewer) {
        if ($('.form-control').val() == this.SearchWord && this.HitNodes.length > 1) {
            return false;
        } else {
            this.SetAllNodesColor(this.HitNodes, CaseViewer, "Default");
            this.HitNodes = [];
            return true;
        }
    };

    Search.prototype.SetAllNodesColor = function (HitNodes, CaseViewer, colortheme) {
        switch (colortheme) {
            case "Default":
                for (var i = 0; i < HitNodes.length; i++) {
                    var thisNodeLabel = HitNodes[i].Label;
                    CaseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(AssureIt.Color.Default);
                    CaseViewer.ViewMap[thisNodeLabel].SVGShape.DisableHighlight();
                }
                break;
            case "Search":
                for (var i = 0; i < HitNodes.length; i++) {
                    var thisNodeLabel = this.HitNodes[i].Label;
                    CaseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(AssureIt.Color.Searched);
                }
                break;
        }
    };

    Search.prototype.SetDestination = function (HitNode, CaseViewer) {
        if (HitNode == undefined) {
            return;
        }
        var CaseMap = CaseViewer.ViewMap[HitNode.Label];
        var currentHTML = CaseMap.HTMLDoc;
        var screenManager = CaseViewer.Screen;
        var NodePosX = CaseMap.AbsX;
        var NodePosY = CaseMap.AbsY;
        this.DestinationX = screenManager.ConvertX(NodePosX, currentHTML);
        this.DestinationY = screenManager.ConvertY(NodePosY, currentHTML);
        return;
    };

    Search.prototype.MoveToNext = function (CaseViewer, callback) {
        this.Move(this.DestinationX, this.DestinationY, 100, CaseViewer);
        callback();
    };

    Search.prototype.Move = function (logicalOffsetX, logicalOffsetY, duration, CaseViewer) {
        var cycle = 1000 / 30;
        var cycles = duration / cycle;
        var screenManager = CaseViewer.Screen;
        var initialX = screenManager.GetOffsetX();
        var initialY = screenManager.GetOffsetY();

        var deltaX = (logicalOffsetX - initialX) / cycles;
        var deltaY = (logicalOffsetY - initialY) / cycles;

        var currentX = initialX;
        var currentY = initialY;
        var count = 0;

        var move = function () {
            if (count < cycles) {
                count += 1;
                currentX += deltaX;
                currentY += deltaY;
                screenManager.SetLogicalOffset(currentX, currentY, 1);
                setTimeout(move, cycle);
            } else {
                screenManager.SetLogicalOffset(logicalOffsetX, logicalOffsetY, 1);
                return;
            }
        };
        move();
    };

    Search.prototype.CreateSearchWindow = function () {
        $('<nav class="navbar pull-right" style="position: absolute"><form class="navbar-form" role="Search"><input type="text" class="form-control" placeholder="Search"/><input type="submit" value="search" class="btn" id="searchbtn"/></form></nav>').appendTo($('body'));

        $('nav').css({ display: 'none', width: '260px', margin: 0, height: '24px', top: '0', right: '0' });

        $('.navbar-form').css({ width: '230px', position: 'absolute' });

        $('.form-control').css({ width: '156px', position: 'absolute' });

        $('#searchbtn').css({ position: 'absolute', left: '176px' });
    };
    return Search;
})();
