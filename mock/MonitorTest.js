$(function () {
    var serverApi = new AssureIt.ServerAPI('', 'http://54.250.206.119/rec/api/2.0', 'http://localhost:8081');
    var pluginManager = new AssureIt.PlugInManager('');
    pluginManager.SetPlugIn("menu", new MenuBarPlugIn(pluginManager));
    pluginManager.SetPlugIn("scale", new ScalePlugIn(pluginManager));
    pluginManager.SetPlugIn("editor", new EditorPlugIn(pluginManager));
    pluginManager.SetPlugIn("dscript", new DScriptPlugIn(pluginManager));
    pluginManager.SetPlugIn("fullscreeneditor", new FullScreenEditorPlugIn(pluginManager));
    pluginManager.SetPlugIn("colortheme", new TiffanyBlueThemePlugIn(pluginManager));
    pluginManager.SetPlugIn("statements", new DefaultStatementRenderPlugIn(pluginManager));
    pluginManager.SetPlugIn("annotation", new AnnotationPlugIn(pluginManager));
    pluginManager.SetPlugIn("note", new NotePlugIn(pluginManager));
    pluginManager.SetPlugIn("monitor", new MonitorPlugIn(pluginManager));
    pluginManager.SetPlugIn("export", new ExportPlugIn(pluginManager));
    pluginManager.SetPlugIn("portraitlayout", new LayoutPortraitPlugIn(pluginManager));
    pluginManager.SetUseLayoutEngine("portraitlayout");

    var JsonData = {
        "DCaseName": "MonitorSample",
        "NodeCount": 3,
        "TopGoalLabel": "G1",
        "NodeList": [
            {
                "Children": [
                    "E1",
                    "C1"
                ],
                "Statement": "CpuUsage has no problem",
                "NodeType": 0,
                "Label": "G1",
                "Annotations": [],
                "Notes": {}
            },
            {
                "Children": [],
                "Statement": "",
                "NodeType": 1,
                "Label": "C1",
                "Annotations": [],
                "Notes": { "Location": "NodeA" }
            },
            {
                "Children": [],
                "Statement": "",
                "NodeType": 3,
                "Label": "E1",
                "Annotations": [],
                "Notes": { "Monitor": "{ CpuUsage < 30 }" }
            }
        ]
    };

    var Case0 = new AssureIt.Case(JsonData.DCaseName, 1, 0, pluginManager);
    var caseDecoder = new AssureIt.CaseDecoder();
    var root = caseDecoder.ParseJson(Case0, JsonData);

    Case0.SetElementTop(root);

    var backgroundlayer = document.getElementById("background");
    var shapelayer = document.getElementById("layer0");
    var contentlayer = document.getElementById("layer1");
    var controllayer = document.getElementById("layer2");

    var Screen = new AssureIt.ScreenManager(shapelayer, contentlayer, controllayer, backgroundlayer);

    var Viewer = new AssureIt.CaseViewer(Case0, pluginManager, serverApi, Screen);
    Viewer.Draw();
});
