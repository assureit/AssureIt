var DScriptNodeRelation = (function () {
    function DScriptNodeRelation() {
        this.BaseNode = null;
        this.Presumes = [];
        this.Reactions = [];
    }
    return DScriptNodeRelation;
})();

var DScriptActionMap = (function () {
    function DScriptActionMap(root) {
        this.ErrorInfo = [];
        this.RootNode = root;
        this.RelationMap = {};
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

    DScriptActionMap.prototype.GetOrCreateNodeRelation = function (label) {
        var relation;
        if (label in this.RelationMap) {
            relation = this.RelationMap[label];
        } else {
            relation = new DScriptNodeRelation();
            relation.BaseNode = label;
            this.RelationMap[label] = relation;
        }
        return relation;
    };
    DScriptActionMap.prototype.AddReaction = function (src, dist, risk) {
        var relation;
        if (src != null) {
            relation = this.GetOrCreateNodeRelation(src.Label);
        } else {
            relation = this.GetOrCreateNodeRelation("-");
        }
        if (risk == null)
            risk = "*";
        if (dist != null) {
            relation.Reactions.push({
                dist: dist.Label,
                risk: risk
            });
        } else {
            relation.Reactions.push({
                dist: "-",
                risk: risk
            });
        }
    };
    DScriptActionMap.prototype.AddPresume = function (src, dist) {
        var relation;
        if (src != null) {
            relation = this.GetOrCreateNodeRelation(src.Label);
        } else {
            relation = this.GetOrCreateNodeRelation("-");
        }
        if (dist != null) {
            relation.Presumes.push(dist.Label);
        } else {
            relation.Presumes.push("-");
        }
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
                this.AddReaction(src, dist, null);
            } else {
                var srcList = this.ExtractNode(this.RootNode, function (node) {
                    var ret = false;
                    if (node.Type == AssureIt.NodeType.Evidence && node.Environment["Risk"] == reactionValue)
                        ret = true;
                    return ret;
                }, -1, AssureIt.Direction.Bottom);
                if (srcList.length == 0) {
                    this.ErrorInfo.push("invalid Reaction target ${TARGET} (ignored)".replace("${TARGET}", reactionValue));
                    this.AddReaction(null, dist, reactionValue);
                } else {
                    for (var j = 0; j < srcList.length; j++) {
                        this.AddReaction(srcList[j], dist, reactionValue);
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
                this.AddPresume(src, dist);
            } else {
                this.ErrorInfo.push("invalid Presume target ${TARGET} (ignored)".replace("${TARGET}", presumeValue));
                this.AddPresume(null, dist);
            }
        }
    };
    DScriptActionMap.prototype.ExtractRelation = function () {
        this.ExtractReactionRelation();
        this.ExtractPresumeRelation();
    };
    return DScriptActionMap;
})();
