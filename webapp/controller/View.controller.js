sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Core",
    "sap/m/MessagePopover",
    "sap/ui/core/Element",
    "sap/m/MessageItem",
    "sap/ui/core/library",
    "sap/ui/core/message/Message"
],
    /**
         * @param {typeof sap.ui.core.mvc.Controller} Controller
         * @param {typeof sap.m.MessagePopover} MessagePopover 
         * @param {typeof sap.ui.core.Element } Element 
         * @param {typeof sap.m.MessageItem } MessageItem 
         * @param {typeof sap.ui.core.library } library 
         * @param {typeof sap.ui.core.message.Message } Message 
         
    */
    (Controller, Core, MessagePopover, Element, MessageItem, library, Message) => {
        "use strict";
        var MessageType = library.MessageType;

        return Controller.extend("retoui5.controller.View", {

            onInit() {
                const oJSONModel = new sap.ui.model.json.JSONModel();
                const oJSONModel2 = new sap.ui.model.json.JSONModel();
                const oView = this.getView();

                oJSONModel.loadData("../model/selectionMenu.json");
                oView.setModel(oJSONModel, "selectionScreen");

                oJSONModel2.loadData("../localServices/mockdata/userModel.json");
                


                this._MessageManager = Core.getMessageManager();
                //Clear the old messages 
                this._MessageManager.removeAllMessages();
                this._MessageManager.registerObject(this.oView.byId("formContainerUser"), true);
                this.oView.setModel(this._MessageManager.getMessageModel(), "message");
                oView.setModel(oJSONModel2, "modeluser");

                this.createMessagePopover();
                this.bindbutton(oView);
                

            },
            createMessagePopover: function () {
                let that = this;

                this.oMP = new MessagePopover({
                    activeTitlePress: function (oEvent) {
                        let oItem = oEvent.getParameter("item");
                        let oPage = that.getView().byId("page");
                        let oMessage = oItem.getBindingContext("message").getObject();
                        let oControl = Element.registry.get(oMessage.getControlId());
                        if (oControl) {
                            oPage.scrollToElement(oControl.getDomRef(), 200, [0, -100]);
                            setTimeout(function () {
                                oControl.focus();
                            }, 300);
                        }
                    },
                    items: {
                        path: "message>/",
                        template: new MessageItem({
                            title: "{message>message}",
                            subtitle: "{message>additionalText}",
                            groupName: { parts: [{ path: 'message>controlIds' }], formatter: this.getGroupName },
                            activeTitle: { parts: [{ path: 'message>controlIds' }], formatter: this.isPositionable },
                            type: "{message>type}",
                            description: "{message>message}"
                        })
                    },
                    groupItems: true
                });
                this.getView().byId("messagePopover").addDependent(this.oMP);
            },

            // the group name is generated based on the current layout 
            // epecific for each use case            
            getGroupName: function (sControlId) {
                let oControl = Element.registry.get(sControlId);
                if (oControl) {
                    let sFormSubtitle = oControl.getParent().getParent().getTitle().getText();
                    let sFormTitle = oControl.getParent().getParent().getParent().getTitle();
                    return sFormTitle + ", " + sFormSubtitle;
                }
            },
            // this hook can be used by the application to determine if a 
            //  control can be found/reached on the page and navigate to 
            isPositionable: function (sControlId) {
                return sControlId ? true : false;
            },

            // Set the button icon according to the message with the highest severity 
            // //The priority of the message types are as follows: Error > Warning > Success > Info 
            mpIconFormatter: function () {
                let sIcon;
                let aMessage = this._MessageManager.getMessageModel().oData;
                aMessage.forEach(function (sMessage) {
                    switch (sMessage.type) {
                        case "Error": sIcon = "sap-icon://message-error";
                            break;
                        case "Warning": sIcon = sIcon !== "sap-icon://message-error" ? "sap-icon://message-warning" : sIcon;
                            break;
                        case "Success": sIcon = sIcon !== "sap-icon://message-error" && sIcon !== "sap-icon://message-warning" ? "sap-icon://message-success" : sIcon;
                            break;
                        default: sIcon = !sIcon ? "sap-icon://message-information" : sIcon;
                            break;
                    };
                });
                return sIcon;
            },
            //Display the button type according to the message with the highest severity
            //The priority of the message types are as follows: Error > Warning > Success > Info 

            mpTypeFormatter: function () {
                let sHighestSeverity;
                let aMessage = this._MessageManager.getMessageModel().oData;
                aMessage.forEach(function (sMessage) {
                    switch (sMessage.type) {
                        case "Error":
                            sHighestSeverity = "Negative";
                            break;
                        case "Warning":
                            sHighestSeverity = sHighestSeverity !== "Negative" ? "Critical" : sHighestSeverity;
                            break;
                        case "Success":
                            sHighestSeverity = sHighestSeverity !== "Negative" && sHighestSeverity !== "Critical" ? "Success" : sHighestSeverity;
                            break;
                        default:
                            sHighestSeverity = !sHighestSeverity ? "Neutral" : sHighestSeverity;
                            break;
                    };
                });
                return sHighestSeverity;
            },

            mpSeverityMessages: function () {
                let sHighestSeverityIconType = this.mpTypeFormatter();
                let sHighestSeverityMessageType;
                switch (sHighestSeverityIconType) {
                    case "Negative":
                        sHighestSeverityMessageType = "Error";
                        break;
                    case "Critical":
                        sHighestSeverityMessageType = "Warning";
                        break;
                    case "Negative":
                        sHighestSeverityMessageType = "Success";
                        break;
                    default:
                        sHighestSeverityMessageType = !sHighestSeverityMessageType ? "Information" : sHighestSeverityMessageType;
                        break;
                };
                return this._MessageManager.getMessageModel().oData.reduce(function (iNumberofMessages, oMessageItem) {
                    return oMessageItem.type === sHighestSeverityMessageType ? ++iNumberofMessages : iNumberofMessages;
                }, 0) || "";
            },
            handleMessagesPopover: function (oEvent) {
                if (!this.oMP) {
                    this.oMP.createMessagePopover();
                }
                this.oMP.toggle(oEvent.getSource());
            },
            handleRequiredField: function (oInput) {
                oInput.setValueState(null);
                
                let sTarget =  oInput.getId();//+ "/" + oInput.getBindingPath("value");
                //logic to remove message from traget
                this.removeMessageFromTarget(sTarget);
                if (!oInput.getValue()) {
                    this._MessageManager.addMessages(
                        new Message({
                            message: "A mandatory field is required",
                            type: MessageType.Error,
                            additionalText: oInput.getLabels()[0].getText(),
                            target: sTarget,
                            processor: this.getView().getModel('modeluser')

                        })
                    );
                    oInput.setValueState("Error");
                }
                
            },
            handleRequiredselect: function (oInput) {
                oInput.setValueState(null);
                let sTarget = oInput.getId() ; // Construir el target

                //logic to remove message from traget
                this.removeMessageFromTarget(sTarget);
                if (!oInput.getSelectedItem()) {
                    this._MessageManager.addMessages(
                        new Message({
                            message: "A mandatory field is required",
                            type: MessageType.Error,
                            additionalText: oInput.getParent().getLabel().getText(),
                            target: sTarget,
                            processor: this.getView().getModel()
                        })
                    );
                    oInput.setValueState("Error")
                }
                
            },
            handleRequireddatepicker: function (oInput) {
                oInput.setValueState(null);
                let sTarget = oInput.getId() ; // Construir el target

                //logic to remove message from traget
                this.removeMessageFromTarget(sTarget);
                if (!oInput.getValue()) {
                    this._MessageManager.addMessages(
                        new Message({
                            message: "A mandatory field is required",
                            type: MessageType.Error,
                            additionalText: oInput.getParent().getLabel().getText(),
                            target: sTarget,
                            processor: this.getView().getModel()
                        })
                    );
                    oInput.setValueState("Error")
                }
                
            },
            removeMessageFromTarget: function (sTarget) {
                this._MessageManager.getMessageModel().getData().forEach(function (oMessage) {
                    if (oMessage.target === sTarget) {
                        this._MessageManager.removeMessages(oMessage);
                    }
                }.bind(this));
            },
            checkInputConstraints: function (group, oInput) {
                
                var oBinding = oInput.getBinding("value"),
                    sValueState = "None",
                    message,
                    type,
                    descriptionsq,
                    sTarget = ""
                oInput.setValueState(null);
                this.removeMessageFromTarget(sTarget);
                switch (group) {
                    case "GR1":
                        message = "Invalid email";
                        type = MessageType.Warning;
                        descriptionsq = "The value of the email field should be a valid email adress.";
                        sValueState = "Warning";
                        break;
                    default:
                        break;
                }
                try {
                    oBinding.getType().validateValue(oInput.getValue());
                } catch (oException) {
                    this._MessageManager.addMessages(
                        new Message({
                            message: message,
                            type: type,
                            additionalText: oInput.getLabels()[0].getText(),
                            description: descriptionsq,
                            target: sTarget,
                            processor: this.getView().getModel()
                        })
                    );
                    oInput.setValueState(sValueState);
                }
            },
            onChange: function (oEvent) {
                // var oInput = oEvent.getSource();
                // if (oInput.getRequired()) {
                //  this.handleRequiredField(oInput);
                // }
                // if(oInput.getLabels()[0].getText() === 'Email'){
                //    this.checkInputConstraints("GR1",oInput);
                // }
            },
            SaveData: function () {

                const oView = this.getView();
                let oButton = oView.byId("messagePopover");
                let idinput          = this.oView.byId("id");
                let typedocSelec     = this.oView.byId("typedoc");
                let nameinput        = this.oView.byId("name");
                let lastnameinput    = this.oView.byId("lastname");
                let birthdatedate    = this.oView.byId("birthdate");
                let placebirthSelec  = this.oView.byId("placebirth");
                let nationalitySelec = this.oView.byId("nationality");
                let genreSelec       = this.oView.byId("genre");
                let civilStatusSelec = this.oView.byId("civilStatus");
                let countrySelec     = this.oView.byId("country");
                let provinceSelec    = this.oView.byId("province");
                let regionSelec      = this.oView.byId("region");
                let addressinput     = this.oView.byId("address");
                let postalcodeinput  = this.oView.byId("postalcode");
                let phoneNumberinput = this.oView.byId("phoneNumber");
                let emailinput       = this.oView.byId("email");


                this.handleRequiredField(idinput);
                // this.handleRequiredselect(typedocSelec);
                // this.handleRequiredField(nameinput);
                // this.handleRequiredField(lastnameinput);
                // this.handleRequireddatepicker(birthdatedate);
                // this.handleRequiredselect(placebirthSelec);
                // this.handleRequiredselect(nationalitySelec);
                // this.handleRequiredselect(genreSelec);
                // this.handleRequiredselect(civilStatusSelec);
                // this.handleRequiredselect(countrySelec);
                // this.handleRequiredselect(provinceSelec);
                // this.handleRequiredselect(regionSelec);
                // this.handleRequiredField(addressinput);
                // this.handleRequiredField(postalcodeinput);
                // this.handleRequiredField(phoneNumberinput);
                // // this.handleRequiredField(emailinput);
                this.checkInputConstraints('GR1', emailinput);
                
                        
                

                if (this._MessageManager.getMessageModel().getData().length <1) 
                    {
                        let id              = idinput.getValue();
                        let typedoc         = typedocSelec.mProperties.selectedKey;
                        let name            = nameinput.getValue();
                        let lastname        = lastnameinput.getValue();
                        let birthdate       = birthdatedate.getValue();
                        let placebirth      =placebirthSelec.mProperties.selectedKey;
                        let nationality     = nationalitySelec.mProperties.selectedKey;
                        let genre           = genreSelec.mProperties.selectedKey;
                        let civilStatus     = civilStatusSelec.mProperties.selectedKey;
                        let country         = countrySelec.mProperties.selectedKey;
                        let province        = provinceSelec.mProperties.selectedKey;
                        let region          = regionSelec.mProperties.selectedKey;
                        let address         = addressinput.getValue();
                        let postalcode      = postalcodeinput.getValue();
                        let phoneNumber     = phoneNumberinput.getValue();
                        let email           = emailinput.getValue();

                        let oModel = this.getView().getModel("modeluser");
                        let aData = oModel.getProperty("/user");

                        aData.push({
                            id         : id,
                            typedoc    : typedoc,
                            name       : name,
                            lastname   : lastname,
                            birthdate  : birthdate,
                            placebirth : placebirth,
                            nationality: nationality,
                            genre      : genre,
                            civilStatus: civilStatus,
                            country    : country,
                            province   : province,
                            region     : region,
                            address    : address,
                            postalcode : postalcode,
                            phoneNumber: phoneNumber,
                            email      : email
                        
                        });

                        // Actualizar el modelo con los nuevos datos
                        oModel.setProperty("/user", aData);
                        this.limpiarInputs();

                        let oTable = this.byId("tble");
                        oTable.setModel(oModel);
                    } else {
                        oButton.setVisible(true);
                        this.oMP.getBinding("items").attachChange(function (oEvent) {
                            this.oMP.navigateBack();
                            oButton.setType(this.mpTypeFormatter());
                            oButton.setIcon(this.mpIconFormatter());
                            oButton.setText(this.mpSeverityMessages());
                        }.bind(this));
                        setTimeout(function () {
                            this.oMP.openBy(oButton);
                    }.bind(this), 100);
                        
                    
                };

            },
            bindbutton : function(oView){
                let oButton = oView.byId("messagePopover");
                        this.oMP.getBinding("items").attachChange(function (oEvent) {
                            this.oMP.navigateBack();
                            oButton.setType(this.mpTypeFormatter());
                            oButton.setIcon(this.mpIconFormatter());
                            oButton.setText(this.mpSeverityMessages());
                        }.bind(this));

            },
            
            limpiarInputs: function () {
                const oView = this.getView();
                
            const aInputs = oView.findAggregatedObjects(true, function(oControl) {
            return oControl.isA("sap.m.Input");
                });
            
            // Obtén todos los controles de tipo Select dentro de la vista
            const aSelects = oView.findAggregatedObjects(true, function(oControl) {
            return oControl.isA("sap.m.Select");
            });

                
                // Recorre cada input y restablece su valor
                aInputs.forEach(function(oInput) {
                oInput.setValue("");
                    });
                
                // Recorre cada select y restablece su valor
                aSelects.forEach(function(oSelect) {
                    oSelect.setSelectedKey("");
                    });
    
                    oView.byId("email").setValueState(null);
                    oView.byId("birthdate").setValue("");
    
     
    
     
    }
    



        });
    });