sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("dev.invoices.controller.mainView", {
        onInit() {
            const oJSONModel = new sap.ui.model.json.JSONModel();
            const oView = this.getView();
            oJSONModel.loadData("./model/selectionScreenMenu.json");
            oView.setModel(oJSONModel, "selectionScreen");
        }
    });
});