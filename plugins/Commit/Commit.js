var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var CommitWindow = (function () {
    function CommitWindow() {
        this.defaultMessage = "Type your commit message...";
        this.Init();
    }
    CommitWindow.prototype.Init = function () {
        $('#modal-commit').remove();
        var modal = $('<div id="modal-commit" title="Commit Message" />');
        (modal).dialog({
            autoOpen: false,
            modal: true,
            resizable: false,
            draggable: false,
            show: "clip",
            hide: "fade"
        });

        var messageBox = $('<p align="center"></p>');
        messageBox.append($('<input id="message_box" type="text" size="30" value="' + this.defaultMessage + '" />').css({ 'color': 'gray', 'width': '18em', 'height': '2em' }));

        var commitButton = $('<p align="right"><input id="commit_button" type="button" value="commit"/></p>');
        modal.append(messageBox);
        modal.append(commitButton);
        modal.appendTo($('layer2'));
    };

    CommitWindow.prototype.MakeSummary = function (case0) {
        var ret = {};

        ret.count = Object.keys(case0.ElementMap).length;

        ret.lastModified = {};

        return ret;
    };

    CommitWindow.prototype.SetEventHandlers = function (caseViewer, case0, serverApi) {
        var self = this;

        $('#message_box').focus(function () {
            if ($(this).val() == self.defaultMessage) {
                $(this).val("");
                $(this).css('color', 'black');
            }
        });

        $('#message_box').blur(function () {
            if ($(this).val() == "") {
                $(this).val(self.defaultMessage);
                $(this).css('color', 'gray');
            }
        });

        function commit() {
            var encoder = new AssureIt.CaseEncoder();
            var contents = encoder.ConvertToASN(case0.ElementTop, false);

            if ($("#message_box").val() == self.defaultMessage) {
                alert("Please put some commit message in the text box.");
            } else {
                serverApi.Commit(contents, $("#message_box").val(), case0.CommitId, self.MakeSummary(case0));
                case0.SetModified(false);
                window.location.reload();
            }
        }

        $('#message_box').keydown(function (e) {
            if (e.keyCode == 13) {
                e.stopPropagation();
                commit();
            }
        });

        $('#commit_button').click(commit);
    };
    return CommitWindow;
})();

var CommitPlugIn = (function (_super) {
    __extends(CommitPlugIn, _super);
    function CommitPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.SideMenuPlugIn = new CommitSideMenuPlugIn(plugInManager);
    }
    return CommitPlugIn;
})(AssureIt.PlugInSet);

var CommitSideMenuPlugIn = (function (_super) {
    __extends(CommitSideMenuPlugIn, _super);
    function CommitSideMenuPlugIn(plugInManager) {
        _super.call(this, plugInManager);
    }
    CommitSideMenuPlugIn.prototype.IsEnabled = function (caseViewer, Case0, serverApi) {
        return Case0.IsEditable();
    };

    CommitSideMenuPlugIn.prototype.AddMenu = function (caseViewer, Case0, serverApi) {
        var commitWindow = new CommitWindow();
        commitWindow.SetEventHandlers(caseViewer, Case0, serverApi);

        return new AssureIt.SideMenuModel('#', "Commit", "commit", "glyphicon-floppy-disk", function (ev) {
            ($('#modal-commit')).dialog('open');
        });
    };
    return CommitSideMenuPlugIn;
})(AssureIt.SideMenuPlugIn);
