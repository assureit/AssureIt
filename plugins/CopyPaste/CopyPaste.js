///<reference path="../../src/CaseModel.ts" />
///<reference path="../../src/CaseViewer.ts" />
///<reference path="../../src/PlugInManager.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var CopyPastePlugIn = (function (_super) {
    __extends(CopyPastePlugIn, _super);
    function CopyPastePlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.plugInManager = plugInManager;
        this.MenuBarContentsPlugIn = new CopyPasteMenuPlugIn(plugInManager);
    }
    return CopyPastePlugIn;
})(AssureIt.PlugInSet);

var CopyPasteMenuPlugIn = (function (_super) {
    __extends(CopyPasteMenuPlugIn, _super);
    function CopyPasteMenuPlugIn(plugInManager) {
        _super.call(this, plugInManager);
        this.CopiedNode = null;
    }
    CopyPasteMenuPlugIn.prototype.IsEnabled = function (caseViewer, caseModel) {
        return true;
    };

    CopyPasteMenuPlugIn.prototype.Delegate = function (caseViewer, caseModel, element, serverApi) {
        console.log(this.CopiedNode);
        var self = this;
        if (caseViewer.Source.IsEditable()) {
            element.append('<a href="#" ><img id="copy" src="' + serverApi.basepath + 'images/copy.png" title="Copy" alt="copy" /></a>');
            if (self.CopiedNode != null && this.IsPastable(caseModel)) {
                element.append('<a href="#" ><img id="paste" src="' + serverApi.basepath + 'images/paste.png" title="Paste" alt="paste" /></a>');
            }
        }

        var copy = function (ev) {
            var encoder = new AssureIt.CaseEncoder();
            self.CopiedNode = encoder.ConvertToASN(caseModel, false);
            self.CopiedNodeType = caseModel.Type;
            console.log('encoded');
            console.log(self.CopiedNode);
        };

        var paste = function (ev) {
            var decoder = new AssureIt.CaseDecoder();
            var decoded = decoder.ParseASN(caseModel.Case, self.CopiedNode, null);
            decoded.Parent = caseModel;
            caseModel.Children.push(decoded);
            caseViewer.Draw();
        };

        $('#copy').unbind('click').unbind('dblclick');
        $('#copy').click(copy);
        $('#paste').unbind('click').unbind('dblclick');
        $('#paste').click(paste);

        return true;
    };

    CopyPasteMenuPlugIn.prototype.IsPastable = function (caseModel) {
        var ParentType = caseModel.Type;
        switch (this.CopiedNodeType) {
            case AssureIt.NodeType.Goal:
                if (ParentType == AssureIt.NodeType.Strategy)
                    return true;
                break;
            case AssureIt.NodeType.Context:
                if (ParentType != AssureIt.NodeType.Context && !caseModel.HasContext())
                    return true;
                break;
            case AssureIt.NodeType.Strategy:
                if (ParentType == AssureIt.NodeType.Goal)
                    return true;
                break;
            case AssureIt.NodeType.Evidence:
                if (ParentType == AssureIt.NodeType.Goal)
                    return true;
                break;
        }
        return false;
    };
    return CopyPasteMenuPlugIn;
})(AssureIt.MenuBarContentsPlugIn);
