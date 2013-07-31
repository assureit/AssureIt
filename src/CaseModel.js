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

        Case.ElementMap[this.Label] = this;
    }
    CaseModel.prototype.AppendChild = function (Node) {
        this.Children.push(Node);
    };

    CaseModel.prototype.GetAnnotation = function (Name) {
        for (var a in this.Annotations) {
            if (a.Name == Name) {
                return a;
            }
        }
        return a;
    };

    CaseModel.prototype.SetAnnotation = function (Name, Body) {
        for (var a in this.Annotations) {
            if (a.Name == Name) {
                a.Body = Body;
                return a;
            }
        }
        this.Annotations.push(new CaseAnnotation(Name, Body));
    };

    CaseModel.prototype.InvokePlugInModifier = function (EventType, EventBody) {
        var recall = false;
        for (var a in this.Annotations) {
            var f = this.Case.GetPlugInModifier(a.Name);
            if (f != null) {
                recall = f(Case, this, EventType, EventBody) || recall;
            }
        }
        for (var a in this.Notes) {
            var f = this.Case.GetPlugInModifier(a.Name);
            if (f != null) {
                recall = f(Case, this, EventType, EventBody) || recall;
            }
        }
        return recall;
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

    CaseModifiers.prototype.GetPlugInModifier = function (key) {
        return this.PlugInMap[key];
    };
    return CaseModifiers;
})();

var CaseModifierConfig = new CaseModifiers();

var Case = (function () {
    function Case() {
        this.IdCounters = [0, 0, 0, 0, 0];
        this.IsModified = false;
        this.ElementMap = {};
    }
    Case.prototype.SetElementTop = function (ElementTop) {
        this.ElementTop = ElementTop;
        this.SaveIdCounterMax(ElementTop);
    };
    Case.prototype.SaveIdCounterMax = function (Element) {
        for (var i = 0; i < Element.Children.length; i++) {
            this.SaveIdCounterMax(Element.Children[i]);
        }
        var m = Element.Label.match(/^[GCSE][0-9]+$/);
        if (m.length == 1) {
            var prefix = m[0][0];
            var count = Number(m[0].substring(1));
            switch (prefix) {
                case "G":
                    if (this.IdCounters[CaseType["Goal"]] < count)
                        this.IdCounters[CaseType["Goal"]] = count;
                    break;
                case "C":
                    if (this.IdCounters[CaseType["Context"]] < count)
                        this.IdCounters[CaseType["Context"]] = count;
                    break;
                case "S":
                    if (this.IdCounters[CaseType["Strategy"]] < count)
                        this.IdCounters[CaseType["Strategy"]] = count;
                    break;
                case "E":
                    if (this.IdCounters[CaseType["Evidence"]] < count)
                        this.IdCounters[CaseType["Evidence"]] = count;
                    break;
                default:
                    console.log("invalid label prefix :" + prefix);
            }
        }
    };
    Case.prototype.NewLabel = function (Type) {
        this.IdCounters[Type] += 1;
        return CaseType[Type].charAt(0) + this.IdCounters[Type];
    };

    Case.prototype.GetPlugInModifier = function (key) {
        return CaseModifierConfig.PlugInMap[key];
    };
    return Case;
})();
