var DScriptActionMap = (function () {
    function DScriptActionMap(root) {
        this.NodeRelations = [];
        this.ActionRelation = {};
        this.RootNode = root;
        this.ErrorInfo = [];
        this.ElementMap = this.CreateLocalElementMap(root);
        this.ExtractRelation();
    }
    DScriptActionMap.prototype.CreateLocalElementMap = function (root) {
        var ret = {};
        var list = this.ExtractNode(root, function (node) {
            return true;
        }, -1, AssureIt.Direction.Bottom);
        for (var i = 0; i < list.length; i++) {
            var node = list[i];
            ret[node.Label] = node;
        }
        return ret;
    };

    DScriptActionMap.CreateNodeRelation = function (src, dist, type) {
        var ret = {};
        if (src != null) {
            ret["node"] = src.Label;
        } else {
            ret["node"] = "*";
        }
        if (dist != null) {
            ret[type] = dist.Label;
        } else {
            ret[type] = "*";
        }
        return ret;
    };

    DScriptActionMap.prototype.AddNodeRelation = function (relation) {
        this.NodeRelations.push(relation);
    };

    DScriptActionMap.prototype.ExtractNode = function (root, thFunc, maxDepth, dir) {
        var ret = [];
        if (maxDepth != 0) {
            var searchList;
            if (dir == AssureIt.Direction.Top) {
                searchList = [root.Parent];
            } else if (dir == AssureIt.Direction.Bottom) {
                searchList = root.Children;
            } else if (dir == null) {
                searchList = root.Children.concat(root.Parent);
            } else {
                searchList = [];
            }
            for (var i = 0; i < searchList.length; i++) {
                ret = ret.concat(this.ExtractNode(searchList[i], thFunc, maxDepth - 1, dir));
            }
        }
        if (thFunc.call(this, root)) {
            ret = ret.concat(root);
        }
        return ret;
    };

    DScriptActionMap.prototype.ExtractReactionRelation = function () {
        var reactionNodes = this.ExtractNode(this.RootNode, function (node) {
            var ret = false;
            if (node.GetNote("Reaction") != null) {
                if (node.Type == AssureIt.NodeType.Context) {
                    ret = true;
                } else {
                    this.ErrorInfo.push("node ${LABEL} is not Context, but has Reaction info (ignored)".replace("${LABEL}", node.Label));
                }
            }
            return ret;
        }, -1, AssureIt.Direction.Bottom);

        for (var i = 0; i < reactionNodes.length; i++) {
            var reactionNode = reactionNodes[i];
            var reactionValue = reactionNode.GetNote("Reaction");
            var src = this.ElementMap[reactionValue];
            var dist = reactionNode.Parent;
            if (src != null) {
                var relation = DScriptActionMap.CreateNodeRelation(src, dist, "reaction");
                this.AddNodeRelation(relation);
            } else {
                var srcList = this.ExtractNode(this.RootNode, function (node) {
                    var ret = false;
                    if (node.Type == AssureIt.NodeType.Evidence && node.Environment["Risk"] == reactionValue)
                        ret = true;
                    return ret;
                }, -1, AssureIt.Direction.Bottom);
                if (srcList.length == 0) {
                    this.ErrorInfo.push("invalid Reaction target ${TARGET} (ignored)".replace("${TARGET}", reactionValue));
                } else {
                    for (var j = 0; j < srcList.length; j++) {
                        var relation = DScriptActionMap.CreateNodeRelation(srcList[j], dist, "reaction");
                        this.AddNodeRelation(relation);
                    }
                }
            }
        }
    };
    DScriptActionMap.prototype.ExtractPresumeRelation = function () {
        var presumeNodes = this.ExtractNode(this.RootNode, function (node) {
            var ret = false;
            if (node.GetNote("Presume") != null) {
                if (node.Type == AssureIt.NodeType.Context) {
                    ret = true;
                } else {
                    this.ErrorInfo.push("node ${LABEL} is not Context, but has Presume info (ignored)".replace("${LABEL}", node.Label));
                }
            }
            return ret;
        }, -1, AssureIt.Direction.Bottom);

        for (var i = 0; i < presumeNodes.length; i++) {
            var presumeNode = presumeNodes[i];
            var presumeValue = presumeNode.GetNote("Presume");
            var src = this.ElementMap[presumeValue];
            var dist = presumeNode.Parent;
            if (src != null) {
                var relation = DScriptActionMap.CreateNodeRelation(src, dist, "presume");
                this.AddNodeRelation(relation);
            } else {
                this.ErrorInfo.push("invalid Presume target ${TARGET} (ignored)".replace("${TARGET}", presumeValue));
            }
        }
    };
    DScriptActionMap.prototype.ExtractRelation = function () {
        this.ExtractReactionRelation();
        this.ExtractPresumeRelation();
    };

    DScriptActionMap.prototype.GetNodeRelations = function () {
        return this.NodeRelations;
    };

    DScriptActionMap.prototype.GetActionRelation = function () {
        return this.ActionRelation;
    };
    return DScriptActionMap;
})();
