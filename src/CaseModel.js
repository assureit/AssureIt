var CaseAnnotation = (function () {
    function CaseAnnotation(Name, Body) {
        this.Name = Name;
        this.Body = Body;
    }
    return CaseAnnotation;
})();

var CaseNote = (function () {
    function CaseNote(Name, Body) {
        this.Name = Name;
        this.Body = Body;
    }
    return CaseNote;
})();

var CaseType;
(function (CaseType) {
    CaseType[CaseType["Goal"] = 0] = "Goal";
    CaseType[CaseType["Context"] = 1] = "Context";
    CaseType[CaseType["Strategy"] = 2] = "Strategy";
    CaseType[CaseType["Evidence"] = 3] = "Evidence";
})(CaseType || (CaseType = {}));

var CaseModel = (function () {
    function CaseModel(Case, Parent, Type, Label, Statement) {
        this.Case = Case;
        this.Type = Type;
        this.Label = (Label == null) ? Case.NewLabel(Type) : Label;
        this.Statement = (Statement == null) ? "" : Statement;
        this.Parent = Parent;
        if (Parent != null) {
            Parent.AppendChild(this);
        }
        this.Children = [];
        this.Annotations = [];
        this.Notes = [];
        this.x = 0;
        this.y = 0;

        Case.ElementMap[this.Label] = this;
    }
    CaseModel.prototype.AppendChild = function (Node) {
        this.Children.push(Node);
    };
    return CaseModel;
})();

var CaseModifiers = (function () {
    function CaseModifiers() {
        this.PlugInMap = {};
    }
    CaseModifiers.prototype.AddPlugInModifier = function (key, f) {
        this.PlugInMap[key] = f;
    };
    return CaseModifiers;
})();

var CaseModifierConfig = new CaseModifiers();

var Case = (function () {
    function Case() {
        this.Ids = [0, 0, 0, 0, 0];
        this.IsModified = false;
        this.ElementMap = {};
    }
    Case.prototype.SetTopGoalLabel = function (Label) {
        this.TopGoalLabel = Label;
    };

    Case.prototype.NewLabel = function (Type) {
        this.Ids[Type] = this.Ids[Type] + 1;
        return CaseType[Type].charAt(0) + this.Ids[Type];
    };

    Case.prototype.GetPlugInModifier = function (key) {
        return CaseModifierConfig.PlugInMap[key];
    };
    return Case;
})();

var X_MARGIN = 30;
var Y_MARGIN = 50;

var hasContext = function (Node, x, y) {
    var i = 0;
    for (; i < Node.Children.length; i++) {
        if (Node.Children[i].Type == 1) {
            return i;
        }
    }
    return -1;
};

var emitOddNumberChildren = function (Node, x, y) {
    var n = Node.Children.length;
    for (var i in Node.Children) {
        Node.Children[i].x += x;
        Node.Children[i].y += y;
        Node.Children[i].y += Y_MARGIN;
    }
    var num = (n - 1) / 2;
    for (var j = -num; j <= num; j++) {
        Node.Children[i].x += X_MARGIN * j;
    }

    for (var i in Node.Children) {
        console.log(Node.Children[i].Label);
        console.log("(" + Node.Children[i].x + ", " + Node.Children[i].y + ")");
        traverse(Node.Children[i], Node.Children[i].x, Node.Children[i].y);
    }
};

var emitEvenNumberChildren = function (Node, x, y) {
    var n = Node.Children.length;
    var num = n / 2;
    var index = new Array();

    for (var j = -num; j <= num; j++) {
        if (j == 0) {
            continue;
        }
        index.push(j);
    }

    for (var i in Node.Children) {
        Node.Children[i].x += x;
        Node.Children[i].y += y;
        Node.Children[i].x += X_MARGIN * index[i];
        Node.Children[i].y += Y_MARGIN;
        console.log(Node.Children[i].Label);
        console.log("(" + Node.Children[i].x + ", " + Node.Children[i].y + ")");
        traverse(Node.Children[i], Node.Children[i].x, Node.Children[i].y);
    }
};

var traverse = function (Node, x, y) {
    if (Node.Children.length == 0) {
        return;
    }
    var i = 0;
    i = hasContext(Node, x, y);
    if (i != -1) {
        Node.Children[i].x += x;
        Node.Children[i].y += y;
        Node.Children[i].x += X_MARGIN;
        console.log(Node.Children[i].Label);
        console.log("(" + Node.Children[i].x + ", " + Node.Children[i].y + ")");
        Node.Children = Node.Children.splice(i - 1, 1);
        traverse(Node, x, y);
    } else {
        if (Node.Children.length % 2 == 1) {
            emitOddNumberChildren(Node, x, y);
        }
        if (Node.Children.length % 2 == 0) {
            emitEvenNumberChildren(Node, x, y);
        }
    }
};
