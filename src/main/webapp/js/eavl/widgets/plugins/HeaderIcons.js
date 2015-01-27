/**
 * A plugin for an Ext.panel.Panel class that will modify the header
 * to contain a number of clickable icons (surrounding the header text)
 */
Ext.define('eavl.widgets.plugins.HeaderIcons', {
    alias: 'plugin.headericons',
    
    panel : null,
    header : null,
    iconsLeft : null,
    iconsText : null,

    /**
     * Adds the following constructor args
     * {
     *  icons : Object[] - The icons to display in this header (see schema below)
     * }
     * 
     * icon schema:
     * {
     *  location - ['left', 'text'] - Will the icon be aligned to the left or after the header text? 
     *  src - String - the image source href
     *  tip - String - [Optional] tooltip text (if any)
     *  handler - function() - called when the icon is clicked.
     *  style - Mixed - String/Object containing style information for the icon img
     *  width - Number - width of the icon
     *  height - Number - height of the icon
     * }
     */
    constructor : function(cfg) {
        var me = this;
        this.iconsLeft = [];
        this.iconsText = [];
        if (cfg.icons) {
            Ext.each(cfg.icons, function(i) {
                if (i.location === 'left') {
                    me.iconsLeft.push(i);
                } else {
                    me.iconsText.push(i);
                }
            });
        }
        
        this.callParent(arguments);
    },

    _iconCfgToMarkup : function(iconCfg, left, containerHeight) {
        var style = {
            'vertical-align': 'middle',
            'margin-top': '-4px',
            display: 'inline-block'
        };
        if (left) {
            style['margin-right'] = Math.floor((iconCfg.width / 2)) + 'px'
        } else {
            style['margin-left'] = Math.floor((iconCfg.width / 2)) + 'px'
        }
        
        return {
            tag: 'div',
            //'data-qtip': iconCfg.tip,
            style: style,
            children: [{
                tag: 'img',
                width: iconCfg.width,
                height: iconCfg.height,
                style: iconCfg.style ? iconCfg.style : '',
                src: iconCfg.src
            }]  
        };
    },
    
    init: function(panel) {
        if (panel.rendered) {
            this.afterRender(panel);
        } else {
            panel.on('afterrender', this.afterRender, this, {single: true});
        }
    },
    
    afterRender : function(panel) {
        var me = this;
        
        me.panel = panel;
        me.header = panel.getHeader();
        
        
        var headerEl = me.header.getEl();
        var containerEl = headerEl.down('.x-panel-header-text-container');
        var textEl = headerEl.down('.x-panel-header-text');
        
        var containerHeight = containerEl.getHeight();
        containerEl.setStyle('overflow', 'visible');
        containerEl.setStyle('height', containerHeight); //fix the height to its current size 

        var tipCfg = {
            showDelay: 200,
            dismissDelay: 10000  
        };
        Ext.each(me.iconsLeft, function(iconCfg) {
            var newEl = Ext.DomHelper.insertBefore(textEl, me._iconCfgToMarkup(iconCfg, true, containerHeight), true);
            if (iconCfg.handler) {
                newEl.on('click', iconCfg.handler);
            }
            if (iconCfg.tip) {
                tipCfg.text = iconCfg.tip;
                tipCfg.target = newEl;
                Ext.tip.QuickTipManager.register(tipCfg);
            }
        });
        
        Ext.each(me.iconsText, function(iconCfg) {
            var newEl = Ext.DomHelper.insertAfter(textEl, me._iconCfgToMarkup(iconCfg, false, containerHeight), true);
            if (iconCfg.handler) {
                newEl.on('click', iconCfg.handler);
            }
            if (iconCfg.tip) {
                tipCfg.text = iconCfg.tip;
                tipCfg.target = newEl;
                Ext.tip.QuickTipManager.register(tipCfg);
            }
        });
    }

});