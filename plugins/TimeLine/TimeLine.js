var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TimeLine = (function () {
    function TimeLine(caseViewer, nodeModel, element, serverApi) {
        this.caseViewer = caseViewer;
        this.nodeModel = nodeModel;
        this.element = element;
        this.serverApi = serverApi;
    }
    TimeLine.prototype.CreateDOM = function () {
        this.root = $(this.caseViewer.Screen.ControlLayer);

        var node = $("#" + this.nodeModel.Label);

        this.container = $("<div></div>").css({
            position: "absolute",
            left: node.position().left + (node.width() / 2),
            top: node.position().top + node.height() + 53
        }).addClass("timeline-container").appendTo(this.root);
        this.timeline = $("<div></div>").addClass("timeline").appendTo(this.container);
    };

    TimeLine.prototype.Enable = function (callback) {
        var _this = this;
        this.CreateDOM();

        var commits = this.serverApi.GetCommitList(this.nodeModel.Case.CaseId);
        var Case = this.nodeModel.Case;
        var TopLabel = Case.ElementTop.Label;
        var decoder = new AssureIt.CaseDecoder();
        this.timeline.append($('<ul id="timeline-ul"></ul>'));
        commits.forEach(function (i, v) {
            $("#timeline-ul").append($('<a id="timeline' + i + '" href="#"></a>').text(v.toString()));
            $("#timeline" + i).click(function (e) {
                var loc = _this.serverApi.basepath + "case/" + _this.nodeModel.Case.CaseId;
                location.href = loc + '/history/' + (i);
            });
        });
    };

    TimeLine.prototype.Disable = function (callback) {
        $(".timeline-container").remove();
        callback();
    };
    return TimeLine;
})();

var TimeLinePlugIn = (function (_super) {
    __extends(TimeLinePlugIn, _super);
    function TimeLinePlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.MenuBarContentsPlugIn = new TimeLineMenuPlugIn(plugInManager);
    }
    return TimeLinePlugIn;
})(AssureIt.PlugInSet);

var TimeLineMenuPlugIn = (function (_super) {
    __extends(TimeLineMenuPlugIn, _super);
    function TimeLineMenuPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.visible = true;
    }
    TimeLineMenuPlugIn.prototype.IsEnabled = function (caseViewer, caseModel) {
        return true;
    };

    TimeLineMenuPlugIn.prototype.Delegate = function (caseViewer, caseModel, element, serverApi) {
        var loc = serverApi.basepath + "case/" + caseModel.Case.CaseId + "/history";
        element.append('<a href="' + loc + '" ><img id="timeline" src="' + serverApi.basepath + 'images/icon.png" title="TimeLine" alt="timeline" /></a>');

        return true;
    };
    return TimeLineMenuPlugIn;
})(AssureIt.MenuBarContentsPlugIn);
