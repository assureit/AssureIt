var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var DScriptPlugIn = (function (_super) {
    __extends(DScriptPlugIn, _super);
    function DScriptPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        var editorPlugIn = new DScriptEditorPlugIn(plugInManager);
        this.ActionPlugIn = editorPlugIn;
        this.MenuBarContentsPlugIn = new DScriptMenuPlugIn(plugInManager, editorPlugIn);
        this.SideMenuPlugIn = new DScriptSideMenuPlugIn(plugInManager, editorPlugIn);
    }
    return DScriptPlugIn;
})(AssureIt.PlugInSet);

var DScriptMenuPlugIn = (function (_super) {
    __extends(DScriptMenuPlugIn, _super);
    function DScriptMenuPlugIn(plugInManager, editorPlugIn) {
        _super.call(this, plugInManager);
        this.editorPlugIn = editorPlugIn;
    }
    DScriptMenuPlugIn.prototype.IsEnabled = function (caseViewer, nodeModel) {
        return false;
    };

    DScriptMenuPlugIn.prototype.Delegate = function (caseViewer, nodeModel, element, serverApi) {
        element.append('<a href="#" ><img id="dscript"  src="' + serverApi.basepath + 'images/dse.png" title="DScript" alt="dscript" /></a>');
        $('#dscript').unbind('click');
        $('#dscript').bind('click', function () {
            this.editorPlugIn.ShowEditor(nodeModel);
        });
        return true;
    };
    return DScriptMenuPlugIn;
})(AssureIt.MenuBarContentsPlugIn);

var DScriptEditorPlugIn = (function (_super) {
    __extends(DScriptEditorPlugIn, _super);
    function DScriptEditorPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        var self = this;

        this.Generator = new DShellCodeGenerator();

        this.ASNEditor = new CodeMirror($("<div/>").get(0), {
            lineNumbers: true,
            mode: "text/x-csrc",
            lineWrapping: true
        });
        this.DScriptViewer = new CodeMirror($("<div/>").get(0), {
            lineNumbers: true,
            mode: "text/x-csrc",
            readOnly: true,
            placeholder: "Generated DScript code goes here.",
            lineWrapping: true
        });
        this.NodeRelationTable = this.CreateTable(["Node", "Reaction", "Presume"], {
            bAutoWidth: false,
            aoColumns: [
                { sWidth: '10%' },
                { sWidth: '45%' },
                { sWidth: '45%' }
            ]
        });
        this.ActionRelationTable = this.CreateTable(["Location", "Goal", "FailureRisk", "Action"], {
            bAutoWidth: false,
            fnRowCallback: function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                var location = aData[0];
                var action = aData[3];
                if (location == "Undefined" || action.match(/Undefined : E[0-9]+/) != null || action == "NotExists") {
                    var $nRow = $(nRow);
                    if ($nRow.hasClass("odd")) {
                        $nRow.children().css("background-color", "#FFDDDD");
                    } else if ($nRow.hasClass("even")) {
                        $nRow.children().css("background-color", "#FFC4C4");
                    }
                }
                return nRow;
            },
            aoColumns: [
                { sWidth: '15%' },
                { sWidth: '45%' },
                { sWidth: '20%' },
                { sWidth: '20%' }
            ]
        });
        this.ASNEditor.on("change", function (e) {
            self.UpdateAll();
        });

        var wrapper = $("#dscript-editor-wrapper");
        wrapper.css({
            position: 'absolute',
            top: '5%',
            left: '5%',
            height: '90%',
            width: '90%',
            display: 'none',
            background: 'rgba(255, 255, 255, 0.85)'
        });

        var paneManager = new DScriptPaneManager(wrapper, $(this.ASNEditor.getWrapperElement()));
        paneManager.AddToOptionsList($(this.ASNEditor.getWrapperElement()), "ASN Editor", false);
        paneManager.AddToOptionsList($(this.DScriptViewer.getWrapperElement()), "DScript Viewer", false);
        paneManager.AddToOptionsList(this.NodeRelationTable.parent().css({
            width: "100%",
            height: "100%",
            overflow: "scroll"
        }), "Node Relation Table", false, false);
        paneManager.AddToOptionsList(this.ActionRelationTable.parent().css({
            width: "100%",
            height: "100%",
            overflow: "scroll"
        }), "Action Relation Table", false, false);
        paneManager.SetRefreshFunc(function () {
            self.UpdateASNEditor(null);
            self.UpdateDScriptViewer(null);
        });
        paneManager.ShowWidget("Action Relation Table");
        paneManager.AddWidgetOnBottom(paneManager.Options["Action Relation Table"], paneManager.Options["Node Relation Table"]);
        paneManager.AddWidgetOnRight(paneManager.Options["Node Relation Table"], paneManager.Options["DScript Viewer"]);
        this.PaneManager = paneManager;
    }
    DScriptEditorPlugIn.prototype.Delegate = function (caseViewer, case0, serverApi) {
        this.RootNodeModel = case0.ElementTop;
        this.CaseViewer = caseViewer;
        this.Generator.LibraryManager.ServerApi = serverApi;
        return true;
    };

    DScriptEditorPlugIn.prototype.ShowEditor = function (rootNodeModel) {
        var self = this;
        if (rootNodeModel != null)
            self.RootNodeModel = rootNodeModel;

        var wrapper = $("#dscript-editor-wrapper");
        wrapper.css("display", "block").addClass("animated fadeInDown").focus().one("blur", function (e, node) {
            self.plugInManager.UseUILayer(self);
            var caseViewer = self.CaseViewer;
            var rootNodeModel = self.RootNodeModel;
            var rootNodeView = new AssureIt.NodeView(caseViewer, rootNodeModel);
            var Parent = rootNodeModel.Parent;
            if (Parent != null) {
                rootNodeView.ParentShape = caseViewer.ViewMap[Parent.Label];
            } else {
                caseViewer.ElementTop = rootNodeModel;
                rootNodeModel.Case.ElementTop = rootNodeModel;
            }
            caseViewer.DeleteViewsRecursive(caseViewer.ViewMap[rootNodeModel.Label]);
            (function (model, view) {
                caseViewer.ViewMap[model.Label] = view;
                for (var i = 0; i < model.Children.length; i++) {
                    var childModel = model.Children[i];
                    var childView = new AssureIt.NodeView(caseViewer, childModel);
                    arguments.callee(childModel, childView);
                }
                if (model.Parent != null)
                    view.ParentShape = caseViewer.ViewMap[model.Parent.Label];
            })(rootNodeModel, rootNodeView);

            wrapper.addClass("animated fadeOutUp");
            window.setTimeout(function () {
                wrapper.removeClass();
                wrapper.css("display", "none");
            }, 1300);
            rootNodeModel.EnableEditFlag();
            caseViewer.Draw();

            caseViewer.Draw();
        });

        var hideByClick = function () {
            wrapper.blur();
            wrapper.unbind("keydown", hideByKey);
            $('#background').unbind("click", hideByClick);
        };
        var hideByKey = function (e) {
            if (e.keyCode == 27) {
                e.stopPropagation();
                wrapper.blur();
                wrapper.unbind("keydown", hideByKey);
                $('#background').unbind("click", hideByClick);
            }
        };
        $('#background').click(hideByClick);
        wrapper.on("keydown", hideByKey);
        window.setTimeout(function () {
            wrapper.removeClass();
        }, 1300);

        var encoder = new AssureIt.CaseEncoder();
        var encoded = encoder.ConvertToASN(self.RootNodeModel, false);
        self.ASNEditor.setValue(encoded);
        if (self.RootNodeModel.Case.IsEditable()) {
            self.ASNEditor.setOption("readOnly", false);
        } else {
            self.ASNEditor.setOption("readOnly", true);
        }
        self.PaneManager.Refresh();
        self.DScriptViewer.focus();
    };

    DScriptEditorPlugIn.prototype.CreateTable = function (columnNames, initializationData) {
        if (typeof initializationData === "undefined") { initializationData = null; }
        var table = $("<table/>");
        var header = $("<thead/>");
        var body = $("<tbody/>");

        var tr = $("<tr/>");
        for (var i = 0; i < columnNames.length; i++) {
            tr.append($("<th>").text(columnNames[i]));
        }
        header.append(tr);
        table.append(header).append(body);
        $("<div/>").append(table);
        return (table).dataTable(initializationData);
    };

    DScriptEditorPlugIn.prototype.UpdateASNEditor = function (ASNData) {
        if (ASNData != null) {
            this.ASNEditor.setValue(ASNData);
        }
        this.ASNEditor.refresh();
    };
    DScriptEditorPlugIn.prototype.UpdateDScriptViewer = function (script) {
        if (script != null) {
            this.DScriptViewer.setValue(script);
        }
        this.DScriptViewer.refresh();
    };
    DScriptEditorPlugIn.prototype.UpdateNodeRelationTable = function (nodeRelationMap) {
        (this.NodeRelationTable).fnClearTable();
        for (var key in nodeRelationMap) {
            var relation = nodeRelationMap[key];
            var data = [
                relation.BaseNode,
                relation.ReactionsToString(),
                relation.PresumesToString()
            ];
            (this.NodeRelationTable).fnAddData(data);
        }
    };
    DScriptEditorPlugIn.prototype.UpdateActionRelationTable = function (actionRelations) {
        (this.ActionRelationTable).fnClearTable();
        for (var j = 0; j < actionRelations.length; j++) {
            var actionRelation = actionRelations[j];
            var targetNode = actionRelation.GetTargetNode();
            var reactionNodes = actionRelation.GetReactionNodes();
            if (reactionNodes.length == 0) {
                var data = [
                    reactionNode.Environment.Location != null ? reactionNode.Environment.Location : "Undefined",
                    (targetNode.Statement != null ? targetNode.Statement : "NoStatement") + " : " + targetNode.Label,
                    actionRelation.Risk != null ? actionRelation.Risk : "*",
                    "NotExists"
                ];
                (this.ActionRelationTable).fnAddData(data);
            } else {
                for (var i = 0; i < reactionNodes.length; i++) {
                    var reactionNode = reactionNodes[i];
                    var data = [
                        reactionNode.Environment.Location != null ? reactionNode.Environment.Location : "Undefined",
                        (targetNode.Statement != null ? targetNode.Statement : "NoStatement") + " : " + targetNode.Label,
                        actionRelation.Risk != null ? actionRelation.Risk : "*",
                        (reactionNode.GetNote("Action") != null ? reactionNode.GetNote("Action") : "Undefined") + " : " + reactionNode.Label
                    ];
                    (this.ActionRelationTable).fnAddData(data);
                }
            }
        }
    };

    DScriptEditorPlugIn.prototype.DecodeASN = function () {
        var case0 = this.RootNodeModel.Case;
        var origModel = this.RootNodeModel;

        var origIdCounters = case0.ReserveIdCounters(origModel);
        var origElementMap = case0.ReserveElementMap(origModel);

        var decoder = new AssureIt.CaseDecoder();
        var newModel = decoder.ParseASN(case0, this.ASNEditor.getValue(), origModel);

        if (newModel != null) {
            var Parent = origModel.Parent;
            if (Parent != null) {
                newModel.Parent = Parent;
                for (var j in Parent.Children) {
                    if (Parent.Children[j].Label == origModel.Label) {
                        Parent.Children[j] = newModel;
                    }
                }
            } else {
                case0.ElementTop = newModel;
            }
            newModel.EnableEditFlag();
            this.RootNodeModel = newModel;
        } else {
            case0.ElementMap = origElementMap;
            case0.IdCounters = origIdCounters;
        }
    };

    DScriptEditorPlugIn.prototype.UpdateAll = function () {
        var ret = {
            script: {
                main: "",
                lib: {}
            },
            meta: {
                actionmap: {}
            }
        };
        try  {
            this.DecodeASN();
            this.RootNodeModel.UpdateEnvironment();
            var dscriptActionMap = new DScriptActionMap(this.RootNodeModel);
            console.log(dscriptActionMap);
            var nodeRelationMap = dscriptActionMap.GetNodeRelationMap();
            var actionRelations = dscriptActionMap.GetActionRelations();
            var script = this.RootNodeModel.CodeGen(this.Generator);
            ret.script.main = script;

            this.UpdateASNEditor(null);
            this.UpdateDScriptViewer(script);
            this.UpdateNodeRelationTable(nodeRelationMap);
            this.UpdateActionRelationTable(actionRelations);
        } catch (e) {
            console.log("DScript plugin : error occured in UpdateAll");
            console.log(e);
        }
        return ret;
    };
    return DScriptEditorPlugIn;
})(AssureIt.ActionPlugIn);

var DScriptSideMenuPlugIn = (function (_super) {
    __extends(DScriptSideMenuPlugIn, _super);
    function DScriptSideMenuPlugIn(plugInManager, editorPlugIn) {
        _super.call(this, plugInManager);
        this.AssureItAgentAPI = null;
        this.editorPlugIn = editorPlugIn;
    }
    DScriptSideMenuPlugIn.prototype.IsEnabled = function (caseViewer, case0, serverApi) {
        return case0.IsEditable();
    };

    DScriptSideMenuPlugIn.prototype.AddMenus = function (caseViewer, case0, serverApi) {
        var _this = this;
        var ret = [];
        var self = this;
        this.AssureItAgentAPI = new AssureIt.AssureItAgentAPI(serverApi.agentpath);
        ret.push(new AssureIt.SideMenuModel('#', 'Deploy', "deploy", "glyphicon-list-alt", function (ev) {
            self.editorPlugIn.RootNodeModel = case0.ElementTop;
            var data = self.editorPlugIn.UpdateAll();
            var actionNodeManager = caseViewer.pluginManager.GetPlugInEnv("monitor").ActionNodeManager;
            var ElementMap = caseViewer.Source.ElementMap;
            data.script.lib["GetDataFromRec"] = "" + "int GetDataFromRec(String location, String type) {" + "\tcommand rec;\n" + "\tString data = rec -m getLatestData -t $type -l $location;\n" + "\treturn (int)data.replaceAll(\"\\n\", \"\");\n" + "}\n";
            console.log(data);
            for (var label in ElementMap) {
                var nodeModel = ElementMap[label];

                if (isActionNode(nodeModel)) {
                    actionNodeManager.SetActionNode(nodeModel);
                    var actionNode = actionNodeManager.ActionNodeMap[nodeModel.Label];
                    actionNodeManager.RECAPI.pushRawData(actionNode.Location, nodeModel.Label, 0, "test@gmail.com", "");
                }
            }

            try  {
                _this.AssureItAgentAPI.Deploy(data);
            } catch (e) {
                alert("Assure-It Agent is not active.");
                console.log(e);
            }
        }));
        ret.push(new AssureIt.SideMenuModel('#', 'Actions', "actions", "glyphicon-list-alt", function (ev) {
            self.editorPlugIn.ShowEditor(case0.ElementTop);
        }));
        return ret;
    };
    return DScriptSideMenuPlugIn;
})(AssureIt.SideMenuPlugIn);
