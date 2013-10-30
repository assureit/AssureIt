var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var __dscript__ = {
    script: {
        main: "",
        lib: {},
        funcdef: {}
    },
    meta: {
        actionmap: {}
    }
};
__dscript__.script.funcdef = {
    "PortScanMonitor()": "\n\
print(\"PortScanMonitor called...\");\n\
DFault ret = null;\n\
if (Monitor) {\n\
\tret = null;\n\
}\n\
else {\n\
\tret = fault(Risk);\n\
}\n\
return ret;\n\
",
    "BlockIP()": "\n\
print(\"BlockIP called...\");\n\
DFault ret = null;\n\
command rec, sleep;\n\
int i = 0;\n\
while(i < 10) {\n\
\tprint(\"        *\");\n\
\tsleep 1\n\
\ti += 1;\n\
}\n\
rec -m pushRawData -l ServerA -t IsPortScaned -d 0\n\
return ret;\n\
"
};

var DScriptPlugIn = (function (_super) {
    __extends(DScriptPlugIn, _super);
    function DScriptPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        var editorPlugIn = new DScriptEditorPlugIn(plugInManager);
        this.ActionPlugIn = editorPlugIn;

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

        this.Generator = new DScriptGenerator();

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
        this.NodeRelationTable = this.createTable(["Action", "Risk", "Reaction"], function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
        });
        this.ActionRelationTable = this.createTable(["Location", "Evidence", "Risk", "Reaction"], function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
            if (aData[3].match("Undefined") != null) {
                var $nRow = $(nRow);
                if ($nRow.hasClass("odd")) {
                    $nRow.children().css("background-color", "#FFDDDD");
                } else if ($nRow.hasClass("even")) {
                    $nRow.children().css("background-color", "#FFC4C4");
                }
            }
            return nRow;
        });
        this.ASNEditor.on("change", function (e) {
            self.GenerateCode();
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
        return true;
    };

    DScriptEditorPlugIn.prototype.ShowEditor = function (rootNodeModel) {
        var self = this;
        if (rootNodeModel != null)
            self.RootNodeModel = rootNodeModel;

        var wrapper = $("#dscript-editor-wrapper");
        wrapper.css("display", "block").addClass("animated fadeInDown").focus().one("blur", function (e, node) {
            e.stopPropagation();
            var topNodeModel = self.CaseViewer.ElementTop;
            var topNodeView = self.CaseViewer.ViewMap[self.RootNodeModel.Label];
            self.CaseViewer.DeleteViewsRecursive(topNodeView);
            if (self.RootNodeModel.Parent == null) {
                var caseView = new AssureIt.NodeView(self.CaseViewer, topNodeModel);
                self.CaseViewer.ViewMap[topNodeModel.Label] = caseView;
            }
            self.CaseViewer.Draw();
            wrapper.addClass("animated fadeOutUp");
            window.setTimeout(function () {
                wrapper.removeClass();
                wrapper.css("display", "none");
            }, 1300);
            topNodeModel.EnableEditFlag();
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
        self.GenerateCode();
        self.PaneManager.Refresh();
        self.DScriptViewer.focus();
    };

    DScriptEditorPlugIn.prototype.createTable = function (columnNames, callbackFunc) {
        if (typeof callbackFunc === "undefined") { callbackFunc = null; }
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
        return (table).dataTable({
            fnRowCallback: callbackFunc,
            bAutoWidth: true
        });
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
    DScriptEditorPlugIn.prototype.UpdateNodeRelationTable = function (nodeRelation) {
        (this.NodeRelationTable).fnClearTable();
        for (var key in nodeRelation) {
            var relationMap = nodeRelation[key];
            var data = [
                relationMap["action"],
                relationMap["risk"],
                relationMap["reaction"]
            ];
            (this.NodeRelationTable).fnAddData(data);
        }
    };
    DScriptEditorPlugIn.prototype.UpdateActionRelationTable = function (actionRelation) {
        (this.ActionRelationTable).fnClearTable();
        for (var key in actionRelation) {
            var relationMap = actionRelation[key];
            var data = [
                relationMap["location"],
                relationMap["action"]["func"] + " : " + relationMap["action"]["node"],
                relationMap["risk"],
                relationMap["reaction"]["func"] + " : " + relationMap["reaction"]["node"]
            ];
            (this.ActionRelationTable).fnAddData(data);
        }
    };

    DScriptEditorPlugIn.prototype.GenerateCode = function () {
        var decoder = new AssureIt.CaseDecoder();
        var ASNData = this.ASNEditor.getValue();
        var case0 = this.RootNodeModel.Case;
        var orig_IdCounters = case0.ReserveIdCounters(this.RootNodeModel);
        var orig_ElementMap = case0.ReserveElementMap(this.RootNodeModel);
        var nodeModel = decoder.ParseASN(case0, ASNData, this.RootNodeModel);
        if (nodeModel == null) {
            case0.IdCounters = orig_IdCounters;
            case0.ElementMap = orig_ElementMap;
            nodeModel = case0.ElementTop;
        } else {
            var ParentModel = this.RootNodeModel.Parent;
            if (ParentModel != null) {
                nodeModel.Parent = ParentModel;
                for (var i in ParentModel.Children) {
                    if (ParentModel.Children[i].Label == this.RootNodeModel.Label) {
                        ParentModel.Children[i] = nodeModel;
                    }
                }
            } else {
                this.CaseViewer.ElementTop = nodeModel;
                case0.ElementTop = nodeModel;
            }
        }
        this.RootNodeModel = nodeModel;

        try  {
            nodeModel.UpdateEnvironment();
            var script = this.Generator.CodeGen(nodeModel);
            var dscriptActionMap = new DScriptActionMap(nodeModel);
            var nodeRelation = dscriptActionMap.GetNodeRelation();
            var actionRelation = dscriptActionMap.GetActionRelation();
            __dscript__.script.main = script;
            __dscript__.meta.actionmap = nodeRelation;
            this.UpdateNodeRelationTable(nodeRelation);
            this.UpdateActionRelationTable(actionRelation);

            this.DScriptViewer.setValue(script);
        } catch (e) {
            console.log("error occured in DScript Generation");
            console.log(e);
        }

        this.ASNEditor.refresh();
        this.DScriptViewer.refresh();
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
            self.editorPlugIn.GenerateCode();
            __dscript__.script.lib = {
                "GetDataFromRec.ds": "\n\
int GetDataFromRec(String location, String type) {\n\
command rec;\n\
String data = rec -m getLatestData -t $type -l $location\n\
return (int)data.replaceAll(\"\\n\", \"\");\n\
}\n\
"
            };

            var actionNodeManager = caseViewer.pluginManager.GetPlugInEnv("monitor").ActionNodeManager;
            var ElementMap = caseViewer.Source.ElementMap;
            console.log(__dscript__);
            for (var label in ElementMap) {
                var nodeModel = ElementMap[label];

                if (isActionNode(nodeModel)) {
                    actionNodeManager.SetActionNode(nodeModel);
                    var actionNode = actionNodeManager.ActionNodeMap[nodeModel.Label];
                    actionNodeManager.RECAPI.pushRawData(actionNode.Location, nodeModel.Label, 0, "test@gmail.com", "");
                }
            }

            try  {
                _this.AssureItAgentAPI.Deploy(__dscript__);
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
