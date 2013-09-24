///<reference path='../d.ts/jquery.d.ts'/>

module AssureIt {

	function RemoteProcedureCall(uri: string, method: string, params: any) {

		var defaultSuccessCallback = function(res) {
			// do nothing
		}

		var defaultErrorCallback = function(req, stat, err) {
			alert("ajax error");
		}

		var cmd = {
			jsonrpc: "2.0",
			method: method,
			id: 1,
			params: params
		};

		$.ajax({
			type: "POST",
			url: uri,
			async: false,
			data: JSON.stringify(cmd),
			//dataType: "json",   // FIXME
			//contentType: "application/json; charset=utf-8",   // FIXME
			success: defaultSuccessCallback,
			error: defaultErrorCallback
		});
	}

	export interface DScript {
		main: any;
		lib: any;
	}

	export class AssureItAgentAPI {
		uri : string;
		basepath : string;

		constructor(path: string) {
			this.uri = path
			this.basepath = path;
		}

		Deploy(dscript: DScript) {
			var params = {
				script: dscript
			};

			RemoteProcedureCall(this.uri, "Deploy", params);
		}

	}

}
