var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ExportPlugIn = (function (_super) {
    __extends(ExportPlugIn, _super);
    function ExportPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        var plugin = new ExportActionPlugIn(plugInManager);
        this.ActionPlugIn = plugin;
        this.MenuBarContentsPlugIn = new ExportMenuPlugIn(plugInManager, plugin);
    }
    return ExportPlugIn;
})(AssureIt.PlugInSet);

var ExportMenuPlugIn = (function (_super) {
    __extends(ExportMenuPlugIn, _super);
    function ExportMenuPlugIn(plugInManager, editorPlugIn) {
        _super.call(this, plugInManager);
        this.editorPlugIn = editorPlugIn;
    }
    ExportMenuPlugIn.prototype.IsEnabled = function (caseViewer, caseModel) {
        return true;
    };

    ExportMenuPlugIn.prototype.Delegate = function (caseViewer, caseModel, element, serverApi) {
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
    };
    return ExportMenuPlugIn;
})(AssureIt.MenuBarContentsPlugIn);

var ExportActionPlugIn = (function (_super) {
    __extends(ExportActionPlugIn, _super);
    function ExportActionPlugIn(plugInManager) {
        _super.call(this, plugInManager);
    }
    ExportActionPlugIn.prototype.IsEnabled = function (caseViewer, case0) {
        return true;
    };

    ExportActionPlugIn.prototype.Delegate = function (caseViewer, case0, serverApi) {
        var self = this;

        var ShowExport = function (type) {
            var ExportType = type;
            return function (ev) {
                ev.stopPropagation();
                var svg = self.CreateSVGDocument(caseViewer, case0.ElementTop);
                svg = svg.replace("</svg></svg>", "</svg>");
                self.executePost(serverApi.basepath + 'export.' + type, { "type": type, "svg": svg });
            };
        };

        this.ExportPdf = ShowExport("pdf");
        this.ExportPng = ShowExport("png");

        this.ExportXml = function (ev) {
            ev.stopPropagation();

            var dcaseXml = new AssureIt.CaseEncoder().ConvertToDCaseXML(case0.ElementTop);
            dcaseXml = dcaseXml.replace(/&/g, '&amp;');
            dcaseXml = dcaseXml.replace(/</g, '&lt;');
            dcaseXml = dcaseXml.replace(/>/g, '&gt;');
            dcaseXml = dcaseXml.replace(/"/g, '&quot;');
            var childWindow = window.open();
            $(childWindow.document.body).append($('<pre>' + dcaseXml + '</pre>'));
        };

        return true;
    };

    ExportActionPlugIn.prototype.executePost = function (action, data) {
        var $body = $(document.body);
        var $form = $("<form>").attr({
            "action": action,
            "method": "post",
            "target": "_blank"
        }).hide().appendTo($body);

        if (data !== undefined) {
            for (var paramName in data) {
                $('<input type="hidden">').attr({
                    'name': paramName,
                    'value': data[paramName]
                }).appendTo($form);
            }
        }
        $form.submit();
        $form.empty().remove();
    };

    ExportActionPlugIn.prototype.foreachLine = function (str, max, callback) {
        if (!callback)
            return;
        var rest = str;
        var maxLength = max || 20;
        maxLength = maxLength < 1 ? 1 : maxLength;
        var length = 0;
        var i = 0;
        for (var pos = 0; pos < rest.length; ++pos) {
            var code = rest.charCodeAt(pos);
            length += code < 128 ? 1 : 2;
            if (length > maxLength || rest.charAt(pos) == "\n") {
                callback(rest.substr(0, pos), i);
                if (rest.charAt(pos) == "\n") {
                    pos++;
                }
                rest = rest.substr(pos, rest.length - pos);
                pos = -1;
                length = 0;
                i++;
            }
        }
        callback(rest, i);
    };

    ExportActionPlugIn.prototype.CreateSVGDocument = function (caseViewer, Element) {
        var _this = this;
        var SVG_NS = "http://www.w3.org/2000/svg";
        var $svg = $('<svg width="100%" height="100%" version="1.1" xmlns="' + SVG_NS + '">');
        var viewMap = caseViewer.ViewMap;

        var TopView = viewMap[Element.Label];
        var $svg = $('<svg width="100%" height="100%" version="1.1" xmlns="' + SVG_NS + '">');
        $svg.append($("svg defs").clone(false));
        var $target = $(document.createElementNS(SVG_NS, "g")).appendTo($svg);
        Element.traverse(function (i, node) {
            var nodeView = viewMap[node.Label];
            var svg = nodeView.SVGShape.GetSVG();
            var div = nodeView.HTMLDoc.DocBase[0];
            var connector = nodeView.SVGShape.GetSVGPath();

            $target.append($(svg).clone(false));
            $target.append($(connector).clone(false));

            var $svgtext = $(document.createElementNS(SVG_NS, "text")).attr({ x: div.offsetLeft, y: div.offsetTop + 10 });

            $(document.createElementNS(SVG_NS, "tspan")).text(node.Label).attr("font-weight", "bold").appendTo($svgtext);

            _this.foreachLine(node.Statement, 1 + ~~(div.offsetWidth * 2 / 13), function (linetext) {
                $(document.createElementNS(SVG_NS, "tspan")).text(linetext).attr({ x: div.offsetLeft, dy: 15, "font-size": "13px" }).appendTo($svgtext);
            });

            $target.append($svgtext);
        });
        var $dummydiv = $("<div>").append($svg);
        var header = '<?xml version="1.0" standalone="no"?>\n' + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
        var doc = header + $dummydiv.html();
        $svg.empty().remove();
        return doc;
    };

    ExportActionPlugIn.prototype.DeleteFromDOM = function () {
    };
    return ExportActionPlugIn;
})(AssureIt.ActionPlugIn);
