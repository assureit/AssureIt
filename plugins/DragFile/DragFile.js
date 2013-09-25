///<reference path='../../d.ts/jquery.d.ts'/>
///<reference path='../../src/CaseModel.ts'/>
///<reference path='../../src/CaseViewer.ts'/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var DCaseFile = (function () {
    function DCaseFile(result, name) {
        this.result = result;
        this.name = name;
    }
    return DCaseFile;
})();

var ImportFile = (function () {
    function ImportFile(selector, basepath) {
        this.selector = selector;
        this.basepath = basepath;
        var flag = true;
        $(this.selector).unbind('dragenter').unbind('dragover').unbind('dragleave');
        $(this.selector).on('dragenter', function (e) {
            e.stopPropagation();
            e.preventDefault();
        }).on('dragover', function (e) {
            e.stopPropagation();
            e.preventDefault();
            $(this).addClass('hover');
        }).on('dragleave', function (e) {
            e.stopPropagation();
            e.preventDefault();
            $(this).removeClass('hover');
        });
    }
    ImportFile.prototype.upload = function (callback) {
        var self = this;
        $(this.selector).unbind('drop');
        $(this.selector).on('drop', function (e) {
            var node = $(this);
            var label = node.children('h4').text();

            e.stopPropagation();
            e.preventDefault();
            $(this).removeClass('hover');
            var files = (e.originalEvent.dataTransfer).files;

            var fd = new FormData();
            for (var i = 0; i < files.length; i++) {
                fd.append("upfile", files[i]);
            }

            $.ajax({
                url: self.basepath + '/file',
                type: 'POST',
                data: fd,
                processData: false,
                contentType: false,
                success: function (data, textStatus, jqXHR) {
                    callback(data, label);
                }
            });
        });
    };
    return ImportFile;
})();

var DragFilePlugIn = (function (_super) {
    __extends(DragFilePlugIn, _super);
    function DragFilePlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.ActionPlugIn = new DragFileActionPlugIn(plugInManager);
        this.HTMLRenderPlugIn = new ImageFileHTMLPlugIn(plugInManager);
    }
    return DragFilePlugIn;
})(AssureIt.PlugInSet);

var DragFileActionPlugIn = (function (_super) {
    __extends(DragFileActionPlugIn, _super);
    function DragFileActionPlugIn(plugInManager) {
        _super.call(this, plugInManager);
    }
    DragFileActionPlugIn.prototype.IsEnabled = function (caseViewer, case0) {
        return case0.IsEditable();
    };

    DragFileActionPlugIn.prototype.Delegate = function (caseViewer, case0, serverApi) {
        var importFile = new ImportFile(".node", this.plugInManager.basepath);
        importFile.upload(function (data, label) {
            var nodeModel = case0.ElementMap[label];
            var nodeView = caseViewer.ViewMap[label];
            nodeModel.SetNote("ImageFile", data.split('=')[1]);
            nodeView.HTMLDoc.Render(caseViewer, nodeModel);
            caseViewer.Draw();
        });
        return true;
    };
    return DragFileActionPlugIn;
})(AssureIt.ActionPlugIn);

var ImageFileHTMLPlugIn = (function (_super) {
    __extends(ImageFileHTMLPlugIn, _super);
    function ImageFileHTMLPlugIn(plugInManager) {
        _super.call(this, plugInManager);
    }
    ImageFileHTMLPlugIn.prototype.IsEnabled = function (caseViewer, nodeModel) {
        return true;
    };

    ImageFileHTMLPlugIn.prototype.Delegate = function (caseViewer, nodeModel, element) {
        var basepath = this.plugInManager.basepath;
        if ("ImageFile" in nodeModel.Notes) {
            var note = nodeModel.Notes["ImageFile"];
            var img = $(new Image());
            img.bind('load', function () {
                $('<a href="' + basepath + '/' + note + '"></a>').append(img).appendTo(element);
                caseViewer.Draw();
            });
            img.attr('src', basepath + '/' + note);
            //$('<a href="' + basepath + '/' + body.URL+'"><img id="img-'+ nodeModel.Label + '-' + i + '" src="'+basepath+'/'+body.URL+'" /></a>')
            //.appendTo(element);
            //$('#img-'+ nodeModel.Label + '-' + i + '')
            //.bind('load', function(){
            //	console.log("redraw");
            //	caseViewer.Draw();
            //})
        }
        return true;
    };
    return ImageFileHTMLPlugIn;
})(AssureIt.HTMLRenderPlugIn);
