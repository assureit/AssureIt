///<reference path='../d.ts/jquery.d.ts'/>

module AssureIt {

	function RemoteProcedureCall(uri: string, method: string, params: any): any {

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

		var ret = JSON.parse($.ajax({
			type: "POST",
			url: uri,
			async: false,
			data: cmd,
			//dataType: "json",   // FIXME
			//contentType: "application/json; charset=utf-8",   // FIXME
			success: defaultSuccessCallback,
			error: defaultErrorCallback
		}).responseText);

		return ret;
	}

	export class RECAPI {
		uri : string;
		basepath : string;

		constructor(path: string) {
			this.uri = path
			this.basepath = path;
		}

		pushRawData(location: string, type: string, data: number, authid: string, context: string): any {
			var params = {
				location: location,
				type: type,
				data: data,
				authid: authid,
				context: context
			};

			var res = RemoteProcedureCall(this.uri, "pushRawData", params);

			if('result' in res) {
				return res.result;
			}
			else {
				console.log(res.error)
				return null;
			}
		}

		getRawData(recid: string): any {
			var params = { recid: recid };

			var res = RemoteProcedureCall(this.uri, "getRawData", params);

			if('result' in res) {
				return res.result;
			}
			else {
				console.log(res.error)
				return null;
			}
		}

		getLatestData(location: string, type: string): any {
			var params = {
				location: location,
				type: type
			};

			var res = RemoteProcedureCall(this.uri, "getLatestData", params);

			if('result' in res) {
				return res.result;
			}
			else {
				console.log(res.error)
				return null;
			}
		}

		getRawDataList(location: string, type: string, limit?: number, beginTimestamp?: Date, endTimestamp?: Date): any {
			var params = {
				location: location,
				type: type,
				limit: limit,
				beginTimestamp: beginTimestamp,
				endTimestamp: endTimestamp,
			};

			var res = RemoteProcedureCall(this.uri, "getRawtDataList", params);

			if('result' in res) {
				return res.result;
			}
			else {
				console.log(res.error)
				return null;
			}
		}

		getMonitorList(): any[] {
			var params = {};

			var res = RemoteProcedureCall(this.uri, "getMonitorList", params);

			if('result' in res) {
				return res.result;
			}
			else {
				console.log(res.error)
				return null;
			}
		}

	}

}
