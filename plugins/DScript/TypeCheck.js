DScriptEditorPlugIn.prototype.TypeCheck = function() {
	var dummy_decl = "class DFault {};\nlet LOCATION = \"UnKnown\";\n";
	var src = this.DScriptViewer.getValue();
	try{
		LibGreenTea.Program = "";
		LibGreenTea.WriteCode = function(OutputFile, SourceCode) {
			this.Program = this.Program + SourceCode;
		};
//		var Generator = LibGreenTea.CodeGenerator(PlayGround_CodeGenTarget, "-", 0);
		LibGreenTea.ErrorMsg = "";
		var Generator = LibGreenTea.CodeGenerator("js", "-", 0);
		var Context = new GtParserContext(new KonohaGrammar(), Generator);
		DebugPrintOption = true;
		Context.TopLevelNameSpace.Eval(dummy_decl + src);
		Generator.FlushBuffer();
		//var generatedCode = LibGreenTea.Program;
		var error = Context.GetReportedErrors().join("\n") + LibGreenTea.ErrorMsg;
		if (error == "") {
			this.DScriptViewer.setValue(src + "\n/*\nNo Error\n*/");
		}
		else {
			this.DScriptViewer.setValue(src + "\n/*\n" + error + "\n*/\n");
		}
	} catch(e) {
		var error = e.toString();
		if (Context) {
			error = "JavaScript Error:\n" + error + "\n----\n" + Context.GetReportedErrors().join("<br>");
		}
		this.DScriptViewer.setValue(src + "\n/*\n" + error + "\n*/\n");
	}
}
