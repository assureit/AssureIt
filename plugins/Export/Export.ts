/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseEncoder.ts" />
/// <reference path="../../src/ServerApi.ts" />
/// <reference path="../../src/PlugInManager.ts" />
/// <reference path="../Editor/Editor.ts" />

class ExportPlugIn extends AssureIt.PlugInSet {

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		var plugin: ExportActionPlugIn = new ExportActionPlugIn(plugInManager);
		this.ActionPlugIn = plugin;
		this.MenuBarContentsPlugIn = new ExportMenuPlugIn(plugInManager, plugin);
	}

}

class ExportMenuPlugIn extends AssureIt.MenuBarContentsPlugIn {
	editorPlugIn: ExportActionPlugIn;
	constructor(plugInManager: AssureIt.PlugInManager, editorPlugIn: ExportActionPlugIn) {
		super(plugInManager);
		this.editorPlugIn = editorPlugIn;
	}

	IsEnabled(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel): boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, caseModel: AssureIt.NodeModel, element: JQuery, serverApi: AssureIt.ServerAPI): boolean {
		element.append('<a href="#" ><img id="export-xml" src="' + serverApi.basepath + 'images/icon.png" title="Export XML" alt="XML" /></a>');
		element.append('<a href="#" ><img id="export-pdf" src="' + serverApi.basepath + 'images/icon.png" title="Export PDF" alt="XML" /></a>');
		element.append('<a href="#" ><img id="export-png" src="' + serverApi.basepath + 'images/icon.png" title="Export PNG" alt="XML" /></a>');
		$('#export-pdf').unbind('click');
		$('#export-xml').unbind('click');
		$('#export-png').unbind('click');
		$('#export-pdf').click(this.editorPlugIn.ExportPdf);
		$('#export-xml').click(this.editorPlugIn.ExportXml);
		$('#export-png').click(this.editorPlugIn.ExportPng);
		return true;
	}
}

class ExportActionPlugIn extends AssureIt.ActionPlugIn {
	ExportPdf: (ev: Event) => void;
	ExportXml: (ev: Event) => void;
	ExportPng: (ev: Event) => void;

	constructor(plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
	}

	IsEnabled (caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case) : boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI)  : boolean {
		var self = this;

		var ShowExport = function(type: string) : (ev: Event) => void {
			var ExportType = type;
			return  function (ev: Event) {
				ev.stopPropagation();
				var svg = self.CreateSVGDocument(caseViewer, case0.ElementTop); //FIXME
				svg = svg.replace("</svg></svg>", "</svg>"); // for IE10 Bug
				self.executePost(serverApi.basepath + 'export.' + type, {"type" : type, "svg" : svg});
			};
		}

		this.ExportPdf = ShowExport("pdf");
		this.ExportPng = ShowExport("png");

		this.ExportXml = function(ev: Event): void {
			ev.stopPropagation();

			var dcaseXml: string = new AssureIt.CaseEncoder().ConvertToDCaseXML(case0.ElementTop);
			dcaseXml = dcaseXml.replace(/&/g, '&amp;');
			dcaseXml = dcaseXml.replace(/</g, '&lt;');
			dcaseXml = dcaseXml.replace(/>/g, '&gt;');
			dcaseXml = dcaseXml.replace(/"/g, '&quot;');
			var childWindow = window.open();
			$(childWindow.document.body).append($('<pre>'+dcaseXml+'</pre>'));
		};

		return true;
	}

	executePost(action, data): void {
		var $body = $(document.body);
		var $form = $("<form>").attr({
			"action" : action,
			"method" : "post",
			"target" : "_blank",
		}).hide().appendTo($body);

		if (data !== undefined) {
			for (var paramName in data) {
				$('<input type="hidden">').attr({
					'name' : paramName,
					'value' : data[paramName],
				}).appendTo($form);
			}
		}
		$form.submit();
		$form.empty().remove();
	}

	foreachLine(str: string, max: number, callback) : void{
		if(!callback) return;
		var rest: string = str;
		var maxLength: number = max || 20;
		maxLength = maxLength < 1 ? 1 : maxLength;
		var length = 0;
		var i = 0;
		for(var pos = 0; pos < rest.length; ++pos) {
			var code = rest.charCodeAt(pos);
			length += code < 128 ? 1 : 2;
			if(length > maxLength || rest.charAt(pos) == "\n"){
				callback(rest.substr(0, pos), i);
				if(rest.charAt(pos) == "\n"){
					pos++;
				}
				rest = rest.substr(pos, rest.length - pos);
				pos = -1;
				length = 0;
				i++;
			}
		}
		callback(rest, i);
	}

	CreateSVGDocument(caseViewer: AssureIt.CaseViewer, Element: AssureIt.NodeModel):any {
		var SVG_NS = "http://www.w3.org/2000/svg";
		var $svg = $('<svg width="100%" height="100%" version="1.1" xmlns="'+SVG_NS+'">');
		var viewMap = caseViewer.ViewMap;

		var TopView = viewMap[Element.Label];
		var $svg = $('<svg width="100%" height="100%" version="1.1" xmlns="'+SVG_NS+'">');
		$svg.append($("svg defs").clone(false));
		var $target = $(document.createElementNS(SVG_NS, "g")).appendTo($svg);
		Element.traverse((i, node) => {
			var nodeView = viewMap[node.Label];
			var svg  = nodeView.SVGShape.GetSVG();
			var div  = nodeView.HTMLDoc.DocBase[0];
			var connector = nodeView.SVGShape.GetSVGPath();

			$target.append($(svg).clone(false));
			$target.append($(connector).clone(false));

			var $svgtext = $(document.createElementNS(SVG_NS, "text"))
				.attr({"font-size": "18px", x : div.offsetLeft+10, y : div.offsetTop + 30});

			$(document.createElementNS(SVG_NS, "tspan"))
				.text(node.Label).attr({"font-weight": "bold", "font-family": 'Arial'}).appendTo($svgtext);
			$(document.createElementNS(SVG_NS, "tspan"))
				.text("").attr({dy: "10px", "font-weight": "bold", "font-family": 'Arial'}).appendTo($svgtext);

			this.foreachLine(node.Statement, 1+~~(div.offsetWidth * 2 / 15), (linetext) => {
				$(document.createElementNS(SVG_NS, "tspan"))
					.text(linetext)
					.attr({x : div.offsetLeft+10, dy : 15, "font-size" : "13px", "font-family": 'Helvetica Neue'})
					.appendTo($svgtext);
			});

			if (node.Notes && node.Notes['TranslatedTextEn']) {
				this.foreachLine(node.Notes['TranslatedTextEn'], 1+~~(div.offsetWidth * 2 / 15), (linetext) => {
					$(document.createElementNS(SVG_NS, "tspan"))
						.text(linetext)
						.attr({x : div.offsetLeft+10, dy : 15, "fill": "green", "font-size" : "13px", "font-family": 'Helvetica Neue'})
						.appendTo($svgtext);
				});
			}

			$target.append($svgtext);
		});
		var $dummydiv = $("<div>").append($svg);
		var header = '<?xml version="1.0" standalone="no"?>\n' + 
			'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
		var doc = header + $dummydiv.html();
		$svg.empty().remove();
		return doc;
	}

	DeleteFromDOM(): void {
	}
}
