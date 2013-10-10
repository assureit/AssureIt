var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var NotePlugIn = (function (_super) {
    __extends(NotePlugIn, _super);
    function NotePlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.HTMLRenderPlugIn = new NoteHTMLRenderPlugIn(plugInManager);
    }
    return NotePlugIn;
})(AssureIt.PlugInSet);

var NoteHTMLRenderPlugIn = (function (_super) {
    __extends(NoteHTMLRenderPlugIn, _super);
    function NoteHTMLRenderPlugIn() {
        _super.apply(this, arguments);
    }
    NoteHTMLRenderPlugIn.prototype.IsEnabled = function (caseViewer, nodeModel) {
        return true;
    };

    NoteHTMLRenderPlugIn.prototype.Delegate = function (caseViewer, nodeModel, element) {
        element.children("#note").remove();
        var $note = $('<div id="note"></div>');

        for (var key in nodeModel.Notes) {
            switch (key) {
                case 'TranslatedTextEn':
                    var note = nodeModel.Notes[key];
                    $('<p style="color: DarkOliveGreen">' + note + '</p>').appendTo($note);
                    $note.appendTo(element);
                    break;
                default:
                    var note = nodeModel.Notes[key];
                    $('<p style="color: DarkOliveGreen">' + key + ": " + note + '</p>').appendTo($note);
                    $note.appendTo(element);
            }
        }

        return true;
    };
    return NoteHTMLRenderPlugIn;
})(AssureIt.HTMLRenderPlugIn);
