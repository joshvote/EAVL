/**
 * Controls the Set Proxy page
 */
Ext.application({
    name : 'eavl-results',

    init: function() {
        eavl.widgets.SplashScreen.showLoadingSplash('Loading results browser, please stand by ...');
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

        var initNotReady = function(message, url) {
            eavl.widgets.SplashScreen.hideLoadingScreen();
            eavl.widgets.SplashScreen.showErrorSplash(message + Ext.util.Format.format('<br><a href="{0}">Continue</a>', url));
        };

        var initSuccess = function(records) {
            eavl.widgets.SplashScreen.hideLoadingScreen();

            Ext.tip.QuickTipManager.init();

            Ext.app.Application.viewport = Ext.create('Ext.container.Viewport', {
                layout: 'border',
                items: [{
                    xtype: 'workflowpanel',
                    region: 'north'
                },{
                    xtype: 'panel',
                    region: 'center',
                    border: false,
                    padding: '0 40 10 40',
                    style: {
                        'background-color': 'white'
                    },
                    layout: {
                        type: 'hbox',
                        align : 'stretch',
                        pack : 'center'
                    },
                    items: [{
                        xtype : 'eavljoblist',
                        title : 'Available Jobs',
                        width: 320,
                        jobs : records,
                        margin: '0 10 0 0',
                        viewConfig : {
                            deferEmptyText : false,
                            emptyText : '<div class="jobs-empty-container"><div class="jobs-empty-container-inner">No jobs available.</div></div>'
                        },
                        listeners: {
                            select: function(sm, job) {
                                Ext.getCmp('jobfilelist').showFilesForJob(job);
                            },
                            jobdelete: function(sm, job) {
                                Ext.getCmp('jobfilelist').showFilesForJob(null);
                                Ext.getCmp('filepreviewpanel').clearPreview();
                                
                            }
                        }
                    },{
                        xtype: 'container',
                        flex: 1,
                        layout: {
                            type: 'vbox',
                            align : 'center',
                            pack : 'center',
                            enableSplitters: true
                        },
                        items: [{
                            xtype: 'jobfilelist',
                            id: 'jobfilelist',
                            width: '100%',
                            height: 345,
                            margin: '0 0 10 0',
                            title: 'File Browser',
                            hasDataView: function(job, fileName) {
                                return fileName.endsWith(".csv");
                            },
                            hasPreview: function(job, fileName) {
                                return fileName.endsWith("cenlr.csv") || fileName.endsWith("cp.csv");
                            },
                            listeners: {
                                dataview : function(jobFileList, fileName, job) {
                                    if (fileName.endsWith(".csv")) {
                                        Ext.getCmp('filepreviewpanel').preview(job, fileName, "csv");
                                    }
                                },
                                preview : function(jobFileList, fileName, job) {
                                    if (fileName === eavl.models.EAVLJob.FILE_IMPUTED_CENLR_CSV) {
                                        Ext.getCmp('filepreviewpanel').preview(job, fileName, "threedscatterplot");
                                    } else if (fileName === eavl.models.EAVLJob.FILE_CP_CSV) {
                                        Ext.getCmp('filepreviewpanel').preview(job, fileName, "bhestimate");
                                    }
                                }
                            }
                        },{
                            xtype: 'splitter'
                        },{
                            xtype: 'filepreviewpanel',
                            id: 'filepreviewpanel',
                            flex: 1,
                            title: 'Preview',
                            width: '100%',
                        }]
                    }]
                }]
            });
            
            var feedback = Ext.create('eavl.widgets.FeedbackWidget', {});
        };

        var jobStore = Ext.create('Ext.data.Store', {
            model : 'eavl.models.EAVLJob',
            autoLoad: true,
            proxy : {
                type : 'ajax',
                url : 'results/getJobsForUser.do',
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
