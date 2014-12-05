/**
 * Controls the Upload page
 */
Ext.application({
    name : 'eavl-upload',


    init: function() {
        eavl.widgets.SplashScreen.showLoadingSplash('Loading upload form, please stand by ...');
    },

    //Here we build our GUI from existing components - this function should only be assembling the GUI
    //Any processing logic should be managed in dedicated classes - don't let this become a
    //monolithic 'do everything' function
    launch : function() {

        eavl.widgets.SplashScreen.hideLoadingScreen();

        var jobId = null;

        var showCSVGrid = function(id, parameterDetails) {
            jobId = id;
            var parent = Ext.getCmp('parent-container');
            if (parent.down('#csvGrid')) {
                parent.down('#csvGrid').destroy();
            }

            parent.add(Ext.create('eavl.widgets.CSVGrid', {
                itemId: 'csvGrid',
                jobId: id,
                readOnly: true,
                sortColumns: false,
                width: 1000,
                parameterDetails : parameterDetails,
                title: 'Double check the file has been read correctly...',
                flex: 1,
                margin: '0 0 10 0'
            }));


        };

        var viewport = Ext.create('Ext.container.Viewport', {
            layout: 'border',
            items : [{
                xtype: 'workflowpanel',
                region: 'north',
                height: 200,
                allowNext : function(callback) {
                    if (jobId == null) {
                        eavl.widgets.util.HighlightUtil.highlight(Ext.getCmp('upload-form'), eavl.widgets.util.HighlightUtil.ERROR_COLOR);
                        callback(false);
                        return;
                    }

                    callback(true);
                }
            },{
                xtype: 'container',
                id : 'parent-container',
                region: 'center',
                style: {
                    'background-color' : 'white'
                },
                layout : {
                    type: 'vbox',
                    align: 'center',
                    pack: 'start'
                },
                items: [{
                    xtype: 'form',
                    id: 'upload-form',
                    title: 'Choose CSV file to upload for processing',
                    width: 300,
                    margin: '30 0 10 0',
                    bodyPadding : '30 10 10 10',
                    items : [{
                        xtype: 'filefield',
                        name: 'file',
                        anchor : '100%',
                        hideLabel: true,

                        listeners : {
                            change : function(ff, value, eOpts) {
                                var formPanel = ff.findParentByType('form');
                                var form = formPanel.getForm();
                                if (!form.isValid()) {
                                    return;
                                }

                                //Submit our form so our files get uploaded...
                                form.submit({
                                    url: 'validation/uploadFile.do',
                                    scope : this,
                                    params : {
                                        jobId : jobId
                                    },
                                    success: function(form, action) {
                                        if (!action.result.success) {
                                            Ext.Msg.alert('Error uploading file. ' + action.result.error);
                                            return;
                                        }

                                        var pdList = [];
                                        Ext.each(action.result.data.parameterDetails, function(o) {
                                            pdList.push(Ext.create('eavl.models.ParameterDetails', o));
                                        });

                                        showCSVGrid(action.result.data.id, pdList);
                                    },
                                    failure: function() {
                                        Ext.Msg.alert('Failure', 'File upload failed. Please try again in a few minutes.');
                                    },
                                    waitMsg: 'Uploading file, please wait...',
                                    waitTitle: 'Upload file'
                                });
                            }
                        }
                    }]
                }]
            }]
        });



    }
});
