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
    "PortMonitor()": "\n\
print(\"PortMonitor called...\");\n\
DFault ret = null;\n\
if (Monitor) {\n\
\tret = null;\n\
}\n\
else {\n\
\tret = fault(\"Computer is accessed by someone\");\n\
}\n\
return ret;\n\
",
    "BlockIP()": "\n\
print(\"BlockIP called...\");\n\
DFault ret = null;\n\
//    command iptables;\n\
//try {\n\
//    iptables -A INPUT -p tcp -s $ip --dport $port -j DROP\n\
//}\n\
//catch (Exception e) {\n\
//}\n\
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
        return true;
    };

    DScriptMenuPlugIn.prototype.Delegate = function (caseViewer, nodeModel, element, serverApi) {
        element.append('<a href="#" ><img id="dscript"  src="' + serverApi.basepath + 'images/dse.png" title="DScript" alt="dscript" /></a>');
        $('#dscript').unbind('click');
        $('#dscript').bind('click', {
            editorPlugIn: this.editorPlugIn,
            nodeModel: nodeModel
        }, this.editorPlugIn.ShowEditor);
        return true;
    };
    return DScriptMenuPlugIn;
})(AssureIt.MenuBarContentsPlugIn);

var DScriptEditorPlugIn = (function (_super) {
    __extends(DScriptEditorPlugIn, _super);
    function DScriptEditorPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        var self = this;

        this.Widgets = [];
        this.ASNEditor = new CodeMirror($("<div/>").get(0), {
            lineNumbers: true,
            mode: "text/x-csrc",
            lineWrapping: true
        });
        this.DScriptEditor = new CodeMirror($("<div/>").get(0), {
            lineNumbers: true,
            mode: "text/x-csrc",
            readOnly: true,
            placeholder: "Generated DScript code goes here.",
            lineWrapping: true
        });
        this.NodeRelationTable = this.createTable(["action", "risk", "reaction"]);
        this.ActionRelationTable = this.createTable(["location", "action", "risk", "reaction"]);
        this.Highlighter = new ErrorHighlight(this.ASNEditor);

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
        paneManager.AddToOptionsList($(this.DScriptEditor.getWrapperElement()), "DScript Viewer", false);
        paneManager.AddToOptionsList(this.NodeRelationTable.parent(), "Node Relation Table", false, true);
        paneManager.AddToOptionsList(this.ActionRelationTable.parent(), "Action Relation Table", false, true);
        paneManager.SetRefreshFunc(function () {
            self.ASNEditor.refresh();
            self.DScriptEditor.refresh();
        });
        this.PaneManager = paneManager;
    }
    DScriptEditorPlugIn.prototype.Delegate = function (caseViewer, case0, serverApi) {
        this.RootNodeModel = case0.ElementTop;
        this.CaseViewer = caseViewer;
        return true;
    };

    DScriptEditorPlugIn.prototype.ShowEditor = function (ev) {
        var self = ev.data.editorPlugIn;
        self.RootNodeModel = ev.data.nodeModel;
        var encoder = new AssureIt.CaseEncoder();
        var encoded = encoder.ConvertToASN(self.RootNodeModel, false);
        self.ASNEditor.setValue(encoded);
        if (ev.data.nodeModel.Case.IsEditable()) {
            self.ASNEditor.setOption("readOnly", false);
        } else {
            self.ASNEditor.setOption("readOnly", true);
        }

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
            var centeringNodeView = self.CaseViewer.ViewMap[self.RootNodeModel.Label];
            self.CaseViewer.Screen.SetCaseCenter(centeringNodeView.AbsX, centeringNodeView.AbsY, centeringNodeView.HTMLDoc);

            wrapper.addClass("animated fadeOutUp");
            window.setTimeout(function () {
                wrapper.removeClass();
                wrapper.css("display", "none");
            }, 1300);
            topNodeModel.EnableEditFlag();
        }).on("keydown", function (e) {
            if (e.keyCode == 27) {
                e.stopPropagation();
                wrapper.blur();
                wrapper.unbind('keydown');
            }
        });
        $('#CodeMirror').focus();
        $('#background').click(function () {
            wrapper.blur();
        });
        window.setTimeout(function () {
            wrapper.removeClass();
        }, 1300);
        self.ASNEditor.refresh();
        self.DScriptEditor.refresh();
        self.GenerateCode();
    };

    DScriptEditorPlugIn.prototype.createTable = function (columnNames) {
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
        return (table).dataTable();
    };

    DScriptEditorPlugIn.prototype.UpdateNodeRelationTable = function (nodeRelation) {
        (this.NodeRelationTable).fnClearTable();
        for (var key in nodeRelation) {
            var relationMap = nodeRelation[key];
            var data = [
                relationMap["action"],
                "*",
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
                relationMap["action"]["node"] + ":" + relationMap["action"]["func"],
                relationMap["risk"],
                relationMap["reaction"]["node"] + ":" + relationMap["reaction"]["func"]
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
            this.Highlighter.Highlight(decoder.GetASNError().line, decoder.GetASNError().toString());
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
        this.Highlighter.ClearHighlight();

        try  {
            nodeModel.UpdateEnvironment();
            var generator = new DScriptGenerator();
            var script = generator.CodeGen(nodeModel);
            var dscriptActionMap = new DScriptActionMap(nodeModel);
            var nodeRelation = dscriptActionMap.GetNodeRelation();
            var actionRelation = dscriptActionMap.GetActionRelation();
            __dscript__.script.main = script;
            __dscript__.meta.actionmap = nodeRelation;
            this.UpdateNodeRelationTable(nodeRelation);
            this.UpdateActionRelationTable(actionRelation);

            this.DScriptEditor.setValue(script);
        } catch (e) {
            console.log("error occured in DScript Generation");
            console.log(e);
        }

        this.ASNEditor.refresh();
        this.DScriptEditor.refresh();
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

    DScriptSideMenuPlugIn.prototype.AddMenu = function (caseViewer, case0, serverApi) {
        var _this = this;
        this.AssureItAgentAPI = new AssureIt.AssureItAgentAPI(serverApi.agentpath);
        var self = this;
        return new AssureIt.SideMenuModel('#', 'Deploy', "deploy", "glyphicon-list-alt", function (ev) {
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

            try  {
                _this.AssureItAgentAPI.Deploy(__dscript__);
            } catch (e) {
                alert("Assure-It Agent is not active.");
                console.log(e);
            }
            caseViewer.pluginManager.GetPlugInEnv("monitor").MonitorManager.RemoveAllMonitor();
        });
    };
    return DScriptSideMenuPlugIn;
})(AssureIt.SideMenuPlugIn);
