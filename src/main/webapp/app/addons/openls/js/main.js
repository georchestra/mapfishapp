Ext.namespace("GEOR.Addons");

GEOR.Addons.OpenLS = function(map, options) {
    this.map = map;
    this.options = options;
};

GEOR.Addons.OpenLS.prototype = {
    win: null,
    addressField: null,
    layer: null,
    popup: null,
    _requestCount: 0,

    /**
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {
        this.addressField = this._createCbSearch();
        this.layer = new OpenLayers.Layer.Vector("addon_openls_vectors", {
            displayInLayerSwitcher: false,
            styleMap: new OpenLayers.StyleMap({
                "default": {
                    graphicName: "cross",
                    pointRadius: 16,
                    strokeColor: "fuchsia",
                    strokeWidth: 2,
                    fillOpacity: 0
                }
            })
        });
        this.win = new Ext.Window({
            title: OpenLayers.i18n('openls.window_title'),
            width: 440,
            closable: true,
            closeAction: "hide",
            resizable: false,
            border: false,
            cls: "openls",
            items: [{
                xtype: "form",
                labelWidth: 60,
                bodyStyle: "padding:5px;",
                labelSeparator: OpenLayers.i18n("labelSeparator"),
                items: [this.addressField]
            }],
            listeners: {
                "hide": function() {
                    this.popup && this.popup.destroy();
                    this.map.removeLayer(this.layer);
                },
                "show": function() {
                    this.popup && this.popup.destroy();
                    this.layer.destroyFeatures();
                    this.map.addLayer(this.layer);
                },
                scope: this
            }
        });
        var lang = OpenLayers.Lang.getCode(),
            item = new Ext.menu.Item({
                text: record.get("title")[lang] || record.get("title")["en"],
                qtip: record.get("description")[lang] || record.get("description")["en"],
                iconCls: "addon-openls",
                handler: this.showWindow,
                scope: this
            });
        this.item = item;
        return item;
    },

    /**
     * Method: _readPosition
     * Extracts the gml:Point > gml:pos String from the incoming GeocodedAddress
     *
     * Parameters:
     * v - {String}
     * node - {XML} the XML data corresponding to one GeocodedAddress record
     *
     * Returns: {OpenLayers.Geometry.Point}
     */
    _readPosition: function(v, node) {
        var elements = [], 
            uri = 'http://www.opengis.net/gml', 
            name = 'pos',
            pos = "", geom = null;
        // inspired by OpenLayers XML format getElementsByTagNameNS
        if(node.getElementsByTagNameNS) {
            elements = node.getElementsByTagNameNS(uri, name);
        } else {
            // brute force method
            var allNodes = node.getElementsByTagName("*");
            var potentialNode, fullName;
            for(var i=0, len=allNodes.length; i<len; ++i) {
                potentialNode = allNodes[i];
                fullName = (potentialNode.prefix) ?
                           (potentialNode.prefix + ":" + name) : name;
                if((name == "*") || (fullName == potentialNode.nodeName)) {
                    if((uri == "*") || (uri == potentialNode.namespaceURI)) {
                        elements.push(potentialNode);
                    }
                }
            }
        }
        // inspired by OpenLayers XML format getChildValue
        if (elements.length > 0) {
            n = elements[0];
            for(var child=n.firstChild; child; child=child.nextSibling) {
                switch(child.nodeType) {
                    case 3: // text node
                    case 4: // cdata section
                        pos += child.nodeValue;
                }
            }
        }
        // typical pos value here: "48.829685 2.375251" (Paris)
        if (pos.length) {
            var p = pos.split(" ");
            if (this.xy == true) {
                // we assume here that the order is [long lat]
                geom = new OpenLayers.Geometry.Point(p[0], p[1]);
            } else {
                // we assume here that the order is [lat long]
                geom = new OpenLayers.Geometry.Point(p[1], p[0]);
            }
        }
        return geom;
    },

    /*
     * Method: _createCbSearch
     * Returns: {Ext.form.ComboBox}
     */
    _createCbSearch: function() {
        var fields = [
                //{name: 'geom', mapping: 'gml:Point > gml:pos'}, 
                // -> fails in ExtJS on line 26570 in XMLReader's createAccessor method:
                // Ext.DomQuery.selectValue(key, root); 
                // ... where root is the record node and key is the provided mapping.
                // As a result, we're using a custom convert method
                {
                    name: 'geometry', 
                    convert: this._readPosition.createDelegate({
                        xy: this.options.xy
                    })
                },
            ].concat(this.options.GeocodedAddressFields),

        storeOptions = {
            // TODO: use GeoExt.data.ProtocolProxy instead
            proxy: new Ext.data.HttpProxy({
                url: this.options.serviceURL,
                method: "POST"
            }),
            // TODO: implement a GeoExt.data.XLSGeocodeResponseReader
            reader: new Ext.data.XmlReader({
                record: "Response > GeocodeResponse > GeocodeResponseList > GeocodedAddress"
            }, fields),
            listeners: {
                "beforeload": function(store, options) {
                    var params = store.baseParams;
                    this._requestCount += 1;
                    params.xmlData = [
                        '<?xml version="1.0" encoding="UTF-8"?>',
                        '<XLS',
                           ' xmlns:xls="http://www.opengis.net/xls"',
                           ' xmlns:gml="http://www.opengis.net/gml"',
                           ' xmlns="http://www.opengis.net/xls"',
                           ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
                           ' version="1.2"',
                           ' xsi:schemaLocation="http://www.opengis.net/xls http://schemas.opengis.net/ols/1.2/olsAll.xsd">',
                            '<RequestHeader/>',
                            '<Request requestID="', this._requestCount, '" version="1.2" methodName="LocationUtilityService">',
                               '<GeocodeRequest returnFreeForm="false">',
                                 '<Address countryCode="StreetAddress">',
                                   '<freeFormAddress>', params['query'], '</freeFormAddress>',
                                 '</Address>',
                               '</GeocodeRequest>',
                            '</Request>',
                        '</XLS>'
                    ].join('');
                    // not to pollute the query string:                        
                    delete params['query'];
                },
                scope: this
            }
        };
        if (this.options.sortField) {
            storeOptions.sortInfo =  {
                field: this.options.sortField,
                direction: "DESC"
            };
        }
        var store = new Ext.data.Store(storeOptions),

        tplResult = new Ext.XTemplate(
            '<tpl for="."><div class="search-item">',
                this.options.comboTemplate,
            '</div></tpl>'
        );

        return new Ext.form.ComboBox({
            name: "address",
            width: 350,
            emptyText: OpenLayers.i18n('openls.field_emptytext'),
            fieldLabel: OpenLayers.i18n('openls.field_label'),
            store: store,
            loadingText: OpenLayers.i18n('Loading...'),
            queryDelay: 100,
            hideTrigger: true,
            tpl: tplResult,                      // template to display results
            itemSelector: 'div.search-item',     // needed by the template
            queryParam: 'query',         // do not modify
            minChars: 10,                        // min characters number to
                                                 // trigger the search
            pageSize: 0,                         // removes paging toolbar
            listeners: {
                "select": this._onComboSelect,
                scope: this
            }
        });
    },

    /*
     * Method: _onComboSelect
     * Callback on combo selected
     */
    _onComboSelect: function(combo, record) {
        var bbox, geom;
        this.popup && this.popup.destroy();
        this.layer.destroyFeatures();
        if (!record.get("geometry")) {
            return;
        }
        geom = record.get("geometry").transform(new OpenLayers.Projection("EPSG:4326"), this.map.getProjectionObject());
        var feature = new OpenLayers.Feature.Vector(geom);
        this.layer.addFeatures([feature]);
        this.popup = new GeoExt.Popup({
            //title: 'My Popup',
            location: feature,
            width: 200,
            html: new Ext.XTemplate(
                '<tpl for="."><div class="search-item">',
                    this.options.comboTemplate,
                '</div></tpl>'
            ).apply(record.data),
            anchorPosition: "top-left",
            collapsible: false,
            closable: false,
            unpinnable: false
        });
        this.popup.show();
        if (record.get("bbox")) {
            // we assume lbrt here, like "2.374215;48.829177;2.375391;48.829831"
            // note: this looks very specific to the French Geoportail OLS service
            bbox = OpenLayers.Bounds.fromArray
                (record.get("bbox").split(";")
            ).transform(new OpenLayers.Projection("EPSG:4326"), this.map.getProjectionObject());
        } else {
            bbox = geom.getBounds();
        }
        this.map.zoomToExtent(bbox);
    },

    /**
     * Method: showWindow
     */
    showWindow: function() {
        this.win.show();
        this.win.alignTo(
            Ext.get(this.map.div),
            "t-t",
            [0, 5],
            true
        );
    },

    /**
     * Method: destroy
     * Called by GEOR_tools when deselecting this addon
     */
    destroy: function() {
        this.win.hide();
        this.popup.destroy();
        this.layer = null;
        this.map = null;
    }
};