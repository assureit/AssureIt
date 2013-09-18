var DScriptActionMap = (function () {
    function DScriptActionMap() {
        this.ActionMap = [];
        this.ContextArray = [];
    }
    DScriptActionMap.prototype.GetContextLabel = function (Element) {
        for (var i = 0; i < Element.Children.length; i++) {
            if (Element.Children[i].Type == AssureIt.NodeType.Context) {
                this.ContextArray.push(Element.Children[i].Label);
            }
            console.log(Element.Children[i].Label);
            this.GetContextLabel(Element.Children[i]);
        }
        return;
    };

    DScriptActionMap.prototype.GetActionMap = function (ViewMap, Node, ASNData) {
        this.GetContextLabel(Node);
        for (var i = 0; i < this.ContextArray.length; i++) {
            var Context = ViewMap[this.ContextArray[i]];
            console.log(Context);
            if (Context.Annotations.length > 0) {
                console.log(Context.Annotations.length);
                console.log(Context.Annotations[0].Name);
                console.log(Context.Notes);
                var NotesKeys = Object.keys(Context.Notes);
                for (var i = 0; i < NotesKeys.length; i++) {
                    if (NotesKeys[i] == "Reaction") {
                        console.log("This is registered.");
                        console.log(Context.Notes[NotesKeys[i]]);
                    }
                }
                console.log(Object.keys(Context.Notes));
            }
            ;
        }
        return;
    };
    return DScriptActionMap;
})();
