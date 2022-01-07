/*
 * Copyright (C) 2009-2022 by the geOrchestra PSC
 *
 * This file is part of geOrchestra.
 *
 * geOrchestra is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * geOrchestra is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * geOrchestra.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.georchestra.mapfishapp.ws;

import javax.sql.DataSource;

/**
 * This service handles the storage and the loading of a sld file on a temporary
 * directory.
 * 
 * @author yoann buch - yoann.buch@gmail.com
 *
 */
public class SLDDocService extends A_DocService {

    public static final String FILE_EXTENSION = ".sld";
    public static final String MIME_TYPE = "application/vnd.ogc.sld+xml";
    public static final String SCHEMA_URL = "http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd";

    public SLDDocService(final String tempDir, DataSource pgpool) {
        super(FILE_EXTENSION, MIME_TYPE, tempDir, pgpool);
    }

    /*
     * =================================Overridden
     * methods===============================================
     */

    /**
     * Called before saving the content
     * 
     * @throws DocServiceException
     */
    @Override
    protected void preSave() throws DocServiceException {

        // check if sld content is valid towards its xsd schema
        /*
         * disabled because SLD files generated by Classifier are not valid (problem of
         * version) isDocumentValid(SCHEMA_URL);
         */
    }

}
