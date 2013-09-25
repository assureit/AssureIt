/// <reference path="../d.ts/jquery.d.ts" />
/// <reference path='ServerApi.ts'/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var AssureIt;
(function (AssureIt) {
    var SelectCaseModel = (function () {
        function SelectCaseModel(id, name, user, lastDate, lastUser, isLogin, api) {
            this.id = id;
            this.name = name;
            this.user = user;
            this.lastDate = lastDate;
            this.lastUser = lastUser;
            this.isLogin = isLogin;
            this.api = api;
        }
        SelectCaseModel.prototype.toHtml = function (callback) {
            return callback(this.id, this.name, this.user, this.lastDate, this.lastUser, this.isLogin);
        };

        SelectCaseModel.prototype.setEvent = function () {
            var _this = this;
            if (this.isLogin) {
                $("a#e" + this.id).click(function (e) {
                    var msg = prompt("Case名を入力して下さい");
                    if (msg != null) {
                        if (_this.api.EditCase(_this.id, msg) != null) {
                            alert("変更しました");
                            location.reload();
                        }
                    }
                });
                $("a#d" + this.id).click(function (e) {
                    if (window.confirm('dcaseを削除しますか?')) {
                        if (_this.api.DeleteCase(_this.id) != null) {
                            alert("削除しました");
                            location.reload();
                        }
                    }
                });
            }
        };
        return SelectCaseModel;
    })();
    AssureIt.SelectCaseModel = SelectCaseModel;

    var SelectCaseManager = (function () {
        function SelectCaseManager(api) {
            this.api = api;
            this.contents = [];
        }
        SelectCaseManager.prototype.clear = function () {
        };
        SelectCaseManager.prototype.updateContentsOrZeroView = function () {
        };

        SelectCaseManager.prototype.add = function (s) {
            this.contents.push(s);
        };

        SelectCaseManager.prototype._updateContentsOrZeroView = function ($tbody, zeroStr, callback) {
            if (this.contents.length == 0) {
                $(zeroStr).appendTo($tbody);
            }
            $.each(this.contents, function (i, s) {
                s.toHtml(callback).appendTo($tbody);
                s.setEvent();
            });
        };
        return SelectCaseManager;
    })();
    AssureIt.SelectCaseManager = SelectCaseManager;

    var ThumnailView = (function () {
        function ThumnailView() {
        }
        ThumnailView.toThumnail = function (id, name, user, lastDate, lastUser, isLogin) {
            var html = '<ul class="thumbnails"><li class="span4"><a href="#" class="thumbnail">' + name + '</a></li></ul>';
            return $('<div></div>').html(html);
        };
        return ThumnailView;
    })();
    AssureIt.ThumnailView = ThumnailView;

    var SelectCaseThumbnailManager = (function (_super) {
        __extends(SelectCaseThumbnailManager, _super);
        function SelectCaseThumbnailManager(api) {
            _super.call(this, api);
            this.api = api;
        }
        SelectCaseThumbnailManager.prototype.clear = function () {
            $("#select-case *").remove();
            $("#select-case").append('<div class="row-fluid"></div>');
        };

        SelectCaseThumbnailManager.prototype.updateContentsOrZeroView = function () {
            _super.prototype._updateContentsOrZeroView.call(this, $('#select-case .row-fluid'), "<font color=gray>Caseがありません</font>", ThumnailView.toThumnail);
        };
        return SelectCaseThumbnailManager;
    })(SelectCaseManager);
    AssureIt.SelectCaseThumbnailManager = SelectCaseThumbnailManager;

    var TableView = (function () {
        function TableView() {
        }
        TableView.toTable = function (id, name, user, lastDate, lastUser, isLogin) {
            //FIXME
            var Config = { BASEPATH: "FIXME" };
            var html = '<td><a href="' + Config.BASEPATH + '/dcase/' + id + '">' + name + "</a><td>" + lastUser + "</td>";
            if (isLogin) {
                html += "<td><a id=\"e" + id + "\" href=\"#\">Edit</a></td>" + "<td><a id=\"d" + id + "\" href=\"#\">Delete</a></td>";
            }
            return $("<tr></tr>").html(html);
        };
        return TableView;
    })();
    AssureIt.TableView = TableView;

    var SelectCaseTableManager = (function (_super) {
        __extends(SelectCaseTableManager, _super);
        function SelectCaseTableManager(api) {
            _super.call(this, api);
            this.api = api;
        }
        SelectCaseTableManager.prototype.clear = function () {
            $("tbody#case-select-table *").remove();
        };

        SelectCaseTableManager.prototype.updateContentsOrZeroView = function () {
            _super.prototype._updateContentsOrZeroView.call(this, $('#case-select-table'), "<tr><td><font color=gray>Caseがありません</font></td><td></td><td></td><td></td></tr>", TableView.toTable);
        };
        return SelectCaseTableManager;
    })(SelectCaseManager);
    AssureIt.SelectCaseTableManager = SelectCaseTableManager;

    var SelectCaseView = (function () {
        function SelectCaseView(api, rootSelector) {
            this.api = api;
            this.rootSelector = rootSelector;
            this.pageIndex = 1;
            this.maxPageSize = 2;
            this.manager = new SelectCaseTableManager(api);
        }
        SelectCaseView.prototype.clear = function () {
            this.manager.clear();
        };

        SelectCaseView.prototype.addElements = function (userId, pageIndex, tags) {
            var _this = this;
            if (pageIndex == null || pageIndex < 1)
                pageIndex = 1;
            if (tags == null)
                tags = [];
            this.pageIndex = pageIndex - 0;
            var searchResults = this.api.SearchCase(this.pageIndex, tags);
            var dcaseList = searchResults.dcaseList;
            this.maxPageSize = searchResults.summary.maxPage;

            var isLogin = userId != null;
            $.each(dcaseList, function (i, dcase) {
                var s = new SelectCaseModel(dcase.dcaseId, dcase.dcaseName, dcase.userName, dcase.latestCommit.dateTime, dcase.latestCommit.userName, isLogin, _this.api);
                _this.manager.add(s);
            });
            this.manager.updateContentsOrZeroView();
        };

        SelectCaseView.prototype.initEvents = function () {
            var _this = this;
            var Config = { BASEPATH: "FIXME" };
            $("#prev-page").click(function (e) {
                var i = _this.pageIndex - 0;
                if (i > 1) {
                    _this.pageIndex = i - 1;
                    location.href = Config.BASEPATH + "/page/" + _this.pageIndex;
                }
                e.preventDefault();
            });

            $("#next-page").click(function (e) {
                var i = _this.pageIndex - 0;
                if (_this.maxPageSize >= i + 1) {
                    _this.pageIndex = i + 1;
                    location.href = Config.BASEPATH + "/page/" + _this.pageIndex;
                }
                e.preventDefault();
            });
        };
        return SelectCaseView;
    })();
    AssureIt.SelectCaseView = SelectCaseView;
})(AssureIt || (AssureIt = {}));
