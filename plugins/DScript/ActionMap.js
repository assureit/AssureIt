var DScriptNodeRelation = (function () {
    function DScriptNodeRelation() {
        this.BaseNode = null;
        this.Presumes = [];
        this.Reactions = [];
    }
    DScriptNodeRelation.prototype.PresumesToString = function () {
        var ret = "";
        if (this.Presumes.length != 0) {
            var i = 0;
            for (; i < this.Presumes.length; i++) {
                ret += this.Presumes[i];
                if (i < this.Presumes.length - 1)
                    ret += ", ";
            }
        } else {
            ret = "-";
        }
        return ret;
    };
    DScriptNodeRelation.prototype.ReactionsToString = function () {
        var ret = "";
        if (this.Reactions.length != 0) {
            var reaction;
            var i = 0;
            for (; i < this.Reactions.length; i++) {
                reaction = this.Reactions[i];
                ret += reaction["dist"];
                if (reaction["risk"] != null)
                    ret += "(" + reaction["risk"] + ")";
                if (i < this.Reactions.length - 1)
                    ret += ", ";
            }
        } else {
            ret = "-";
        }
        return ret;
    };
    return DScriptNodeRelation;
})();

var DScriptActionRelation = (function () {
    function DScriptActionRelation(src, dist, risk) {
        this.SrcNode = src;
        this.DistNode = dist;
        this.Risk = risk;
    }
    DScriptActionRelation.prototype.GetTargetNode = function () {
        var ret = this.SrcNode;
        while (ret.Type != AssureIt.NodeType.Goal) {
            if (ret.Parent != null) {
                ret = ret.Parent;
            } else {
                throw "in DScriptPlugIn, UpdateActionRelationTable Error";
            }
        }
        return ret;
    };

    DScriptActionRelation.prototype.ExtractNode = function (root, thFunc, maxDepth, dir) {
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
    DScriptActionRelation.prototype.GetReactionNodes = function () {
        return this.ExtractNode(this.DistNode, function (node) {
            if (node.Type == AssureIt.NodeType.Evidence) {
                return true;
            } else {
                return false;
            }
        }, -1, AssureIt.Direction.Bottom);
    };
    return DScriptActionRelation;
})();

var DScriptActionMap = (function () {
    function DScriptActionMap(root) {
        this.ErrorInfo = [];
        this.RootNode = root;
        this.NodeRelationMap = {};
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
        if (label in this.NodeRelationMap) {
            relation = this.NodeRelationMap[label];
        } else {
            relation = new DScriptNodeRelation();
            relation.BaseNode = label;
            this.NodeRelationMap[label] = relation;
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
                    if (node.Type == AssureIt.NodeType.Evidence && node.Environment.Risk == reactionValue)
                        ret = true;
                    return ret;
                }, -1, AssureIt.Direction.Bottom);
                if (srcList.length == 0) {
                    this.ErrorInfo.push("invalid Reaction target ${TARGET} (ignored)".replace("${TARGET}", reactionValue));
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
            var targets = presumeValue.split(/[\s,]/);
            var src = presumeNode.Parent;
            for (var j = 0; j < targets.length; j++) {
                var target = targets[j];
                var dist = this.ElementMap[target];
                if (src != null) {
                    this.AddPresume(src, dist);
                } else {
                    this.ErrorInfo.push("invalid Presume target ${TARGET} (ignored)".replace("${TARGET}", target));
                }
            }
        }
    };
    DScriptActionMap.prototype.ExtractRelation = function () {
        this.ExtractReactionRelation();
        this.ExtractPresumeRelation();
    };

    DScriptActionMap.prototype.GetNodeRelationMap = function () {
        return this.NodeRelationMap;
    };
    DScriptActionMap.prototype.GetActionRelations = function () {
        var ret = [];
        for (var key in this.NodeRelationMap) {
            var nodeRelation = this.NodeRelationMap[key];
            for (var i = 0; i < nodeRelation.Reactions.length; i++) {
                var actionRelation = new DScriptActionRelation(this.ElementMap[nodeRelation.BaseNode], this.ElementMap[nodeRelation.Reactions[i]["dist"]], nodeRelation.Reactions[i]["risk"]);
                ret.push(actionRelation);
            }
        }
        console.log(ret);
        return ret;
    };
    return DScriptActionMap;
})();
