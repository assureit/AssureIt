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
    Parser.prototype.Parse = function (source, orig) {
        return null;
    };
    return Parser;
})();

var JsonParser = (function (_super) {
    __extends(JsonParser, _super);
    function JsonParser() {
        _super.apply(this, arguments);
        this.NodeModelMap = {};
    }
    JsonParser.prototype.InitNodeModelMap = function (NodeList) {
        for (var i = 0; i < NodeList.length; i++) {
            this.NodeModelMap[NodeList[i]["Label"]] = NodeList[i];
        }
    };

    JsonParser.prototype.ParseChild = function (childLabel, Parent) {
        var NodeModelData = this.NodeModelMap[childLabel];
        var Type = NodeModelData["NodeType"];
        var Statement = NodeModelData["Statement"];
        var Children = NodeModelData["Children"];
        var NoteData = NodeModelData["Notes"];
        var AnnotationData = NodeModelData["Annotations"];

        var ChildNodeModel = new NodeModel(this.Case, Parent, Type, childLabel, Statement);

        for (var i = 0; i < NoteData.length; i++) {
            var note = new CaseNote(NoteData[i].Name, NoteData[i].Body);
            ChildNodeModel.Notes.push(note);
        }

        for (var i = 0; i < AnnotationData.length; i++) {
            var annotation = new CaseAnnotation(AnnotationData[i].Name, AnnotationData[i].Body);
            ChildNodeModel.Annotations.push(annotation);
        }

        for (var i = 0; i < Children.length; i++) {
            this.ParseChild(Children[i], ChildNodeModel);
        }

        if (Parent == null) {
            return ChildNodeModel;
        } else {
            return Parent;
        }
    };

    JsonParser.prototype.Parse = function (JsonData) {
        var DCaseName = JsonData["DCaseName"];
        var NodeCount = JsonData["NodeCount"];
        var TopGoalLabel = JsonData["TopGoalLabel"];
        var NodeList = JsonData["NodeList"];

        this.InitNodeModelMap(NodeList);

        var root = this.ParseChild(TopGoalLabel, null);

        return root;
    };
    return JsonParser;
})(Parser);

var DCaseLink = (function () {
    function DCaseLink(source, target) {
        this.source = source;
        this.target = target;
    }
    return DCaseLink;
})();

var DCaseXMLParser = (function (_super) {
    __extends(DCaseXMLParser, _super);
    function DCaseXMLParser() {
        _super.apply(this, arguments);
        this.nodes = {};
        this.links = {};
        this.Text2NodeTypeMap = { "Goal": NodeType.Goal, "Strategy": NodeType.Strategy, "Context": NodeType.Context, "Evidence": NodeType.Evidence };
    }
    DCaseXMLParser.prototype.MakeTree = function (Id) {
        var ThisNode = this.nodes[Id];

        for (var LinkId in this.links) {
            var link = this.links[LinkId];

            if (link.source == Id || link.target == Id) {
                var ChildNodeId;

                if (link.source == Id) {
                    ChildNodeId = link.target;
                } else {
                    ChildNodeId = link.source;
                }
                delete this.links[LinkId];

                var ChildNode = this.nodes[ChildNodeId];

                ThisNode.AppendChild(ChildNode);
                this.MakeTree(ChildNodeId);
            }
        }

        return ThisNode;
    };

    DCaseXMLParser.prototype.Parse = function (XMLData) {
        var self = this;
        var IsRootNode = true;

        $(XMLData).find("rootBasicNode").each(function (index, elem) {
            var XsiType = $(this).attr("xsi\:type");

            if (XsiType.split(":").length != 2) {
                OutputError("attr 'xsi:type' is incorrect format");
            }

            var NodeType = XsiType.split(":")[1];
            var Id = $(this).attr("id");
            var Statement = $(this).attr("desc");
            var Label = $(this).attr("name");

            if (IsRootNode) {
                self.RootNodeId = Id;
                IsRootNode = false;
            }

            var node = new NodeModel(self.Case, null, self.Text2NodeTypeMap[NodeType], Label, Statement);
            self.nodes[Id] = node;

            return null;
        });

        $(XMLData).find("rootBasicLink").each(function (index, elem) {
            var Id = $(this).attr("id");
            var source = $(this).attr("source").substring(1);
            var target = $(this).attr("target").substring(1);
            var link = new DCaseLink(source, target);

            self.links[Id] = link;

            return null;
        });

        var root = this.MakeTree(this.RootNodeId);

        return root;
    };
    return DCaseXMLParser;
})(Parser);

var ASNParser = (function (_super) {
    __extends(ASNParser, _super);
    function ASNParser() {
        _super.apply(this, arguments);
        this.Text2NodeTypeMap = { "Goal": NodeType.Goal, "Strategy": NodeType.Strategy, "Context": NodeType.Context, "Evidence": NodeType.Evidence };
    }
    ASNParser.prototype.Object2NodeModel = function (obj, orig) {
        var Case = this.Case;
        var Parent = (obj["Parent"] != null) ? obj["Parent"] : orig.Parent;
        var Type = (obj["Type"] != null) ? this.Text2NodeTypeMap[obj["Type"]] : orig.Type;
        var Label = (obj["Label"] != null) ? obj["Label"] : orig.Label;
        var Statement = (obj["Statement"] != "") ? obj["Statement"] : orig.Statement;

        var Model = new NodeModel(Case, Parent, Type, Label, Statement);

        var Children = obj["Children"];
        if (Children.length != 0) {
            for (var i = 0; i < Children.length; i++) {
                var Child = this.Object2NodeModel(Children[i], orig);
                Child.Parent = Model;
                Model.Children.push(Child);
            }
        } else {
            Model.Children = [];
        }
        if (obj["Annotations"].length != 0) {
            for (var i = 0; i < obj["Annotations"].length; i++) {
                Model.SetAnnotation(obj["Annotations"][i], null);
            }
        } else {
        }
        return Model;
    };
    ASNParser.prototype.Parse = function (ASNData, orig) {
        var obj = Peg.parse(ASNData)[1];
        var root = this.Object2NodeModel(obj, orig);
        return root;
    };
    return ASNParser;
})(Parser);

var CaseDecoder = (function () {
    function CaseDecoder() {
    }
    CaseDecoder.prototype.ParseJson = function (Case, JsonData) {
        var parser = new JsonParser(Case);
        var root = parser.Parse(JsonData, null);
        return root;
    };

    CaseDecoder.prototype.ParseDCaseXML = function (Case, XMLData) {
        var parser = new DCaseXMLParser(Case);
        var root = parser.Parse(XMLData, null);
        return root;
    };

    CaseDecoder.prototype.ParseASN = function (Case, ASNData, orig) {
        var parser = new ASNParser(Case);
        var root = parser.Parse(ASNData, orig);
        return root;
    };
    return CaseDecoder;
})();
