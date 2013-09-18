var DScriptActionMap = (function () {
    function DScriptActionMap() {
        this.ActionMap = [];
        this.ContextArray = [];
    }
    DScriptActionMap.prototype.GetContextLabel = function (Element) {
        for (var i = 0; i < Element.Children.length; i++) {
            var Children = Element.Children[i];
            if (Children.Type == AssureIt.NodeType.Context) {
                this.ContextArray.push(Children.Label);
            }
            this.GetContextLabel(Children);
        }
        return;
    };

    DScriptActionMap.prototype.GetReaction = function (Context) {
        var Parent = Context.Parent;
        for (var i = 0; i < Parent.Children.length; i++) {
            var Child = Parent.Children[i];
            if (Child.Type == AssureIt.NodeType.Evidence) {
                return Child.Label;
            }
        }
        return "";
    };

    DScriptActionMap.prototype.GetAction = function (Context) {
        var NotesKeys = Object.keys(Context.Notes);
        var Action = "";
        var Reaction = "";

        for (var i = 0; i < NotesKeys.length; i++) {
            if (NotesKeys[i] == "Reaction") {
                Action = Context.Notes["Reaction"];
                Reaction = this.GetReaction(Context);
                this.ActionMap[Action] = Reaction;
            }
        }
        return;
    };

    DScriptActionMap.prototype.GetActionMap = function (ViewMap, Node, ASNData) {
        this.GetContextLabel(Node);
        for (var i = 0; i < this.ContextArray.length; i++) {
            var Context = ViewMap[this.ContextArray[i]];
            if (Context.Annotations.length > 0) {
                this.GetAction(Context);
            }
        }
        for (var key in this.ActionMap) {
            console.log(key + " : " + this.ActionMap[key]);
        }
        return;
    };
    return DScriptActionMap;
})();
