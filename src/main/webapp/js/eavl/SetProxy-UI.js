/**
 * Controls the Set Proxy page
 */
Ext.application({
    name : 'eavl-setproxy',

    init: function() {
        eavl.widgets.SplashScreen.showLoadingSplash('Loading Proxy Selection, please stand by ...');
    },

    viewport : null,

    //Here we build our GUI from existing components - this function should only be assembling the GUI
    //Any processing logic should be managed in dedicated classes - don't let this become a
    //monolithic 'do everything' function
    launch : function() {
        var initialParams = null;

        //Called if the init code fails badly
        var initError = function() {
            eavl.widgets.SplashScreen.hideLoadingScreen();
            eavl.widgets.SplashScreen.showErrorSplash('There was an error loading your data. Please try refreshing the page or contacting ' + eavl.widgets.FeedbackWidget.CONTACT + ' if the problem persists.');
        };

        var initNotReady = function(message, url) {
            eavl.widgets.SplashScreen.hideLoadingScreen();
            eavl.widgets.SplashScreen.showErrorSplash(message + Ext.util.Format.format('<br><a href="{0}">Continue</a>', url));
        };

        var initSuccess = function(records) {
            eavl.widgets.SplashScreen.hideLoadingScreen();

            Ext.tip.QuickTipManager.init();

            var p1Value = null;
            var p2Value = null;
            var p3Value = null;
            if (initialParams && !Ext.isEmpty(initialParams.proxyParameters)) {
                Ext.each(records, function(pd) {
                    if (pd.get('name') === initialParams.proxyParameters[0].numerator) {
                        p1Value = pd;
                    } else if (pd.get('name') === initialParams.proxyParameters[1].numerator) {
                        p2Value = pd;
                    } else if (pd.get('name') === initialParams.proxyParameters[2].numerator) {
                        p3Value = pd;
                    }
                });
            }
            
            var p1Denoms = [];
            var p2Denoms = [];
            var p3Denoms = [];
            if (initialParams && !Ext.isEmpty(initialParams.proxyParameters)) {
                
                Ext.each(initialParams.proxyParameters[0].denom, function(pdName) {
                    var pd = eavl.models.ParameterDetails.extractFromArray(records, pdName, true);
                    if (pd) {
                        p1Denoms.push(pd);
                    }
                });
                Ext.each(initialParams.proxyParameters[1].denom, function(pdName) {
                    var pd = eavl.models.ParameterDetails.extractFromArray(records, pdName, true);
                    if (pd) {
                        p2Denoms.push(pd);
                    }
                });
                Ext.each(initialParams.proxyParameters[2].denom, function(pdName) {
                    var pd = eavl.models.ParameterDetails.extractFromArray(records, pdName, true);
                    if (pd) {
                        p3Denoms.push(pd);
                    }
                });
            }

            Ext.app.Application.viewport = Ext.create('Ext.container.Viewport', {
                layout: 'border',
                items: [{
                    xtype: 'workflowpanel',
                    region: 'north',
                    allowNext: function(callback) {
                        var pdField1 = Ext.getCmp('setproxy-1').down('#pdfield');
                        var pdtag1 = Ext.getCmp('setproxy-1').down('#pdtagfield'); 
                        if (!pdField1.isValid() || !pdtag1.isValid()) {
                            callback(false);
                            return;
                        }

                        var pdField2 = Ext.getCmp('setproxy-2').down('#pdfield');
                        var pdtag2 = Ext.getCmp('setproxy-2').down('#pdtagfield');
                        if (!pdField2.isValid() || !pdtag2.isValid()) {
                            callback(false);
                            return;
                        }

                        var pdField3 = Ext.getCmp('setproxy-3').down('#pdfield');
                        var pdtag3 = Ext.getCmp('setproxy-3').down('#pdtagfield');
                        if (!pdField3.isValid() || !pdtag3.isValid()) {
                            callback(false);
                            return;
                        }

                        Ext.Ajax.request({
                            url: 'setproxy/saveAndSubmitProxySelection.do',
                            params : {
                                numerator1 : pdField1.getValue(),
                                denom1 : pdtag1.getValue(),
                                
                                numerator2 : pdField2.getValue(),
                                denom2 : pdtag2.getValue(),
                                
                                numerator3 : pdField3.getValue(),
                                denom3 : pdtag3.getValue(),
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

                                callback("taskwait.html?" + Ext.Object.toQueryString({taskId: responseObj.data, next: 'results.html'}));
                            }
                        });
                    }
                },{
                    xtype: 'panel',
                    region: 'center',
                    border: false,
                    padding: '0 40 10 40',
                    style: {
                        'background-color' : 'white'
                    },
                    layout: {
                        type: 'hbox',
                        align : 'stretch',
                        pack : 'center'
                    },
                    items: [{
                        xtype: 'setproxyselection',
                        flex: 1,
                        title: 'Proxy Ratio 1',
                        margin: '0 10 0 0',
                        id: 'setproxy-1',
                        allPds : records,
                        pdNumerator: p1Value,
                        pdDenominator: p1Denoms
                    },{
                        xtype: 'setproxyselection',
                        flex: 1,
                        title: 'Proxy Ratio 2',
                        margin: '0 10 0 0',
                        id: 'setproxy-2',
                        allPds : records,
                        pdNumerator: p2Value,
                        pdDenominator: p2Denoms
                    },{
                        xtype: 'setproxyselection',
                        flex: 1,
                        title: 'Proxy Ratio 3',
                        id: 'setproxy-3',
                        allPds : records,
                        pdNumerator: p3Value,
                        pdDenominator: p3Denoms
                    }]
                }]
            });
        };
        
        var feedback = Ext.create('eavl.widgets.FeedbackWidget', {});

        var pdStore = Ext.create('Ext.data.Store', {
            model : 'eavl.models.ParameterDetails',
            proxy : {
                type : 'ajax',
                url : 'validation/getCompositionalParameterDetails.do',
                extraParams: {
                    file: eavl.models.EAVLJob.FILE_IMPUTED_SCALED_CSV,
                    includePredictionParam: false
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

        //Before loading
        Ext.Ajax.request({
            url: 'results/getJobStatus.do',
            callback: function(options, success, response) {
                if (!success) {
                    initError();
                    return;
                }

                var responseObj = Ext.JSON.decode(response.responseText);
                if (!responseObj.success) {
                    initError();
                    return;
                }

                if (responseObj.data.status === eavl.models.EAVLJob.STATUS_THRESHOLD ||
                    responseObj.data.status === eavl.models.EAVLJob.STATUS_PROXY ||
                    responseObj.data.status === eavl.models.EAVLJob.STATUS_SUBMITTED ||
                    responseObj.data.status === eavl.models.EAVLJob.STATUS_KDE_ERROR ||
                    responseObj.data.status === eavl.models.EAVLJob.STATUS_DONE) {
                    initialParams = responseObj.data;
                    pdStore.load();
                    return;
                }

                //At this point imputation hasn't been run/hasn't finished
                if (responseObj.data.status === eavl.models.EAVLJob.STATUS_UNSUBMITTED) {
                    initNotReady("There's no record of an imputation task running for this job. Did you complete the validation steps?", "validate.html");
                    return;
                }
                if (responseObj.data.status === eavl.models.EAVLJob.STATUS_IMPUTE_ERROR) {
                    initNotReady("Imputation failed. Did you remove all the non compositional parameters? You can try resubmitting.", "validate.html");
                    return;
                }

                //OK imputation is running - shift to loading page
                if (responseObj.data.status === eavl.models.EAVLJob.STATUS_IMPUTING) {
                    window.location.href = "taskwait.html?" + Ext.Object.toQueryString({taskId: responseObj.data.imputationTaskId, next: 'predictor.html'});
                }
            }
        });
    }
});



/**
 * Internal grouping of a ParameterDetails field and ProxyDetailsPanel. Not really designed for
 * use outside of the SetProxy GUI
 */
Ext.define('eavl.setproxy.ProxySelectionPanel', {
    extend: 'Ext.container.Container',

    alias: 'widget.setproxyselection',

    constructor : function(config) {
        var me = this;

        var pd = config.pdNumerator ? config.pdNumerator : null;
        var denom = config.pdDenominator ? config.pdDenominator : null;
        var allPds = config.allPds ? config.allPds : null;
        
        Ext.apply(config, {
            xtype: 'container',
            layout: {
                type: 'vbox',
                align : 'center',
                pack : 'center'
            },
            items : [{
                xtype: 'panel',
                title: config.title,
                width: '100%',
                layout : 'anchor',
                border: false,
                plugins: [{
                    ptype: 'headerhelp',
                    text: 'A proxy ratio requires a single parameter to act as numerator and at least one other parameter to be compared against.'
                }],
                items: [{
                    xtype : 'pdcombo',
                    width: '100%',
                    height: 45,
                    itemId : 'pdfield',
                    emptyText : 'Select a proxy.',
                    margin: '0 0 10 0',
                    allowBlank: false,
                    parameterDetails: allPds,
                    value: pd,
                    listeners: {
                        change : function(combo, newValue, oldValue) {
                            var proxypanel = combo.ownerCt.ownerCt.down("#proxy-panel");
                            proxypanel.showParameterDetails(combo.getParameterDetails());
                            
                            var tagField = combo.ownerCt.ownerCt.down("#pdtagfield");
                            var allTags = [];
                            Ext.each(allPds, function(pd) {
                                allTags.push(pd.get('name'));
                            });
                            
                            tagField.setValue(allTags);
                        }
                    }
                },{
                    xtype : 'pdtagfield',
                    width: '100%',
                    title: config.title,
                    itemId : 'pdtagfield',
                    emptyText : 'Select sub composition(s) for the proxy ratio.',
                    margin: '0 0 10 0',
                    allowBlank: false,
                    value: denom,
                    minimumSelections: 2,
                    parameterDetails: allPds, 
                    listeners: {
                        change: function(tagfield, newValue, oldValue) {
                            //The denominator must ALWAYS have a tag matching the numerator
                            var pdField = tagfield.ownerCt.ownerCt.down("#pdfield");
                            var numName = pdField.getValue();
                            if (numName) {
                                if (!Ext.Array.contains(newValue, numName)) {
                                    updatedValues = Ext.Array.clone(newValue);
                                    updatedValues.push(numName);
                                    tagfield.setValue(updatedValues);
                                }
                            }
                        }
                    }
                }]
            },{
                xtype: 'proxypanel',
                itemId: 'proxy-panel',
                width: '100%',
                emptyText: 'Select a proxy above to examine it here.',
                flex: 1,
                targetChartWidth: 700,
                targetChartHeight: 400,
                preserveAspectRatio: true,
                parameterDetails: pd
            }]
        });

        this.callParent(arguments);
    }
});
