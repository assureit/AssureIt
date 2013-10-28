///<reference path='../d.ts/jquery.d.ts'/>
///<reference path='./CaseModel.ts'/>
///<reference path='./CommitModel.ts'/>
var AssureIt;
(function (AssureIt) {
    var default_success_callback = function (result) {
        // do nothing
    };

    var default_error_callback = function (req, stat, err) {
        alert("ajax error");
    };

    var ServerAPI = (function () {
        function ServerAPI(basepath, recpath, agentpath) {
            this.uri = basepath + "/api/1.0/";
            this.basepath = basepath;
            this.recpath = recpath;
            this.agentpath = agentpath;
            this.basepath = basepath + "/";
        }
        ServerAPI.prototype.RemoteCall = function (method, params) {
            var cmd = {
                jsonrpc: "2.0",
                method: method,
                id: 1,
                params: params
            };
            var async = callback != null;
            var callback = default_success_callback;
            var error_callback = default_error_callback;
            var res = $.ajax({
                type: "POST",
                url: this.uri,
                async: async,
                data: JSON.stringify(cmd),
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                success: function (response) {
                    callback(response.result);
                },
                error: error_callback
            });
            if (!async) {
                return JSON.parse(res.responseText).result;
            }
        };

        ServerAPI.prototype.GetCase = function (ProjectName, CaseId) {
            return this.RemoteCall("getDCase", { dcaseId: CaseId });
        };

        //-------------------------------------
        ServerAPI.prototype.SearchCase = function (pageIndex, tags) {
            if (tags == null) {
                tags = [];
            }
            try  {
                return this.RemoteCall("searchDCase", { page: pageIndex, tagList: tags });
            } catch (e) {
                return [];
            }
        };

        ServerAPI.prototype.CreateCase = function (name, tree) {
            return this.RemoteCall("createDCase", {
                dcaseName: name,
                contents: tree
            });
        };

        ServerAPI.prototype.GetCommitList = function (dcaseId) {
            return AssureIt.CommitCollection.FromJson(this.RemoteCall("getCommitList", { dcaseId: dcaseId }).commitList);
        };

        ServerAPI.prototype.GetTagList = function () {
            return this.RemoteCall("getTagList", {});
        };

        ServerAPI.prototype.Commit = function (tree, msg, commitId, summary) {
            return this.RemoteCall("commit", {
                contents: tree,
                commitMessage: msg,
                'commitId': commitId,
                summary: JSON.stringify(summary)
            }).commitId;
        };

        ServerAPI.prototype.EditCase = function (dcaseId, name) {
            return this.RemoteCall("editDCase", {
                dcaseId: dcaseId,
                dcaseName: name
            });
        };

        ServerAPI.prototype.DeleteCase = function (dcaseId) {
            return this.RemoteCall("deleteDCase", { dcaseId: dcaseId });
        };

        ServerAPI.prototype.GetNodeTree = function (commitId) {
            return this.RemoteCall("getNodeTree", { commitId: commitId });
        };

        ServerAPI.prototype.SearchNode = function (text) {
            return this.RemoteCall("searchNode", { text: text }).searchResultList;
        };

        ServerAPI.prototype.SearchCaseHistory = function (dcaseId, text) {
            return this.RemoteCall("searchDCaseHistory", { dcaseId: dcaseId, text: text });
        };

        ServerAPI.prototype.GetProjectList = function (userId) {
            return this.RemoteCall("getProjectList", { userId: userId });
        };

        ServerAPI.prototype.CreateProject = function (name, isPublic) {
            return this.RemoteCall("createProject", {
                name: name,
                isPublic: isPublic
            });
        };

        ServerAPI.prototype.EditProject = function (name, projectId) {
            return this.RemoteCall("editProject", {
                name: name,
                projectId: projectId
            });
        };

        ServerAPI.prototype.GetDScript = function (funcName) {
            return this.RemoteCall("getDScript", {
                funcName: funcName
            });
        };
        return ServerAPI;
    })();
    AssureIt.ServerAPI = ServerAPI;
})(AssureIt || (AssureIt = {}));
