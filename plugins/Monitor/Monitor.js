var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var monitorManager = null;

function extractTypeFromCondition(condition) {
    var text = condition.replace(/\{/g, " ").replace(/\}/g, " ").replace(/\(/g, " ").replace(/\)/g, " ").replace(/==/g, " ").replace(/<=/g, " ").replace(/>=/g, " ").replace(/</g, " ").replace(/>/g, " ");

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

    var contextNode = getContextNode(nodeModel.Parent);
    if (contextNode == null)
        return false;
    if (!("Monitor" in contextNode.Notes))
        return false;
    if (!("Location" in contextNode.Notes))
        return false;

    return true;
}

function appendNode(caseViewer, nodeModel, type) {
    var viewMap = caseViewer.ViewMap;
    var view = viewMap[nodeModel.Label];
    var case0 = caseViewer.Source;
    var newNodeModel = new AssureIt.NodeModel(case0, nodeModel, type, null, null, {});
    case0.SaveIdCounterMax(case0.ElementTop);
    viewMap[newNodeModel.Label] = new AssureIt.NodeView(caseViewer, newNodeModel);
    viewMap[newNodeModel.Label].ParentShape = viewMap[nodeModel.Label];
    return newNodeModel;
}

function showNode(caseViewer, nodeModel, HTMLRenderFunctions, SVGRenderFunctions) {
    var element = caseViewer.ViewMap[nodeModel.Label].HTMLDoc.DocBase;
    var view = caseViewer.ViewMap[nodeModel.Label];
    for (var i = 0; i < HTMLRenderFunctions.length; i++) {
        HTMLRenderFunctions[i](caseViewer, nodeModel, element);
    }
    for (var i = 0; i < SVGRenderFunctions.length; i++) {
        SVGRenderFunctions[i](caseViewer, view);
    }
}

function selectStrongColor(color1, color2) {
    if (parseInt(color1.replace(/#/g, ""), 16) < parseInt(color2.replace(/#/g, ""), 16)) {
        return color1;
    } else {
        return color2;
    }
}

function blushAllAncestor(caseViewer, nodeView, fill, stroke) {
    if (nodeView == null)
        return;

    nodeView.SetTemporaryColor(fill, stroke);

    if (nodeView.ParentShape != null) {
        var brotherModels = nodeView.ParentShape.Source.Children;

        for (var i = 0; i < brotherModels.length; i++) {
            var view = caseViewer.ViewMap[brotherModels[i].Label];

            if (view.GetTemporaryColor() != null) {
                var tmpFill = view.GetTemporaryColor()["fill"];
                fill = selectStrongColor(fill, tmpFill);
            }
        }
    }

    blushAllAncestor(caseViewer, nodeView.ParentShape, fill, stroke);
}

var MonitorNode = (function () {
    function MonitorNode(Location, Type, Condition, EvidenceNode) {
        this.Location = Location;
        this.Type = Type;
        this.Condition = Condition;
        this.LatestData = null;
        this.TurningPointData = null;
        this.PastData = [];
        this.Status = true;
        this.EvidenceNode = EvidenceNode;
        this.IsActive = false;
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

    MonitorNode.prototype.UpdatePastData = function (latestData) {
        if (this.PastData.length < 10) {
            this.PastData.unshift(latestData);
        } else {
            this.PastData.pop();
            this.PastData.unshift(latestData);
        }
    };

    MonitorNode.prototype.UpdateLatestData = function (RECAPI) {
        var latestData = RECAPI.getLatestData(this.Location, this.Type);

        if (latestData == null) {
            console.log("latest data is null");
        } else {
            if (JSON.stringify(this.LatestData) != JSON.stringify(latestData)) {
                this.LatestData = latestData;
                this.UpdatePastData(latestData);
            }
        }
    };

    MonitorNode.prototype.UpdateStatus = function () {
        var status;
        var script = "var " + this.Type + "=" + this.LatestData.data + ";";

        script += this.Condition + ";";
        status = eval(script);

        if (!status && !this.TurningPointData) {
            this.TurningPointData = this.LatestData;
        }

        this.Status = status;
    };

    MonitorNode.prototype.Show = function (caseViewer, HTMLRenderFunctions, SVGRenderFunctions) {
        var data = "{ " + this.LatestData.type + " = " + this.LatestData.data + " }";
        this.EvidenceNode.Notes["LatestData"] = data;
        showNode(caseViewer, this.EvidenceNode, HTMLRenderFunctions, SVGRenderFunctions);
    };
    return MonitorNode;
})();

var MonitorManager = (function () {
    function MonitorManager() {
        this.MonitorNodeMap = {};
    }
    MonitorManager.prototype.Init = function (caseViewer, recpath) {
        this.RECAPI = new AssureIt.RECAPI(recpath);
        this.CaseViewer = caseViewer;
        this.HTMLRenderFunctions = [];
        this.HTMLRenderFunctions.push(this.CaseViewer.GetPlugInHTMLRender("note"));
        this.HTMLRenderFunctions.push(this.CaseViewer.GetPlugInHTMLRender("monitor"));
        this.SVGRenderFunctions = [];
        this.SVGRenderFunctions.push(this.CaseViewer.GetPlugInSVGRender("monitor"));
        this.ActiveMonitors = 0;
    };

    MonitorManager.prototype.StartMonitors = function (interval) {
        console.log("start monitoring");
        var self = this;

        this.Timer = setInterval(function () {
            for (var key in self.MonitorNodeMap) {
                var monitorNode = self.MonitorNodeMap[key];

                if (self.CaseViewer.Source.ElementMap[key] == null) {
                    self.RemoveMonitor(key);
                    continue;
                }

                if (monitorNode == null) {
                    console.log("monitor:'" + key + "' is not registered");
                }

                if (!monitorNode.IsActive) {
                    continue;
                }

                try  {
                    monitorNode.UpdateLatestData(self.RECAPI);
                } catch (e) {
                    self.DeactivateAllMonitor();
                    return;
                }

                if (monitorNode.LatestData == null)
                    continue;

                monitorNode.UpdateStatus();
                monitorNode.Show(self.CaseViewer, self.HTMLRenderFunctions, self.SVGRenderFunctions);
            }

            self.CaseViewer.Draw();
        }, interval);
    };

    MonitorManager.prototype.StopMonitors = function () {
        console.log("stop monitoring");
        clearTimeout(this.Timer);
    };

    MonitorManager.prototype.SetMonitor = function (evidenceNode) {
        var location = getContextNode(evidenceNode.Parent).Notes["Location"];
        var condition = getContextNode(evidenceNode.Parent).Notes["Monitor"];
        var type = extractTypeFromCondition(condition);
        var monitorNode = this.MonitorNodeMap[evidenceNode.Label];

        if (monitorNode == null) {
            this.MonitorNodeMap[evidenceNode.Label] = new MonitorNode(location, type, condition, evidenceNode);
        } else {
            monitorNode.SetLocation(location);
            monitorNode.SetType(type);
            monitorNode.SetCondition(condition);
        }
    };

    MonitorManager.prototype.RemoveMonitor = function (label) {
        if (this.MonitorNodeMap[label].IsActive) {
            this.ActiveMonitors -= 1;

            if (this.ActiveMonitors == 0) {
                this.StopMonitors();
            }
        }

        delete this.MonitorNodeMap[label];
        if (Object.keys(this.MonitorNodeMap).length == 0) {
            this.StopMonitors();
        }
    };

    MonitorManager.prototype.ActivateMonitor = function (label) {
        var monitorNode = this.MonitorNodeMap[label];

        if (!monitorNode.IsActive) {
            monitorNode.IsActive = true;
            this.ActiveMonitors += 1;
            if (this.ActiveMonitors == 1) {
                this.StartMonitors(5000);
            }
        }
    };

    MonitorManager.prototype.DeactivateMonitor = function (label) {
        var monitorNode = this.MonitorNodeMap[label];

        if (monitorNode.IsActive) {
            monitorNode.IsActive = false;
            this.ActiveMonitors -= 1;
            if (this.ActiveMonitors == 0) {
                this.StopMonitors();
            }
        }
    };

    MonitorManager.prototype.DeactivateAllMonitor = function () {
        for (var label in this.MonitorNodeMap) {
            this.RemoveMonitor(label);
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
        this.HTMLRenderPlugIn = new MonitorHTMLRenderPlugIn(plugInManager);
        this.SVGRenderPlugIn = new MonitorSVGRenderPlugIn(plugInManager);
        this.MenuBarContentsPlugIn = new MonitorMenuBarPlugIn(plugInManager);
        this.SideMenuPlugIn = new MonitorSideMenuPlugIn(plugInManager);
        monitorManager = new MonitorManager();
        this.PlugInEnv = { "MonitorManager": monitorManager };
    }
    return MonitorPlugIn;
})(AssureIt.PlugInSet);

var MonitorHTMLRenderPlugIn = (function (_super) {
    __extends(MonitorHTMLRenderPlugIn, _super);
    function MonitorHTMLRenderPlugIn() {
        _super.apply(this, arguments);
    }
    MonitorHTMLRenderPlugIn.prototype.IsEnabled = function (caseViewer, nodeModel) {
        return true;
    };

    MonitorHTMLRenderPlugIn.prototype.Delegate = function (caseViewer, nodeModel, element) {
        if (!isMonitorNode(nodeModel))
            return;
        if (!monitorManager.IsRegisteredMonitor(nodeModel.Label)) {
            monitorManager.SetMonitor(nodeModel);
        }

        element.children("#monitor-logs").remove();

        var monitorNode = monitorManager.MonitorNodeMap[nodeModel.Label];
        if (monitorNode == null)
            return;

        var $logs = $('<div id="monitor-logs"></div>');
        if (monitorNode.PastData.length < 1) {
            return true;
        }

        var linkColor;
        if (monitorNode.Status == true) {
            if (monitorNode.TurningPointData == null) {
                linkColor = 'blue';
            } else {
                linkColor = 'orange';
            }
        } else {
            linkColor = 'red';
        }

        var $link = $('<a href="#"><p align="right" style="color: ' + linkColor + '">past data</p></a>');
        $link.click(function (ev) {
            ev.stopPropagation();
            if (monitorNode.PastData.length < 1) {
                return;
            }

            var childWindow = window.open();
            for (var i = 0; i < monitorNode.PastData.length; i++) {
                var log = JSON.stringify(monitorNode.PastData[i]);
                $(childWindow.document.body).append($('<p>' + log + '</p>'));
            }
        });

        $link.appendTo($logs);
        $logs.appendTo(element);
    };
    return MonitorHTMLRenderPlugIn;
})(AssureIt.HTMLRenderPlugIn);

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
        var monitorNode = monitorManager.MonitorNodeMap[nodeModel.Label];

        if (!monitorNode)
            return true;

        if (monitorNode.Status) {
            if (monitorNode.TurningPointData) {
                var fill = "#FFFF99";
                var stroke = "none";
                blushAllAncestor(caseViewer, nodeView, fill, stroke);
            }
        } else {
            var fill = "#FF9999";
            var stroke = "none";
            blushAllAncestor(caseViewer, nodeView, fill, stroke);
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
        if (!monitorManager.IsRegisteredMonitor(caseModel.Label)) {
            return true;
        }

        var monitorNode = monitorManager.MonitorNodeMap[caseModel.Label];

        if (!monitorNode.IsActive) {
            element.append('<a href="#" ><img id="monitor-tgl" src="' + serverApi.basepath + 'images/monitor.png" title="Activate monitor" alt="monitor-tgl" /></a>');
        } else {
            element.append('<a href="#" ><img id="monitor-tgl" src="' + serverApi.basepath + 'images/monitor.png" title="Deactivate monitor" alt="monitor-tgl" /></a>');
        }

        $('#monitor-tgl').unbind('click');
        $('#monitor-tgl').click(function () {
            if (!monitorNode.IsActive) {
                monitorManager.ActivateMonitor(caseModel.Label);
            } else {
                monitorManager.DeactivateMonitor(caseModel.Label);
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
        monitorManager.Init(caseViewer, serverApi.recpath);

        return new AssureIt.SideMenuModel('#', 'Monitors', "monitors", "glyphicon-list-alt", function (ev) {
            var monitorTableWindow = new MonitorTableWindow();
            monitorTableWindow.UpdateTable();
            monitorTableWindow.Open();
        });
    };
    return MonitorSideMenuPlugIn;
})(AssureIt.SideMenuPlugIn);
