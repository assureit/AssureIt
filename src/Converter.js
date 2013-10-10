var AssureIt;
(function (AssureIt) {
    var Converter = (function () {
        function Converter() {
            this.NewNodeMap = {};
            this.OldNodeMap = {};
        }
        Converter.prototype.ConvertOldNodeTypetoNewNodeType = function (newNodeListData, oldNodeListData) {
            if (oldNodeListData.NodeType == "Goal") {
                newNodeListData.NodeType = 0;
            } else if (oldNodeListData.NodeType == "Context") {
                newNodeListData.NodeType = 1;
            } else if (oldNodeListData.NodeType == "Strategy") {
                newNodeListData.NodeType = 2;
            } else {
                newNodeListData.NodeType = 3;
            }
        };

        Converter.prototype.ConvertOldNodeListtoNewNodeList = function (newNodeListData, oldNodeListData) {
            var n = oldNodeListData.Children.length;
            for (var i = 0; i < n; i++) {
                newNodeListData.Children.push(this.OldNodeMap[oldNodeListData.Children[i]]);
            }
            if (oldNodeListData.Contexts != null && !(oldNodeListData.Contexts instanceof Array)) {
                newNodeListData.Children.push(this.OldNodeMap[oldNodeListData.Contexts]);
            }
            this.ConvertOldNodeTypetoNewNodeType(newNodeListData, oldNodeListData);
            newNodeListData.Statement = oldNodeListData.Description;
            newNodeListData.Label = this.OldNodeMap[oldNodeListData.ThisNodeId];

            if (oldNodeListData.MetaData != null) {
                n = oldNodeListData.MetaData.length;
                for (var i = 0; i < n; i++) {
                    var json = {
                        "Name": "",
                        "Body": {}
                    };

                    var MetaDataKeys = Object.keys(oldNodeListData.MetaData[i]);
                    for (var j = 0; j < MetaDataKeys.length; j++) {
                        if (MetaDataKeys[j] == "Type") {
                            json.Name = oldNodeListData.MetaData[i][MetaDataKeys[j]];
                            continue;
                        }
                        json.Body[MetaDataKeys[j]] = oldNodeListData.MetaData[i][MetaDataKeys[j]];
                    }
                    newNodeListData.Notes.push(json);
                }
            }
        };

        Converter.prototype.SetOldNodeMap = function (oldJsonData) {
            var NodeList = oldJsonData.contents.NodeList;
            var n = NodeList.length;
            for (var i = 0; i < n; i++) {
                if (NodeList[i].NodeType == "Goal") {
                    this.OldNodeMap[NodeList[i].ThisNodeId] = "G" + String(NodeList[i].ThisNodeId);
                } else if (NodeList[i].NodeType == "Context") {
                    this.OldNodeMap[NodeList[i].ThisNodeId] = "C" + String(NodeList[i].ThisNodeId);
                } else if (NodeList[i].NodeType == "Strategy") {
                    this.OldNodeMap[NodeList[i].ThisNodeId] = "S" + String(NodeList[i].ThisNodeId);
                } else {
                    this.OldNodeMap[NodeList[i].ThisNodeId] = "E" + String(NodeList[i].ThisNodeId);
                }
            }
        };

        Converter.prototype.GetPrefix = function (id, list) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].ThisNodeId == id) {
                    return list[i].NodeType.slice(0, 1);
                }
            }
            return "G";
        };

        Converter.prototype.GenNewJson = function (oldJsonData) {
            oldJsonData.contents = JSON.parse(oldJsonData.contents);
            this.SetOldNodeMap(oldJsonData);
            var newJsonData = {
                "DCaseName": "",
                "NodeCount": 0,
                "TopGoalLabel": "",
                "NodeList": []
            };

            newJsonData["DCaseName"] = oldJsonData.contents.DCaseName;
            newJsonData["NodeCount"] = oldJsonData.contents.NodeCount;
            newJsonData["TopGoalLabel"] = this.GetPrefix(oldJsonData.contents.TopGoalId, oldJsonData.contents.NodeList) + String(oldJsonData.contents.TopGoalId);
            var n = oldJsonData.contents.NodeList.length;
            for (var i = 0; i < n; i++) {
                var NodeListData = {
                    "Children": [],
                    "Statement": "",
                    "NodeType": 0,
                    "Label": "",
                    "Annotations": [],
                    "Notes": []
                };
                newJsonData.NodeList.push(NodeListData);
                var newNodeListData = newJsonData.NodeList[i];
                var oldNodeListData = oldJsonData.contents.NodeList[i];
                this.ConvertOldNodeListtoNewNodeList(newNodeListData, oldNodeListData);
            }
            return newJsonData;
        };

        Converter.prototype.SetNewNodeMap = function (newJsonData) {
            var NodeList = newJsonData.NodeList;
            var n = NodeList.length;
            for (var i = 0; i < n; i++) {
                this.NewNodeMap[NodeList[i].Label] = i + 1;
            }
        };

        Converter.prototype.ConvertNewNodeTypetoOldNodeType = function (newNodeListData, oldNodeListData) {
            if (newNodeListData.Type == 0) {
                oldNodeListData.NodeType = "Goal";
            } else if (newNodeListData.Type == 1) {
                oldNodeListData.NodeType = "Context";
            } else if (newNodeListData.Type == 2) {
                oldNodeListData.NodeType = "Strategy";
            } else {
                oldNodeListData.NodeType = "Evidence";
            }
        };

        Converter.prototype.ConvertNewNodeListtoOldNodeList = function (newNodeListData, oldNodeListData) {
            var n = newNodeListData.Children.length;
            for (var i = 0; i < n; i++) {
                oldNodeListData.Children.push(this.NewNodeMap[newNodeListData.Children[i]]);
            }
            this.ConvertNewNodeTypetoOldNodeType(newNodeListData, oldNodeListData);
            oldNodeListData.Description = newNodeListData.Statement;
            oldNodeListData.ThisNodeId = this.NewNodeMap[newNodeListData.Label];
            oldNodeListData.Contexts = newNodeListData.Annotation;
            n = newNodeListData.Notes.length;
            for (var i = 0; i < n; i++) {
                var json = {
                    "Type": ""
                };
                json.Type = newNodeListData.Notes[i].Name;
                var bodyKeys = Object.keys(newNodeListData.Notes[i].Body);
                for (var j = 0; j < bodyKeys.length; j++) {
                    json[bodyKeys[j]] = newNodeListData.Notes[i].Body[bodyKeys[j]];
                }
                oldNodeListData.MetaData.push(json);
            }
        };

        Converter.prototype.GenOldJson = function (newJsonData) {
            this.SetNewNodeMap(newJsonData);
            var oldJsonData = {
                "NodeList": [],
                "TopGoalId": 0,
                "NodeCount": 0,
                "DCaseName": ""
            };

            oldJsonData.DCaseName = newJsonData.DCaseName;
            oldJsonData.NodeCount = newJsonData.NodeCount;
            oldJsonData.TopGoalId = this.NewNodeMap[newJsonData.TopGoalLabel];
            var n = newJsonData.NodeList.length;
            for (var i = 0; i < n; i++) {
                var NodeListData = {
                    "ThisNodeId": 0,
                    "NodeType": "",
                    "Description": "",
                    "Children": [],
                    "Contexts": [],
                    "MetaData": []
                };
                oldJsonData.NodeList.push(NodeListData);
                var newNodeListData = newJsonData.NodeList[i];
                var oldNodeListData = oldJsonData.NodeList[i];
                this.ConvertNewNodeListtoOldNodeList(newNodeListData, oldNodeListData);
            }
            return oldJsonData;
        };
        return Converter;
    })();
    AssureIt.Converter = Converter;
})(AssureIt || (AssureIt = {}));
