///<reference path='../d.ts/jquery.d.ts'/>
///<reference path='./CaseModel.ts'/>
///<reference path='./CommitModel.ts'/>

module AssureIt {
	var default_success_callback = function(result) {
		// do nothing
	};

	var default_error_callback = function(req, stat, err) {
		alert("ajax error");
	};

	export class ServerAPI {
		uri : string;
		basepath : string;
		recpath : string;
		agentpath : string;

		constructor(basepath: string, recpath: string, agentpath) {
			this.uri = basepath + "/api/1.0/";
			this.basepath = basepath;
			this.recpath = recpath;
			this.agentpath = agentpath;
			this.basepath = basepath + "/";
		}

		RemoteCall(method : string, params : any) {
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
				success: function(response) {
					callback(response.result);
				},
				error: error_callback
			});
			if(!async) {
				return JSON.parse(res.responseText).result;
			}
		}

		GetCase (ProjectName : string, CaseId : number) : Object {
			return <Object> this.RemoteCall("getDCase", { dcaseId: CaseId });
		}

		//-------------------------------------

		SearchCase(pageIndex: any, tags?: string[]) {
			if(tags == null) {
				tags = [];
			}
			try{
				return this.RemoteCall("searchDCase", {page: pageIndex, tagList: tags});
			}catch(e){
				return [];
			}
		}

		CreateCase(name: string, tree: any) {
			return this.RemoteCall("createDCase", {
				dcaseName: name, contents: tree });
		}

		GetCommitList(dcaseId: number): CommitCollection {
			return CommitCollection.FromJson(this.RemoteCall("getCommitList", { dcaseId:dcaseId }).commitList);
		}

		GetTagList() {
			return this.RemoteCall("getTagList", {});
		}

		Commit(tree, msg, commitId, summary) {
			return this.RemoteCall("commit", {
				contents: tree,
				commitMessage: msg,
				'commitId': commitId,
				summary: JSON.stringify(summary)
			}).commitId;
		}

		EditCase(dcaseId, name) {
			return this.RemoteCall("editDCase", {
				dcaseId: dcaseId,
				dcaseName: name
			});
		}

		DeleteCase(dcaseId) {
			return this.RemoteCall("deleteDCase", { dcaseId: dcaseId });
		}

		GetNodeTree(commitId) {
			return this.RemoteCall("getNodeTree", { commitId: commitId });
		}

		SearchNode(text: string) {
			return this.RemoteCall("searchNode", { text: text }).searchResultList;
		}

		SearchCaseHistory(dcaseId: number, text: string) {
			return this.RemoteCall("searchDCaseHistory", {dcaseId: dcaseId, text: text});
		}

		GetProjectList(userId: number) {
			return this.RemoteCall("getProjectList", { userId:userId });
		}

		CreateProject(name: string, isPublic: boolean) {
			return this.RemoteCall("createProject", {
				name: name, isPublic: isPublic });
		}

		EditProject(name: string, projectId: number) {
			return this.RemoteCall("editProject", {
				name: name, projectId: projectId });
		}

		GetDScript(funcName: string) {
			return this.RemoteCall("getDScript", {
				funcName: funcName });
		}
		ExecDScript(lang: string, script: string) {
			return this.RemoteCall("execDScript", {
				lang : lang,
				script : script
			});
		}
	}
}
