var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var MenuBar = (function () {
    function MenuBar(caseViewer, model, case0, node, serverApi, plugIn) {
        this.plugIn = plugIn;
        this.caseViewer = caseViewer;
        this.model = model;
        this.case0 = case0;
        this.node = node;
        this.serverApi = serverApi;
        this.Init();
    }
    MenuBar.prototype.Init = function () {
        var thisNodeType = this.model.Type;

        $('#menu').remove();
        this.menu = $('<div id="menu">' + '</div>');

        if (this.case0.IsEditable()) {
            var hasContext = false;

            for (var i = 0; i < this.model.Children.length; i++) {
                if (this.model.Children[i].Type == AssureIt.NodeType.Context) {
                    hasContext = true;
                }
            }
            switch (thisNodeType) {
                case AssureIt.NodeType.Goal:
                    if (!hasContext) {
                        this.menu.append('<a href="#" ><img id="context"  src="' + this.serverApi.basepath + 'images/context.png" title="Context" alt="context" /></a>');
                    }
                    this.menu.append('<a href="#" ><img id="strategy" src="' + this.serverApi.basepath + 'images/strategy.png" title="Strategy" alt="strategy" /></a>');
                    this.menu.append('<a href="#" ><img id="evidence" src="' + this.serverApi.basepath + 'images/evidence.png" title="Evidence" alt="evidence" /></a>');
                    break;
                case AssureIt.NodeType.Strategy:
                    this.menu.append('<a href="#" ><img id="goal"     src="' + this.serverApi.basepath + 'images/goal.png" title="Goal" alt="goal" /></a>');
                    if (!hasContext) {
                        this.menu.append('<a href="#" ><img id="context"  src="' + this.serverApi.basepath + 'images/context.png" title="Context" alt="context" /></a>');
                    }
                    break;
                case AssureIt.NodeType.Evidence:
                    if (!hasContext) {
                        this.menu.append('<a href="#" ><img id="context"  src="' + this.serverApi.basepath + 'images/context.png" title="Context" alt="context" /></a>');
                    }
                    break;
                default:
                    break;
            }
            if (this.node.children("h4").text() != this.case0.ElementTop.Label) {
                this.menu.append('<a href="#" ><img id="remove" src="' + this.serverApi.basepath + 'images/remove.png" title="Remove" alt="remove" /></a>');
            }
        }
    };

    MenuBar.prototype.AddNode = function (nodeType) {
        var thisNodeView = this.caseViewer.ViewMap[this.node.children("h4").text()];
        var newNodeModel = new AssureIt.NodeModel(this.case0, thisNodeView.Source, nodeType, null, null, {});
        this.case0.SaveIdCounterMax(this.case0.ElementTop);
        this.caseViewer.ViewMap[newNodeModel.Label] = new AssureIt.NodeView(this.caseViewer, newNodeModel);
        this.caseViewer.ViewMap[newNodeModel.Label].ParentShape = this.caseViewer.ViewMap[newNodeModel.Parent.Label];

        var parentLabel = newNodeModel.Parent.Label;
        var parentOffSet = $("#" + parentLabel).offset();
        this.caseViewer.Draw();

        var CurrentParentView = this.caseViewer.ViewMap[parentLabel];
        this.caseViewer.Screen.SetOffset(parentOffSet.left - CurrentParentView.AbsX, parentOffSet.top - CurrentParentView.AbsY);
    };

    MenuBar.prototype.GetDescendantLabels = function (labels, children) {
        for (var i = 0; i < children.length; i++) {
            labels.push(children[i].Label);
            this.GetDescendantLabels(labels, children[i].Children);
        }
        return labels;
    };

    MenuBar.prototype.RemoveNode = function () {
        var thisLabel = this.node.children("h4").text();
        var thisNodeView = this.caseViewer.ViewMap[thisLabel];
        var thisNodeModel = thisNodeView.Source;
        var brotherNodeModels = thisNodeModel.Parent.Children;
        var parentLabel = thisNodeModel.Parent.Label;
        var parentOffSet = $("#" + parentLabel).offset();

        for (var i = 0; i < brotherNodeModels.length; i++) {
            if (brotherNodeModels[i].Label == thisLabel) {
                brotherNodeModels.splice(i, 1);
            }
        }

        var labels = [thisLabel];
        labels = this.GetDescendantLabels(labels, thisNodeModel.Children);

        for (var i = 0; i < labels.length; i++) {
            delete this.case0.ElementMap[labels[i]];
            var nodeView = this.caseViewer.ViewMap[labels[i]];
            nodeView.DeleteHTMLElementRecursive(null, null);
            delete this.caseViewer.ViewMap[labels[i]];
        }

        this.caseViewer.Draw();
        var CurrentParentView = this.caseViewer.ViewMap[parentLabel];
        this.caseViewer.Screen.SetOffset(parentOffSet.left - CurrentParentView.AbsX, parentOffSet.top - CurrentParentView.AbsY);
    };

    MenuBar.prototype.Center = function () {
        var thisLabel = this.node.children("h4").text();
        var thisNodeView = this.caseViewer.ViewMap[thisLabel];
        var screenManager = this.caseViewer.Screen;
        screenManager.SetCaseCenter(thisNodeView.AbsX, thisNodeView.AbsY, thisNodeView.HTMLDoc);
    };

    MenuBar.prototype.SetEventHandlers = function () {
        var _this = this;
        $('#goal').click(function () {
            _this.AddNode(AssureIt.NodeType.Goal);
        });

        $('#context').click(function () {
            _this.AddNode(AssureIt.NodeType.Context);
        });

        $('#strategy').click(function () {
            _this.AddNode(AssureIt.NodeType.Strategy);
        });

        $('#evidence').click(function () {
            _this.AddNode(AssureIt.NodeType.Evidence);
        });

        $('#remove').click(function () {
            _this.RemoveNode();
            $('#menu').remove();
        });
    };
    return MenuBar;
})();

var MenuBarPlugIn = (function (_super) {
    __extends(MenuBarPlugIn, _super);
    function MenuBarPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.ActionPlugIn = new MenuBarActionPlugIn(plugInManager);
    }
    return MenuBarPlugIn;
})(AssureIt.PlugInSet);

var MenuBarActionPlugIn = (function (_super) {
    __extends(MenuBarActionPlugIn, _super);
    function MenuBarActionPlugIn(plugInManager) {
        _super.call(this, plugInManager);
    }
    MenuBarActionPlugIn.prototype.IsEnabled = function (caseViewer, case0) {
        return true;
    };

    MenuBarActionPlugIn.prototype.Delegate = function (caseViewer, case0, serverApi) {
        var self = this;

        $('.node').unbind('mouseenter').unbind('mouseleave');
        var appendMenu = function () {
            var node = $(this);
            if (caseViewer.Screen.GetScale() < 1)
                return;
            var refresh = function () {
                var menutop = node.position().top / caseViewer.Screen.GetScale() + node.height() + 5;
                var menuleft = node.position().left / caseViewer.Screen.GetScale() + (node.outerWidth() - menuBar.menu.width()) / 2;
                menuBar.menu.css({ position: 'absolute', top: menutop, display: 'block', opacity: 0 });
                menuBar.menu.css({ left: menuleft });
            };

            var label = node.children('h4').text();

            var model = case0.ElementMap[label];
            var menuBar = new MenuBar(caseViewer, model, case0, node, serverApi, self);
            menuBar.menu.appendTo($('#layer2'));
            refresh();
            menuBar.menu.hover(function () {
                clearTimeout(self.timeoutId);
            }, function () {
                $(menuBar.menu).remove();
            });
            self.plugInManager.UseUILayer(self);
            menuBar.SetEventHandlers();

            self.plugInManager.InvokePlugInMenuBarContents(caseViewer, model, menuBar.menu, serverApi);

            (menuBar.menu).jqDock({
                align: 'bottom',
                fadeIn: 200,
                idle: 1500,
                size: 45,
                distance: 60,
                labels: 'tc',
                duration: 500,
                fadeIn: 1000,
                source: function () {
                    return this.src.replace(/(jpg|gif)$/, 'png');
                },
                onReady: refresh
            });
            menuBar.menu.click(refresh);
        };
        var removeMenu = function () {
            self.timeoutId = setTimeout(function () {
                $('#menu').remove();
            }, 10);
        };
        $('.node').hover(appendMenu, removeMenu);
        $('.node').bind({ 'touchstart': removeMenu, 'touchend': appendMenu });
        return true;
    };

    MenuBarActionPlugIn.prototype.DeleteFromDOM = function () {
        $('#menu').remove();
    };
    return MenuBarActionPlugIn;
})(AssureIt.ActionPlugIn);
