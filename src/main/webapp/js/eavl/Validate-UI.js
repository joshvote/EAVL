/**
 * Controls the Validate page
 */
Ext.application({
    name : 'eavl-validate',

    init: function() {
        eavl.widgets.SplashScreen.showLoadingSplash('Loading Validator, please stand by ...');
    },

    viewport : null,

    //Here we build our GUI from existing components - this function should only be assembling the GUI
    //Any processing logic should be managed in dedicated classes - don't let this become a
    //monolithic 'do everything' function
    launch : function() {
        //Called if the init code fails badly
        var initError = function() {
            eavl.widgets.SplashScreen.hideLoadingScreen();
            eavl.widgets.SplashScreen.showErrorSplash('There was an error loading your data. Please try refreshing the page or contacting ' + eavl.widgets.FeedbackWidget.CONTACT + ' if the problem persists.');
        };

        var initSuccess = function(parameterDetails) {
            eavl.widgets.SplashScreen.hideLoadingScreen();

            Ext.tip.QuickTipManager.init();

            //If we are just reloading the store, tell our widgets to update instead of recreating everything
            if (Ext.app.Application.viewport) {

                var updatePdList = function(pdlist, parameterDetails) {
                    var ds = pdlist.getStore();
                    Ext.Array.each(parameterDetails, function(pd) {
                        var existingPd = ds.getById(pd.get("name"));
                        if (existingPd) {
                            pd.mergeAdditionalParams(existingPd);
                            ds.remove(existingPd);
                            ds.add(pd);
                        }
                    });
                };

                //we need to find all of our parameter details (wherever they are) and update them
                updatePdList(Ext.getCmp("trashpanel"), parameterDetails);
                updatePdList(Ext.getCmp("comppanel"), parameterDetails);

                //Need to also update our PD panel
                var pdPanel = Ext.getCmp("pdpanel");
                var name = pdPanel.parameterDetails.get("name");
                Ext.Array.each(parameterDetails, function(pd) {
                    if (pd.get("name") === name) {
                        pd.mergeAdditionalParams(pdPanel.parameterDetails);
                        pdPanel.showParameterDetails(pd);
                        return false;
                    }
                });

                return;
            }
            
            var convertAllUom = function() {
                var uomPds = [];
                var uomPdNames = [];
                
                Ext.each(parameterDetails, function(pd) {
                    if (pd.get('uom') !== eavl.models.ParameterDetails.UOM_PPM) {
                        uomPds.push(pd);
                        uomPdNames.push(pd.get('name'));
                    }
                });
                
                if (Ext.isEmpty(uomPdNames)) {
                    return;
                }
                
                var loadMask = new Ext.LoadMask({
                    target: Ext.getCmp('comppanel')
                });
                loadMask.show();
                Ext.Ajax.request({
                    url: 'validation/oxidePctToTracePpm.do',
                    params: {
                        name: uomPdNames
                    },
                    callback: function(options, success, response) {
                        loadMask.hide();
                        loadMask.destroy();
                        if (!success) {
                            return;
                        }
                        
                        var responseObj = Ext.JSON.decode(response.responseText);
                        if (!responseObj.success) {
                            return;
                        }
                        
                        var pdPanel = Ext.getCmp('pdpanel');
                        for (var i = 0; i < responseObj.data.length; i++) {
                            if (Ext.isEmpty(responseObj.data[i].element) || Ext.isEmpty(responseObj.data[i].conversion)) {
                                continue;
                            }
                            
                            uomPds[i].set('displayName', responseObj.data[i].element + '_' + eavl.models.ParameterDetails.UOM_PPM);
                            uomPds[i].set('scaleFactor', responseObj.data[i].conversion);
                            uomPds[i].set('uom', eavl.models.ParameterDetails.UOM_PPM);
                            
                            if (pdPanel.parameterDetails && pdPanel.parameterDetails.get('name') === uomPds[i].get('name')) {
                                pdPanel.showParameterDetails(pdPanel.parameterDetails);
                            }
                        }
                    }
                });
            };

            Ext.app.Application.viewport = Ext.create('Ext.container.Viewport', {
                layout: 'border',
                items: [{
                    xtype: 'workflowpanel',
                    region: 'north',
                    allowNext: function(callback) {
                        //Dont allow any text values in compositional params
                        var cp = Ext.getCmp('comppanel');
                        var badValue = false;
                        cp.getStore().each(function(pd) {
                            if (pd.calculateStatus() === eavl.models.ParameterDetails.STATUS_ERROR) {
                                badValue = true;
                                return false;
                            }
                        });
                        if (badValue) {
                            eavl.widgets.util.HighlightUtil.highlight(cp, eavl.widgets.util.HighlightUtil.ERROR_COLOR);
                            callback(false);
                            return;
                        }

                        var uomNames = [];
                        var uomChangedNames = [];
                        var uomScales = [];
                        
                        cp.getStore().each(function(pd) {
                            var oldName = pd.get('name');
                            var newName = pd.get('displayName');
                            var sf = pd.get('scaleFactor'); 
                            if (newName !== oldName || sf > 0) {
                                uomNames.push(oldName);
                                uomChangedNames.push(newName);
                                uomScales.push(sf);
                            }
                        });

                        var ds = Ext.getCmp("trashpanel").getStore();
                        var deleteColIndexes = [];
                        for (var i = 0; i < ds.getCount(); i++) {
                            deleteColIndexes.push(ds.getAt(i).get('columnIndex'));
                        }

                        eavl.widgets.SplashScreen.showLoadingSplash("Saving Selection...");
                        Ext.Ajax.request({
                            url: 'validation/saveValidationSubmitImputation.do',
                            params : {
                                deleteColIndex : deleteColIndexes,
                                uomNameKey : uomNames,
                                uomChangedName : uomChangedNames,
                                uomScaleFactor : uomScales
                            },
                            callback : function(options, success, response) {
                                eavl.widgets.SplashScreen.hideLoadingScreen();

                                if (!success) {
                                    callback(false);
                                    return;
                                }

                                var responseObj = Ext.JSON.decode(response.responseText);
                                if (!responseObj.success) {
                                    callback(false);
                                    return;
                                }

                                callback(true);
                            }
                        });
                    }
                },{
                    xtype: 'panel',
                    border: false,
                    region: 'center',
                    layout: {
                        type: 'hbox',
                        align : 'stretch',
                        pack : 'center'
                    },
                    bodyPadding : '10 40 10 40',
                    items: [{
                        xtype: 'container',
                        layout: {
                            type: 'vbox',
                            pack: 'start',
                            align: 'stretch'
                        },
                        width : 300,
                        margin : '0 10 0 0',
                        items: [{
                            id : 'comppanel',
                            xtype : 'pdlist',
                            title : 'Compositional Parameters',
                            showUom : true,
                            parameterDetails : parameterDetails,
                            sortFn : eavl.models.ParameterDetails.sortSeverityFn,
                            flex: 1,
                            viewConfig : {
                                deferEmptyText : false,
                                emptyText : '<div class="trash-empty-container"><div class="trash-empty-container-inner">No parameters could be extracted. Try uploading again.</div></div>'
                            },
                            plugins : [{
                                ptype : 'modeldnd',
                                ddGroup : 'validate-dnd-pd',
                                highlightBody : false,
                                handleDrop : function(pdlist, pd) {
                                    pdlist.getStore().add(pd);
                                },
                                handleDrag : function(pdlist, pd, source) {
                                    if (source == Ext.getCmp("pdpanel")) {
                                        return;
                                    }
                                    pdlist.getStore().remove(pd);
                                }
                            },{
                                ptype: 'headericons',
                                icons: [{
                                    location: 'text',
                                    src: 'img/convert-ppm-small.png',
                                    tip: 'Click to convert all parameters to PPM using a lookup table. Unknown parameters will not be touched.',
                                    width: 24,
                                    height: 24,
                                    style: {
                                        'cursor': 'pointer',
                                        'margin-top': 2,
                                        'margin-left': 20
                                    },
                                    handler: convertAllUom 
                                }]
                            }],
                            listeners: {
                                select: function(pdList, pd) {
                                    Ext.getCmp('pdpanel').showParameterDetails(pd);
                                }
                            }
                        },{
                            id : 'trashpanel',
                            xtype : 'pdlist',
                            title : 'Trashed Parameters',
                            disableSelection: true,
                            margin : '10 0 0 0',
                            height: 200,
                            sortFn : eavl.models.ParameterDetails.sortSeverityFn,
                            viewConfig : {
                                deferEmptyText : false,
                                emptyText : '<div class="trash-empty-container"><div class="trash-empty-container-inner"><img src="img/trash.svg" width="100"/><br>Drag a parameter here to delete it.</div></div>'
                            },
                            plugins : [{
                                ptype : 'modeldnd',
                                ddGroup : 'validate-dnd-pd',
                                highlightBody : false,
                                handleDrop : function(pdlist, pd) {
                                    pdlist.getStore().add(pd);
                                },
                                handleDrag : function(pdlist, pd, source) {
                                    if (source == Ext.getCmp("pdpanel")) {
                                        return;
                                    }
                                    pdlist.getStore().remove(pd);
                                }
                            },{
                                ptype: 'headerhelp',
                                text: 'Parameters dragged here will be deleted before any imputation takes place.'
                            }]
                        }]
                    },{
                        id : 'pdpanel',
                        xtype : 'pdpanel',
                        title : 'Parameter Details',
                        emptyText : 'Either click or drag a parameter into this panel to inspect it.',
                        flex : 1,
                        plugins : [{
                            ptype : 'modeldnd',
                            ddGroup : 'validate-dnd-pd',
                            highlightBody : false,
                            handleDrop : function(pdpanel, pd) {
                                pdpanel.showParameterDetails(pd);
                            }
                        },{
                            ptype: 'headerhelp',
                            text: 'Compositional parameters must have any non numeric and zero values replaced with either a fixed value or a missing value for future imputation.'
                        }],
                        listeners : {
                            parameterchanged : function(pdpanel, parameterDetails) {
                                eavl.widgets.SplashScreen.showLoadingSplash('Reloading CSV Data...');
                                pdStore.load();
                            }
                        }
                    }]
                }]
            });
        };

        var feedback = Ext.create('eavl.widgets.FeedbackWidget', {});
        
        var pdStore = Ext.create('Ext.data.Store', {
            model : 'eavl.models.ParameterDetails',
            autoLoad : true,
            proxy : {
                type : 'ajax',
                url : 'validation/getCompositionalParameterDetails.do',
                extraParams: {
                    includePredictionParam: true
                },
                reader : {
                    type : 'json',
                    rootProperty : 'data'
                }
            },
            listeners: {
                load : function(pdStore, records, successful, eOpts) {
                    if (successful) {
                        initSuccess(records)
                    } else {
                        initError();
                    }
                }
            }
        });
    }

});
