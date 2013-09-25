/// <reference path="../src/ServerApi.ts" />
/// <reference path="../src/SelectComponent.ts" />
/// <reference path="../d.ts/jquery.d.ts" />
$(function () {
    var serverApi = new AssureIt.ServerAPI('http://localhost/ait');

    var selectCaseView = new AssureIt.SelectCaseView(serverApi, '#select-case');
    selectCaseView.initEvents();
    selectCaseView.clear();
    selectCaseView.addElements(null);
});
