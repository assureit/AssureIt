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
		script : {
			main : string;
			lib : any;
		}
		meta : {
			entry : any;
		}
	}

	export class AssureItAgentAPI {
		uri : string;
		basepath : string;

		constructor(path: string) {
			this.uri = path
			this.basepath = path;
		}

		Deploy(dscript: DScript) {
			RemoteProcedureCall(this.uri, "Deploy", dscript);
		}

	}

}
