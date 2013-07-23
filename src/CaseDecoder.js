var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
function OutputError(o) {
    console.log("error: " + o);
}

var Parser = (function () {
    function Parser(Case) {
        this.Case = Case;
    }
    Parser.prototype.parse = function (source) {
        return null;
    };
    return Parser;
})();

var JsonParser = (function (_super) {
    __extends(JsonParser, _super);
    function JsonParser() {
        _super.apply(this, arguments);
        this.caseModelMap = {};
    }
    JsonParser.prototype.initCaseModelMap = function (NodeList) {
        for (var i = 0; i < NodeList.length; i++) {
            this.caseModelMap[NodeList[i]["Label"]] = NodeList[i];
        }
    };

    JsonParser.prototype.parseChild = function (childLabel, Parent) {
        var caseModelData = this.caseModelMap[childLabel];
        var Type = caseModelData["NodeType"];
        var Statement = caseModelData["Statement"];
        var Children = caseModelData["Children"];
        var Notes = caseModelData["Notes"];
        var Annotations = caseModelData["Annotations"];

        var childCaseModel = new CaseModel(this.Case, Parent, Type, childLabel, Statement);

        for (var i = 0; i < Children.length; i++) {
            this.parseChild(Children[i], childCaseModel);
        }

        if (Parent == null) {
            return childCaseModel;
        } else {
            return Parent;
        }
    };

    JsonParser.prototype.parse = function (source) {
        var JsonData = source;
        var DCaseName = JsonData["DCaseName"];
        var NodeCount = JsonData["NodeCount"];
        var TopGoalLabel = JsonData["TopGoalLabel"];
        var NodeList = JsonData["NodeList"];

        this.initCaseModelMap(NodeList);

        var root = this.parseChild(TopGoalLabel, null);

        return root;
    };
    return JsonParser;
})(Parser);

var MarkcaseParser = (function (_super) {
    __extends(MarkcaseParser, _super);
    function MarkcaseParser() {
        _super.apply(this, arguments);
    }
    MarkcaseParser.prototype.parse = function (source) {
        var MarkCase = source;
        return null;
    };
    return MarkcaseParser;
})(Parser);

var CaseDecoder = (function () {
    function CaseDecoder() {
    }
    CaseDecoder.prototype.ParseJson = function (Case, JsonData) {
        var jsonParser = new JsonParser(Case);
        var root = jsonParser.parse(JsonData);
        return root;
    };

    CaseDecoder.prototype.ParseDCaseXML = function (Case, XML) {
        return null;
    };

    CaseDecoder.prototype.ParseMarkCase = function (Case, MarkCase) {
        return null;
    };
    return CaseDecoder;
})();
