var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TimeLinePlugIn = (function (_super) {
    __extends(TimeLinePlugIn, _super);
    function TimeLinePlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.SideMenuPlugIn = new TimeLineSideMenuPlugIn(plugInManager);
        this.ShortcutKeyPlugIn = new TimeLineKeyPlugIn(plugInManager);
    }
    return TimeLinePlugIn;
})(AssureIt.PlugInSet);

var TimeLineSideMenuPlugIn = (function (_super) {
    __extends(TimeLineSideMenuPlugIn, _super);
    function TimeLineSideMenuPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.visible = true;
    }
    TimeLineSideMenuPlugIn.prototype.IsEnabled = function (caseViewer, Case0, serverApi) {
        return true;
    };

    TimeLineSideMenuPlugIn.prototype.AddMenu = function (caseViewer, Case0, serverApi) {
        var loc = serverApi.basepath + "case/" + Case0.CaseId + "/history";
        return new AssureIt.SideMenuModel(loc, "Change History", "history", "glyphicon-time", function (ev) {
        });
    };
    return TimeLineSideMenuPlugIn;
})(AssureIt.SideMenuPlugIn);
var TimeLineKeyPlugIn = (function (_super) {
    __extends(TimeLineKeyPlugIn, _super);
    function TimeLineKeyPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
    }
    TimeLineKeyPlugIn.prototype.IsEnabled = function (Case0, serverApi) {
        return true;
    };

    TimeLineKeyPlugIn.prototype.RegisterKeyEvents = function (caseViewer, Case0, serverApi) {
        return true;
    };

    TimeLineKeyPlugIn.prototype.GetHistoryId = function () {
        var url = location.href;
        var matches = url.match(/history\/([0-9]*)/);
        if (matches != null) {
            return Number(matches[1]);
        }
        return -1;
    };

    TimeLineKeyPlugIn.prototype.ShowPreview = function (Case, serverApi) {
        var historyId = this.GetHistoryId();
        if (historyId == -1) {
            var commits = serverApi.GetCommitList(Case.CaseId);
            historyId = commits.Size();
        }
        if (historyId > 0) {
            historyId--;
            var loc = serverApi.basepath + "case/" + Case.CaseId;
            location.href = loc + '/history/' + (historyId);
        }
    };

    TimeLineKeyPlugIn.prototype.ShowNext = function (Case, serverApi) {
        var historyId = this.GetHistoryId();
        if (historyId == -1) {
            return;
        }
        var commits = serverApi.GetCommitList(Case.CaseId);
        var max = commits.Size() - 1;
        if (historyId >= 0 && historyId < max) {
            historyId++;
            var loc = serverApi.basepath + "case/" + Case.CaseId;
            location.href = loc + '/history/' + (historyId);
        } else if (historyId == max) {
            location.href = serverApi.basepath + "case/" + Case.CaseId;
        }
    };

    TimeLineKeyPlugIn.prototype.DeleteFromDOM = function () {
    };

    TimeLineKeyPlugIn.prototype.DisableEvent = function (caseViewer, case0, serverApi) {
    };
    return TimeLineKeyPlugIn;
})(AssureIt.ShortcutKeyPlugIn);
