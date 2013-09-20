var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var monitorManager = null;

function extractTypeFromCondition(condition) {
    var text = condition.replace(/\{/g, " ").replace(/\}/g, " ").replace(/\(/g, " ").replace(/\)/g, " ").replace(/<=/g, " ").replace(/>=/g, " ").replace(/</g, " ").replace(/>/g, " ");

    var words = text.split(" ");
    var types = [];

    for (var i = 0; i < words.length; i++) {
        if (words[i] != "" && !$.isNumeric(words[i])) {
            types.push(words[i]);
        }
    }

    if (types.length != 1) {
    }

    return types[0];
}

function isContextNode(nodeModel) {
    if (nodeModel.Type == AssureIt.NodeType.Context) {
        return true;
    }

    return false;
}

function getContextNode(nodeModel) {
    for (var i = 0; i < nodeModel.Children.length; i++) {
        if (isContextNode(nodeModel.Children[i]))
            return nodeModel.Children[i];
    }

    return null;
}

function isMonitorNode(nodeModel) {
    if (nodeModel.Type != AssureIt.NodeType.Evidence)
        return false;
    if (!("Monitor" in nodeModel.Notes))
        return false;

    var contextNode = getContextNode(nodeModel.Parent);
    if (contextNode == null)
        return false;
    if (!("Location" in contextNode.Notes))
        return false;

    return true;
}

function appendNode(caseViewer, nodeModel, type) {
    var viewMap = caseViewer.ViewMap;
    var view = viewMap[nodeModel.Label];
    var case0 = caseViewer.Source;
    var newNodeModel = new AssureIt.NodeModel(case0, nodeModel, type, null, null);
    case0.SaveIdCounterMax(case0.ElementTop);
    viewMap[newNodeModel.Label] = new AssureIt.NodeView(caseViewer, newNodeModel);
    viewMap[newNodeModel.Label].ParentShape = viewMap[nodeModel.Label];
    return newNodeModel;
}

function showNode(caseViewer, nodeModel, HTMLRenderFunction, SVGRenderFunction) {
    var element = caseViewer.ViewMap[nodeModel.Label].HTMLDoc.DocBase;
    var view = caseViewer.ViewMap[nodeModel.Label];
    HTMLRenderFunction(caseViewer, nodeModel, element);
    SVGRenderFunction(caseViewer, view);
}

function blushAllAncestor(caseViewer, nodeModel, fill, stroke) {
    if (nodeModel == null)
        return;

    caseViewer.ViewMap[nodeModel.Label].SVGShape.SetColor(fill, stroke);

    var contextNode = getContextNode(nodeModel);

    if (contextNode != null) {
        caseViewer.ViewMap[contextNode.Label].SVGShape.SetColor(fill, stroke);
    }
}

var MonitorNode = (function () {
    function MonitorNode(Location, Type, Condition, EvidenceNode) {
        this.Location = Location;
        this.Type = Type;
        this.Condition = Condition;
        this.LatestData = null;
        this.Status = true;
        this.EvidenceNode = EvidenceNode;
    }
    MonitorNode.prototype.SetLocation = function (location) {
        this.Location = location;
    };

    MonitorNode.prototype.SetType = function (type) {
        this.Type = type;
    };

    MonitorNode.prototype.SetCondition = function (condition) {
        this.Condition = condition;
    };

    MonitorNode.prototype.UpdateLatestData = function (RECAPI) {
        if (this.Status == true) {
            var latestData = RECAPI.getLatestData(this.Location, this.Type);

            if (latestData == null) {
                console.log("latest data is null");
            } else {
                this.LatestData = latestData;
            }
        }
    };

    MonitorNode.prototype.UpdateStatus = function () {
        if (this.Status = true) {
            var script = "var " + this.Type + "=" + this.LatestData.data + ";";
            script += this.Condition + ";";
            this.Status = eval(script);
        }
    };

    MonitorNode.prototype.Show = function (caseViewer, HTMLRenderFunction, SVGRenderFunction) {
        var contextNode = getContextNode(this.EvidenceNode);

        if (contextNode == null) {
            contextNode = appendNode(caseViewer, this.EvidenceNode, AssureIt.NodeType.Context);
        }

        if (this.Status == true) {
            contextNode.Notes["Status"] = "Success";
            contextNode.Notes[this.Type] = this.LatestData.data;
            contextNode.Notes["Timestamp"] = this.LatestData.timestamp;
        } else {
            contextNode.Notes["Status"] = "Fail";
            contextNode.Notes[this.Type] = this.LatestData.data;
            contextNode.Notes["Timestamp"] = this.LatestData.timestamp;
            contextNode.Notes["Manager"] = this.LatestData.authid;
        }

        showNode(caseViewer, contextNode, HTMLRenderFunction, SVGRenderFunction);
    };
    return MonitorNode;
})();

var MonitorManager = (function () {
    function MonitorManager(caseViewer) {
        this.RECAPI = new AssureIt.RECAPI("http://54.250.206.119/rec");
        this.MonitorNodeMap = {};
        this.CaseViewer = caseViewer;
        this.HTMLRenderFunction = this.CaseViewer.GetPlugInHTMLRender("note");
        this.SVGRenderFunction = this.CaseViewer.GetPlugInSVGRender("monitor");
    }
    MonitorManager.prototype.StartMonitors = function (interval) {
        var self = this;

        this.Timer = setInterval(function () {
            for (var key in self.MonitorNodeMap) {
                var monitorNode = self.MonitorNodeMap[key];

                if (self.CaseViewer.Source.ElementMap[monitorNode.EvidenceNode.Label] == null) {
                    delete self.MonitorNodeMap[key];
                    continue;
                }

                if (monitorNode == null) {
                    console.log("monitor:'" + key + "' is not registered");
                }

                monitorNode.UpdateLatestData(self.RECAPI);
                if (monitorNode.LatestData == null)
                    continue;

                monitorNode.UpdateStatus();
                monitorNode.Show(self.CaseViewer, self.HTMLRenderFunction, self.SVGRenderFunction);
            }

            self.CaseViewer.Draw();
        }, interval);
    };

    MonitorManager.prototype.StopMonitors = function () {
        clearTimeout(this.Timer);
    };

    MonitorManager.prototype.SetMonitor = function (evidenceNode) {
        var location = getContextNode(evidenceNode.Parent).Notes["Location"];
        var condition = evidenceNode.Notes["Monitor"];
        var type = extractTypeFromCondition(condition);
        var monitorNode = this.MonitorNodeMap[evidenceNode.Label];

        if (monitorNode == null) {
            this.MonitorNodeMap[evidenceNode.Label] = new MonitorNode(location, type, condition, evidenceNode);
        } else {
            monitorNode.SetLocation(location);
            monitorNode.SetType(type);
            monitorNode.SetCondition(condition);
        }

        if (Object.keys(this.MonitorNodeMap).length == 1) {
            this.StartMonitors(5000);
        }
    };

    MonitorManager.prototype.RemoveMonitor = function (label) {
        delete this.MonitorNodeMap[label];
        if (Object.keys(this.MonitorNodeMap).length == 0) {
            this.StopMonitors();
        }
    };

    MonitorManager.prototype.IsRegisteredMonitor = function (label) {
        if (label in this.MonitorNodeMap) {
            return true;
        }
        return false;
    };
    return MonitorManager;
})();

var MonitorPlugIn = (function (_super) {
    __extends(MonitorPlugIn, _super);
    function MonitorPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.SVGRenderPlugIn = new MonitorSVGRenderPlugIn(plugInManager);
        this.MenuBarContentsPlugIn = new MonitorMenuBarPlugIn(plugInManager);
        this.SideMenuPlugIn = new MonitorSideMenuPlugIn(plugInManager);
    }
    return MonitorPlugIn;
})(AssureIt.PlugInSet);

var MonitorSVGRenderPlugIn = (function (_super) {
    __extends(MonitorSVGRenderPlugIn, _super);
    function MonitorSVGRenderPlugIn() {
        _super.apply(this, arguments);
    }
    MonitorSVGRenderPlugIn.prototype.IsEnabled = function (caseViewer, nodeView) {
        return true;
    };

    MonitorSVGRenderPlugIn.prototype.Delegate = function (caseViewer, nodeView) {
        var nodeModel = nodeView.Source;

        if (isMonitorNode(nodeModel)) {
            var contextNode = getContextNode(nodeModel);

            if (contextNode != null && contextNode.Notes["Status"] == "Fail") {
                var fill = "#FF9999";
                var stroke = "none";

                blushAllAncestor(caseViewer, nodeModel, fill, stroke);
            }
        }

        return true;
    };
    return MonitorSVGRenderPlugIn;
})(AssureIt.SVGRenderPlugIn);

var MonitorTableWindow = (function () {
    function MonitorTableWindow() {
        this.InitTable();
    }
    MonitorTableWindow.prototype.InitTable = function () {
        $('#modal-monitors').remove();
        var $modal = $('<div id="modal-monitors" title="Monitors" />');

        ($modal).dialog({
            autoOpen: false,
            modal: true,
            resizable: false,
            draggable: false,
            show: "clip",
            hide: "fade",
            width: 800,
            height: 500
        });

        var $table = $('<table id="monitor-table" bgcolor="#999999">' + '<thead>' + '<tr>' + '<th>Monitor Node</th>' + '<th>Type</th>' + '<th>Location</th>' + '<th>Latest Data</th>' + '<th>Auth ID</th>' + '<th>Timestamp</th>' + '<th>Status</th>' + '</tr>' + '</thead>' + '<tbody>' + '</tbody>' + '</table>');
        $modal.append($table);
        $modal.appendTo('layer2');
    };

    MonitorTableWindow.prototype.UpdateTable = function () {
        var $table = $('#monitor-table');
        $table.find('tbody').remove();
        var $tbody = $('<tbody></tbody>');

        for (var key in monitorManager.MonitorNodeMap) {
            var monitorNode = monitorManager.MonitorNodeMap[key];

            if (monitorNode.LatestData != null) {
                var $tr = $('<tr></tr>');
                $tr.append('<td>' + key + '</td>');
                $tr.append('<td>' + monitorNode.LatestData['type'] + '</td>');
                $tr.append('<td>' + monitorNode.LatestData['location'] + '</td>');
                $tr.append('<td>' + monitorNode.LatestData['data'] + '</td>');
                $tr.append('<td>' + monitorNode.LatestData['authid'] + '</td>');
                $tr.append('<td>' + monitorNode.LatestData['timestamp'] + '</td>');
                if (monitorNode.Status) {
                    $tr.append('<td>Success</td>');
                } else {
                    $tr.append('<td>Fail</td>');
                    $tr.attr('class', 'monitor-table-fail');
                }
                $tr.appendTo($tbody);
            }
        }

        $tbody.appendTo($table);
        $table.appendTo('#modal-monitors');

        ($('#monitor-table')).dataTable({
            "bPaginate": true,
            "bLengthChange": true,
            "bFilter": true,
            "bSort": true,
            "bInfo": true,
            "bAutoWidth": true
        });
    };

    MonitorTableWindow.prototype.Open = function () {
        ($('#modal-monitors')).dialog('open');
    };
    return MonitorTableWindow;
})();

var MonitorMenuBarPlugIn = (function (_super) {
    __extends(MonitorMenuBarPlugIn, _super);
    function MonitorMenuBarPlugIn(plugInManager) {
        _super.call(this, plugInManager);
    }
    MonitorMenuBarPlugIn.prototype.IsEnabled = function (caseViewer, caseModel) {
        return true;
    };

    MonitorMenuBarPlugIn.prototype.Delegate = function (caseViewer, caseModel, element, serverApi) {
        if (monitorManager == null) {
            monitorManager = new MonitorManager(caseViewer);
        }

        if (!isMonitorNode(caseModel)) {
            return true;
        }

        var self = this;

        if (!monitorManager.IsRegisteredMonitor(caseModel.Label)) {
            element.append('<a href="#" ><img id="monitor-tgl" src="' + serverApi.basepath + 'images/monitor.png" title="Set monitor" alt="monitor-tgl" /></a>');
        } else {
            element.append('<a href="#" ><img id="monitor-tgl" src="' + serverApi.basepath + 'images/monitor.png" title="Remove monitor" alt="monitor-tgl" /></a>');
        }

        $('#monitor-tgl').unbind('click');
        $('#monitor-tgl').click(function () {
            if (!monitorManager.IsRegisteredMonitor(caseModel.Label)) {
                monitorManager.SetMonitor(caseModel);
            } else {
                monitorManager.RemoveMonitor(caseModel.Label);
            }
        });

        return true;
    };
    return MonitorMenuBarPlugIn;
})(AssureIt.MenuBarContentsPlugIn);

var MonitorSideMenuPlugIn = (function (_super) {
    __extends(MonitorSideMenuPlugIn, _super);
    function MonitorSideMenuPlugIn(plugInManager) {
        _super.call(this, plugInManager);
    }
    MonitorSideMenuPlugIn.prototype.IsEnabled = function (caseViewer, Case0, serverApi) {
        return true;
    };

    MonitorSideMenuPlugIn.prototype.AddMenu = function (caseViewer, Case0, serverApi) {
        if (monitorManager == null) {
            monitorManager = new MonitorManager(caseViewer);
        }

        return new AssureIt.SideMenuModel('#', 'Monitors', "monitors", "glyphicon-list-alt", function (ev) {
            var monitorTableWindow = new MonitorTableWindow();
            monitorTableWindow.UpdateTable();
            monitorTableWindow.Open();
        });
    };
    return MonitorSideMenuPlugIn;
})(AssureIt.SideMenuPlugIn);
