var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var monitorNodeManager = null;

var MonitorPlugIn = (function (_super) {
    __extends(MonitorPlugIn, _super);
    function MonitorPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.HTMLRenderPlugIn = new MonitorHTMLRenderPlugIn(plugInManager);
        this.SVGRenderPlugIn = new MonitorSVGRenderPlugIn(plugInManager);

        this.SideMenuPlugIn = new MonitorSideMenuPlugIn(plugInManager);
        monitorNodeManager = new MonitorNodeManager();
        this.PlugInEnv = { "ActionNodeManager": monitorNodeManager };
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
        var proto = (nodeModel.Parent != null ? nodeModel.Parent.Environment : {});
        nodeModel.UpdateEnvironment(proto);
        if (!isMonitorNode(nodeModel))
            return;
        monitorNodeManager.SetMonitorNode(nodeModel);

        var monitorNode = monitorNodeManager.ActionNodeMap[nodeModel.Label];
        if (monitorNode == null || !("Item" in monitorNode))
            return;

        this.RenderPastMonitoringData(monitorNode, element);
    };

    MonitorHTMLRenderPlugIn.prototype.RenderPastMonitoringData = function (monitorNode, element) {
        element.children("#monitor-logs").remove();

        var $logs = $('<div id="monitor-logs"></div>');
        if (monitorNode.PastData.length < 1) {
            return true;
        }

        var linkColor;
        if (monitorNode.Status == true) {
            if (monitorNode.IsRecovered) {
                linkColor = 'orange';
            } else {
                linkColor = 'blue';
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
        var monitorNode = monitorNodeManager.ActionNodeMap[nodeModel.Label];

        if (!monitorNode)
            return true;

        if (monitorNode.Status) {
            if (monitorNode.IsRecovered) {
                var fill = "#FFFF99";
                var stroke = "none";
                monitorNode.BlushAllAncestor(caseViewer, nodeView, fill, stroke);
            }
        } else {
            var fill = "#FF9999";
            var stroke = "none";
            monitorNode.BlushAllAncestor(caseViewer, nodeView, fill, stroke);
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

        for (var key in monitorNodeManager.ActionNodeMap) {
            var monitorNode = monitorNodeManager.ActionNodeMap[key];

            if (!("Item" in monitorNode))
                continue;

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

var MonitorSideMenuPlugIn = (function (_super) {
    __extends(MonitorSideMenuPlugIn, _super);
    function MonitorSideMenuPlugIn(plugInManager) {
        _super.call(this, plugInManager);
    }
    MonitorSideMenuPlugIn.prototype.IsEnabled = function (caseViewer, Case0, serverApi) {
        return true;
    };

    MonitorSideMenuPlugIn.prototype.AddMenu = function (caseViewer, Case0, serverApi) {
        monitorNodeManager.Init(caseViewer, serverApi.recpath);

        return new AssureIt.SideMenuModel('#', 'Monitors', "monitors", "glyphicon-list-alt", function (ev) {
            var monitorTableWindow = new MonitorTableWindow();
            monitorTableWindow.UpdateTable();
            monitorTableWindow.Open();
        });
    };
    return MonitorSideMenuPlugIn;
})(AssureIt.SideMenuPlugIn);
