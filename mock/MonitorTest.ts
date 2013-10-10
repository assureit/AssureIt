/// <reference path="../src/CaseModel.ts" />
/// <reference path="../src/CaseDecoder.ts" />
/// <reference path="../src/CaseEncoder.ts" />
/// <reference path="../src/CaseViewer.ts" />
/// <reference path="../src/Converter.ts" />
/// <reference path="../src/ServerApi.ts" />
/// <reference path="../plugins/MenuBar/MenuBar.ts" />
/// <reference path="../plugins/Scale/Scale.ts" />
/// <reference path="../plugins/Editor/Editor.ts" />
/// <reference path="../plugins/DScript/DScript.ts" />
/// <reference path="../plugins/FullScreenEditor/FullScreenEditor.ts" />
/// <reference path="../plugins/DefaultStatementRender/DefaultStatementRender.ts" />
/// <reference path="../plugins/LayoutPortrait/LayoutPortrait.ts" />
/// <reference path="../plugins/Annotation/Annotation.ts" />
/// <reference path="../plugins/Monitor/Monitor.ts" />
/// <reference path="../plugins/Note/Note.ts" />
/// <reference path="../plugins/ColorTheme/ColorTheme.ts" />
/// <reference path="../plugins/Export/Export.ts" />
/// <reference path="../d.ts/jquery.d.ts" />

$(function () {

	var serverApi = new AssureIt.ServerAPI('', 'http://54.250.206.119/rec/api/2.0', 'http://localhost:8081'); //TODO config for Path
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

	/*
	var oldJsonData = serverApi.GetCase("",96);
	var converter = new AssureIt.Converter();
	var JsonData = converter.GenNewJson(oldJsonData);
	*/

	//var JsonData = {
	//	"DCaseName": "test",
	//	"NodeCount": 25,
	//	"TopGoalLabel": "G1",
	//	"NodeList": [
	//		{
	//			"Children": [
	//				"S1",
	//				"C1"
	//			],
	//			"Statement": "",
	//			"NodeType": 0,
	//			"Label": "G1",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//			],
	//			"Statement": "",
	//			"NodeType": 1,
	//			"Label": "C1",
	//			"Annotations": [{"Name" : "Def", "Body" : "a = 1"}],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//				"G2",
	//				"G3"
	//			],
	//			"Statement": "",
	//			"NodeType": 2,
	//			"Label": "S1",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//				"S2"
	//			],
	//			"Statement": "",
	//			"NodeType": 0,
	//			"Label": "G2",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//				"G4",
	//				"G5",
	//				"G6",
	//				"C3"
	//			],
	//			"Statement": "",
	//			"NodeType": 2,
	//			"Label": "S2",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//				"E1"
	//			],
	//			"Statement": "Hoge",
	//			"NodeType": 0,
	//			"Label": "G4",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//				"C2",
	//				"E2",
	//				"E3"
	//			],
	//			"Statement": "",
	//			"NodeType": 0,
	//			"Label": "G5",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//				"E4"
	//			],
	//			"Statement": "",
	//			"NodeType": 0,
	//			"Label": "G6",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//			],
	//			"Statement": "",
	//			"NodeType": 3,
	//			"Label": "E1",
	//			"Annotations": [],
	//			"Notes": [
	//			{
	//				"Name": "Monitor",
	//				"Body": {
	//					"Description": "rec(1)"
	//				}
	//			}
	//				]
	//		},
	//		{
	//			"Children": [
	//			],
	//			"Statement": "",
	//			"NodeType": 1,
	//			"Label": "C2",
	//			"Annotations": [{"Name" : "Def", "Body" : "a = 2"}],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//				"C4"
	//			],
	//			"Statement": "",
	//			"NodeType": 3,
	//			"Label": "E2",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//			],
	//			"Statement": "",
	//			"NodeType": 1,
	//			"Label": "C4",
	//			"Annotations": [{"Name" : "Def", "Body" : "a = 4"}],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//			],
	//			"Statement": "",
	//			"NodeType": 1,
	//			"Label": "C3",
	//			"Annotations": [{"Name" : "Def", "Body" : "a = 3"}],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//			],
	//			"Statement": "",
	//			"NodeType": 3,
	//			"Label": "E3",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//			],
	//			"Statement": "",
	//			"NodeType": 3,
	//			"Label": "E4",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//				"S3"
	//			],
	//			"Statement": "",
	//			"NodeType": 0,
	//			"Label": "G3",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//				"G7",
	//				"G8",
	//				"G9"
	//			],
	//			"Statement": "",
	//			"NodeType": 2,
	//			"Label": "S3",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//				"C5",
	//				"E5",
	//				"E6",
	//			],
	//			"Statement": "",
	//			"NodeType": 0,
	//			"Label": "G7",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//			],
	//			"Statement": "",
	//			"NodeType": 3,
	//			"Label": "E5",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//			],
	//			"Statement": "",
	//			"NodeType": 3,
	//			"Label": "E6",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//			],
	//			"Statement": "",
	//			"NodeType": 1,
	//			"Label": "C5",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//				"C6",
	//				"E7"
	//			],
	//			"Statement": "",
	//			"NodeType": 0,
	//			"Label": "G8",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//			],
	//			"Statement": "",
	//			"NodeType": 0,
	//			"Label": "G9",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//			],
	//			"Statement": "",
	//			"NodeType": 1,
	//			"Label": "C6",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//		{
	//			"Children": [
	//			],
	//			"Statement": "",
	//			"NodeType": 3,
	//			"Label": "E7",
	//			"Annotations": [],
	//			"Notes": []
	//		},
	//	]
	//}

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
				"Children": [
				],
				"Statement": "",
				"NodeType": 1,
				"Label": "C1",
				"Annotations": [],
				"Notes": { "Location": "NodeA" }
			},
			{
				"Children": [
				],
				"Statement": "",
				"NodeType": 3,
				"Label": "E1",
				"Annotations": [],
				"Notes": { "Monitor": "{ CpuUsage < 30 }" }
			}
		]
	};

	var Case0: AssureIt.Case = new AssureIt.Case(JsonData.DCaseName, {}, "", 1, 0, pluginManager);
	var caseDecoder: AssureIt.CaseDecoder = new AssureIt.CaseDecoder();
	var root: AssureIt.NodeModel = caseDecoder.ParseJson(Case0, JsonData);

	Case0.SetElementTop(root);

	var backgroundlayer = <HTMLDivElement>document.getElementById("background");
	var shapelayer = <SVGGElement><any>document.getElementById("layer0");
	var contentlayer = <HTMLDivElement>document.getElementById("layer1");
	var controllayer = <HTMLDivElement>document.getElementById("layer2");

	var Screen = new AssureIt.ScreenManager(shapelayer, contentlayer, controllayer, backgroundlayer);

	var Viewer = new AssureIt.CaseViewer(Case0, pluginManager, serverApi, Screen);
	Viewer.Draw();
});

