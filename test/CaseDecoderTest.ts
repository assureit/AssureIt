/// <reference path="../d.ts/qunit.d.ts" />
/// <reference path="../src/CaseDecoder.ts" />

function Check_CaseDecoder_ParseJson() : boolean {
	var JsonData : any = {
			"DCaseName" : "test",
			"NodeCount" : 6,
			"TopGoalLabel" : "G1",
			"NodeList": [
				{
					"Children": [
						"S1"
					],
					"Statement": "",
					"NodeType": 0,
					"Label": "G1",
					"Annotations" : [],
					"Notes" : []
				},
				{
					"Children": [
						"G2",
						"G3"
					],
					"Statement": "",
					"NodeType": 2,
					"Label": "S1",
					"Annotations" : [],
					"Notes" : []
				},
				{
					"Children": [
						"E1",
					],
					"Statement": "",
					"NodeType": 0,
					"Label": "G2",
					"Annotations" : [],
					"Notes" : []
				},
				{
					"Children": [
						"E2",
					],
					"Statement": "",
					"NodeType": 0,
					"Label": "G3",
					"Annotations" : [],
					"Notes" : []
				},
				{
					"Children": [],
					"Statement": "",
					"NodeType": 3,
					"Label": "E1",
					"Annotations" : [],
					"Notes" : []
				},
				{
					"Children": [],
					"Statement": "",
					"NodeType": 3,
					"Label": "E2",
					"Annotations" : [],
					"Notes" : []
				},
			]
	}

	var TestCase : AssureIt.Case        = new AssureIt.Case(JsonData.DCaseName, {}, "", 0, 0, null);
	var decoder  : AssureIt.CaseDecoder = new AssureIt.CaseDecoder();
	var root     : AssureIt.NodeModel   = decoder.ParseJson(TestCase, JsonData);

	if("G1" != root.Label) return false;

	var child = root.Children[0];
	if("S1" != child.Label) return false;

	var grandchildren = child.Children;
	if(grandchildren.length != 2) return false;

	for(var i = 0; i < grandchildren.length; i++) {
		if(grandchildren[i].Label == "G2") {
			if("E1" != grandchildren[i].Children[0].Label) return false;
		}
		else if(grandchildren[i].Label == "G3") {
			if("E2" != grandchildren[i].Children[0].Label) return false;
		}
	}

	return true;
}

function Check_CaseDecoder_ParseDCaseXML() : boolean {
    var XMLData = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + "<dcase:Argument xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:dcase=\"http://www.dependable-os.net/2010/03/dcase/\" id=\"_6A0EENScEeKCdP-goLYu9g\">\n" + "  <rootBasicNode xsi:type=\"dcase:Goal\" id=\"_AgdoENSdEeKCdP-goLYu9g\" name=\"G_1\"/>\n" + "  <rootBasicNode xsi:type=\"dcase:Strategy\" id=\"_Gs7KUNSdEeKCdP-goLYu9g\" name=\"S_1\" desc=\"this  is  the  first strategy \"/>\n" + "  <rootBasicNode xsi:type=\"dcase:Evidence\" id=\"_4e3eQNSeEeKCdP-goLYu9g\" name=\"E_1\" desc=\"Evidence to show G_2 is correct\"/>\n" + "  <rootBasicNode xsi:type=\"dcase:Goal\" id=\"_G_9TsNSgEeKCdP-goLYu9g\" name=\"G_2\" desc=\"Second Goal \"/>\n" + "  <rootBasicNode xsi:type=\"dcase:Goal\" id=\"_eyfUwNSgEeKCdP-goLYu9g\" name=\"G_3\" desc=\"Third Goal\"/>\n" + "  <rootBasicLink xsi:type=\"dcase:DcaseLink003\" id=\"_1E1AUNSeEeKCdP-goLYu9g\" source=\"#_Gs7KUNSdEeKCdP-goLYu9g\" target=\"#_AgdoENSdEeKCdP-goLYu9g\" name=\"LINK_1\"/>\n" + "  <rootBasicLink xsi:type=\"dcase:DcaseLink003\" id=\"_LDZ7ANSgEeKCdP-goLYu9g\" source=\"#_G_9TsNSgEeKCdP-goLYu9g\" target=\"#_4e3eQNSeEeKCdP-goLYu9g\" name=\"LINK_2\"/>\n" + "  <rootBasicLink xsi:type=\"dcase:DcaseLink003\" id=\"_NqvwsNSgEeKCdP-goLYu9g\" source=\"#_G_9TsNSgEeKCdP-goLYu9g\" target=\"#_Gs7KUNSdEeKCdP-goLYu9g\" name=\"LINK_3\"/>\n" + "  <rootBasicLink xsi:type=\"dcase:DcaseLink003\" id=\"_i2-d4NSgEeKCdP-goLYu9g\" source=\"#_eyfUwNSgEeKCdP-goLYu9g\" target=\"#_Gs7KUNSdEeKCdP-goLYu9g\" name=\"LINK_4\"/>\n" + "</dcase:Argument>";

	var TestCase : AssureIt.Case        = new AssureIt.Case("test", {}, "", 0, 0, null);
	var decoder  : AssureIt.CaseDecoder = new AssureIt.CaseDecoder();
	var root     : AssureIt.NodeModel   = decoder.ParseDCaseXML(TestCase, XMLData);

	if("G_1" != root.Label) return false;

	var child = root.Children[0];
	if("S_1" != child.Label) return false;

	var grandchildren = child.Children;
	if(grandchildren.length != 2) return false;

	for(var i = 0; i < grandchildren.length; i++) {
		if(grandchildren[i].Label == "G_2") {
			if("E_1" != grandchildren[i].Children[0].Label) return false;
		}
	}

	return true;
}

test("CaseDecoder", (assert? : QUnitAssert) : any => {
	ok(Check_CaseDecoder_ParseJson(), "ParseJson");
	ok(Check_CaseDecoder_ParseJson(), "ParseDCaseXML");
});
