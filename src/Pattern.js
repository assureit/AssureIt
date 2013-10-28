/// <reference path="./CaseModel.ts" />
/// <reference path="./CaseViewer.ts" />
var Pattern = (function () {
    function Pattern() {
        this.Goal = AssureIt.NodeType.Goal;
        this.Context = AssureIt.NodeType.Context;
        this.Strategy = AssureIt.NodeType.Strategy;
        this.Evidence = AssureIt.NodeType.Evidence;
    }
    Pattern.prototype.Match = function (model) {
        return false;
    };

    Pattern.prototype.Success = function (model) {
    };

    Pattern.prototype.Note = function (model, key, callback) {
        var Notes = model.Notes;
        if (!Notes)
            return;
        for (var keystring in Notes) {
            var value = Notes[keystring];
            if (keystring == key) {
                if (callback == null) {
                    return true;
                } else {
                    return callback(Notes[key]);
                }
            }
        }
        return false;
    };

    Pattern.prototype.Type = function (model, Type, callback) {
        if (model.Type == Type) {
            if (callback == null) {
                return true;
            } else {
                return callback();
            }
        }
        return false;
    };

    Pattern.prototype.ParentType = function (model, Type, callback) {
        var Parent = model.Parent;
        if (Parent && Parent.Type == Type) {
            if (callback == null) {
                return true;
            } else {
                return callback(Parent);
            }
        }
        return false;
    };
    return Pattern;
})();
