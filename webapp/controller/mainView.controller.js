sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
/**
 * @param {typeof sap.ui.core.mvc.Controller} Controller
 * @param {typeof sap.ui.model.Filter} Filter
 * @param {typeof sap.ui.model.FilterOperator} FilterOperator
*/
 (Controller, Filter, FilterOperator) =>  {
    "use strict";

    return Controller.extend("dev.invoices.controller.mainView", {
        onInit() {
            const oJSONModel = new sap.ui.model.json.JSONModel();
            const oView = this.getView();
            oJSONModel.loadData("../model/selectionScreenMenu.json");
            oView.setModel(oJSONModel, "selectionScreen");
        },
        onFilter: function (oEvent) {
            const oData = this.getView().getModel("selectionScreen").getData();
            let Filters = [];
            if(oData.ShipName !== ""){
                Filters.push(new Filter("ShipName", FilterOperator.Contains, oData.ShipName));
            }
            if(oData.CountryKey !== ""){
                Filters.push(new Filter("ShipName", FilterOperator.EQ, oData.CountryKey));
            }

            const oList = this.getView().byId("invoicesList");
            const oBinding = oList.getBinding("items");
            oBinding.Filter();
            
        },
        onClearFilter: function () {
            const oModelSelScreen = this.getView().getModel("selectionScreen");
            oModelSelScreen.setProperty("/ShipName", "");
            oModelSelScreen.setProperty("/CountryKey", "");
            
            const oList = this.getView().byId("invoicesList");
            const oBinding = oList.getBinding("items");
            oBinding.Filter([]);
        }
    });
});