var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var FullScreenEditorPlugIn = (function (_super) {
    __extends(FullScreenEditorPlugIn, _super);
    function FullScreenEditorPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        var plugin = new FullScreenEditorActionPlugIn(plugInManager);
        this.ActionPlugIn = plugin;
        this.MenuBarContentsPlugIn = new FullScreenMenuPlugIn(plugInManager, plugin);
        this.HTMLRenderPlugIn = new FullScreenEditorLayoutPlugIn(plugInManager);
    }
    return FullScreenEditorPlugIn;
})(AssureIt.PlugInSet);

var FullScreenMenuPlugIn = (function (_super) {
    __extends(FullScreenMenuPlugIn, _super);
    function FullScreenMenuPlugIn(plugInManager, editorPlugIn) {
        _super.call(this, plugInManager);
        this.editorPlugIn = editorPlugIn;
    }
    FullScreenMenuPlugIn.prototype.IsEnabled = function (caseViewer, caseModel) {
        return caseViewer.Source.IsEditable();
    };

    FullScreenMenuPlugIn.prototype.Delegate = function (caseViewer, caseModel, element, serverApi) {
        var _this = this;
        element.append('<a href="#" ><img id="fullscreen-menu" src="' + serverApi.basepath + 'images/max.png" title="FullScreen" alt="fullscreen" /></a>');
        $('#fullscreen-menu').unbind('click');
        $('#fullscreen-menu').click(function (ev) {
            _this.editorPlugIn.rootModel = caseModel;
            _this.editorPlugIn.ShowFullScreenEditor(ev);
        });
        return true;
    };
    return FullScreenMenuPlugIn;
})(AssureIt.MenuBarContentsPlugIn);

var FullScreenEditorLayoutPlugIn = (function (_super) {
    __extends(FullScreenEditorLayoutPlugIn, _super);
    function FullScreenEditorLayoutPlugIn(plugInManager) {
        _super.call(this, plugInManager);
    }
    FullScreenEditorLayoutPlugIn.prototype.IsEnabled = function (caseViewer, caseModel) {
        return true;
    };

    FullScreenEditorLayoutPlugIn.prototype.Delegate = function (caseViewer, caseModel, element) {
        return true;
    };
    return FullScreenEditorLayoutPlugIn;
})(AssureIt.HTMLRenderPlugIn);

var FullScreenEditorActionPlugIn = (function (_super) {
    __extends(FullScreenEditorActionPlugIn, _super);
    function FullScreenEditorActionPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.editor = CodeMirror.fromTextArea(document.getElementById('fullscreen-editor'), {
            lineNumbers: true,
            mode: "text/x-csrc",
            lineWrapping: true
        });
        $(this.editor.getWrapperElement()).css({
            height: "100%",
            width: "100%",
            background: "rgba(255, 255, 255, 0.85)"
        });
        $('#fullscreen-editor-wrapper').css({
            position: "absolute",
            top: "5%",
            left: "5%",
            height: "90%",
            width: "90%",
            display: 'none'
        });
        this.ShowFullScreenEditor = null;
        this.ErrorHighlight = new ErrorHighlight(this.editor);
    }
    FullScreenEditorActionPlugIn.prototype.IsEnabled = function (caseViewer, case0) {
        return true;
    };

    FullScreenEditorActionPlugIn.Object_Clone = function (obj) {
        var f = {};
        var keys = Object.keys(obj);
        for (var i in keys) {
            f[keys[i]] = obj[keys[i]];
        }
        return f;
    };

    FullScreenEditorActionPlugIn.ElementMap_Clone = function (obj) {
        return this.Object_Clone(obj);
    };

    FullScreenEditorActionPlugIn.IdCounters_Clone = function (obj) {
        var IdCounters = [];
        for (var i in obj) {
            IdCounters.push(this.Object_Clone(obj[i]));
        }
        return IdCounters;
    };

    FullScreenEditorActionPlugIn.ElementMap_removeChild = function (ElementMap, model) {
        if (ElementMap[model.Label] == undefined) {
            console.log("wrong with nodemodel");
        }
        delete (ElementMap[model.Label]);
        for (var i in model.Children) {
            this.ElementMap_removeChild(ElementMap, model.Children[i]);
        }
        return ElementMap;
    };

    FullScreenEditorActionPlugIn.IdCounters_removeChild = function (IdCounters, model) {
        var count = Number(model.Label.substring(1));
        if (IdCounters[model.Type][count] == undefined) {
            console.log("wrong with idcounters");
        }
        delete (IdCounters[model.Type][count]);
        for (var i in model.Children) {
            this.IdCounters_removeChild(IdCounters, model.Children[i]);
        }
        return IdCounters;
    };

    FullScreenEditorActionPlugIn.prototype.Delegate = function (caseViewer, case0, serverApi) {
        var editor = this.editor;
        var self = this;

        if (!this.ShowFullScreenEditor) {
            this.ShowFullScreenEditor = function (ev) {
                ev.stopPropagation();
                self.plugInManager.UseUILayer(self);
                self.isDisplayed = true;

                var label = this.rootModel.Label;

                var encoder = new AssureIt.CaseEncoder();
                var encoded = encoder.ConvertToASN(case0.ElementMap[label], false);

                $('#fullscreen-editor-wrapper').css({ display: 'block' }).addClass("animated fadeInDown").focus().on("blur", function (e) {
                    e.stopPropagation();
                    self.ErrorHighlight.ClearHighlight();

                    var orig_model = case0.ElementMap[label];
                    var orig_view = caseViewer.ViewMap[label];

                    var orig_idCounters = case0.ReserveIdCounters(orig_model);
                    var orig_ElementMap = case0.ReserveElementMap(orig_model);

                    var decoder = new AssureIt.CaseDecoder();
                    var new_model = decoder.ParseASN(case0, editor.getValue(), orig_model);

                    if (new_model != null) {
                        var new_view = new AssureIt.NodeView(caseViewer, new_model);
                        var Parent = orig_model.Parent;
                        if (Parent != null) {
                            new_model.Parent = Parent;
                            for (var j in Parent.Children) {
                                if (Parent.Children[j].Label == orig_model.Label) {
                                    Parent.Children[j] = new_model;
                                }
                            }
                            new_view.ParentShape = caseViewer.ViewMap[Parent.Label];
                        } else {
                            caseViewer.ElementTop = new_model;
                            case0.ElementTop = new_model;
                        }
                        (function (model, view) {
                            caseViewer.ViewMap[model.Label] = view;
                            for (var i = 0; i < model.Children.length; i++) {
                                var child_model = model.Children[i];
                                var child_view = new AssureIt.NodeView(caseViewer, child_model);
                                arguments.callee(child_model, child_view);
                            }
                            if (model.Parent != null)
                                view.ParentShape = caseViewer.ViewMap[model.Parent.Label];
                        })(new_model, new_view);
                        new_model.EnableEditFlag();

                        var $this = $(this);
                        self.isDisplayed = false;
                        $this.addClass("animated fadeOutUp");
                        window.setTimeout(function () {
                            $this.removeClass();
                            $this.css({ display: 'none' });
                        }, 1300);
                        $('#fullscreen-editor-wrapper').unbind();
                    } else {
                        self.ErrorHighlight.Highlight(decoder.GetASNError().line, "");
                        case0.ElementMap = orig_ElementMap;
                        case0.IdCounters = orig_idCounters;
                    }
                    caseViewer.DeleteHTMLElementAll();
                    caseViewer.Draw();

                    caseViewer.Draw();
                }).on("keydown", function (e) {
                    if (e.keyCode == 27) {
                        e.stopPropagation();
                        $('#fullscreen-editor-wrapper').blur();
                    }
                });
                editor.setValue(encoded);
                editor.refresh();

                editor.focus();
                $('#CodeMirror').focus();
                $('#background').click(function () {
                    $('#fullscreen-editor-wrapper').blur();
                });
                window.setTimeout(function () {
                    if (!self.isDisplayed) {
                        $('#fullscreen-editor-wrapper').css({ display: 'none' });
                    }
                    $('#fullscreen-editor-wrapper').removeClass();
                }, 1300);
            };
        }

        return true;
    };

    FullScreenEditorActionPlugIn.prototype.DeleteFromDOM = function () {
        $('#fullscreen-editor-wrapper').blur();
    };
    return FullScreenEditorActionPlugIn;
})(AssureIt.ActionPlugIn);
