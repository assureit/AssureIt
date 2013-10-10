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

    CommitWindow.prototype.UpdateLastModified = function (summary, case0, lastModified) {
        if (lastModified == null)
            lastModified = {};
        var userName = $.cookie('userName');
        var oldcase = new AssureIt.Case('oldCase', case0.oldsummary, case0.oldasn, case0.CaseId, case0.CommitId, null);
        var caseDecoder = new AssureIt.CaseDecoder();
        var root = caseDecoder.ParseASN(oldcase, case0.oldasn, null);
        oldcase.SetElementTop(root);
        var res = {};

        var added = [], deleted = [], modified = [];
        for (var i in case0.ElementMap) {
            var node = case0.ElementMap[i];
            var oldnode = oldcase.ElementMap[i];
            if (oldnode == null) {
                added.push(i);
                res[i] = { userName: $.cookie('userName'), role: 'admin' };
            } else if (node.Equals(oldnode)) {
                if (lastModified[i] != null) {
                    res[i] = lastModified[i];
                } else {
                    res[i] = { userName: $.cookie('userName'), role: 'admin' };
                }
            } else {
                modified.push(i);
                res[i] = { userName: $.cookie('userName'), role: 'admin' };
            }
        }

        for (var i in oldcase.ElementMap) {
            if (case0.ElementMap[i] == null) {
                deleted.push(i);
            }
        }
        summary.lastModified = res;
        summary.added = added;
        summary.modified = modified;
        summary.deleted = deleted;
    };

    CommitWindow.prototype.MakeSummary = function (case0) {
        var oldsummary = case0.oldsummary;
        if (oldsummary == null) {
            oldsummary = {};
        }
        var summary = {};

        summary.count = Object.keys(case0.ElementMap).length;

        this.UpdateLastModified(summary, case0, oldsummary.lastModified);

        return summary;
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
