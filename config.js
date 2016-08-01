/******************************************************************************
 * Copyright (c) HHS OnTime 2016. All rights reserved.                        *
 *                                                                            *
 * @author Tim Visee                                                          *
 * @website http://timvisee.com/                                              *
 *                                                                            *
 * Open Source != No Copyright                                                *
 *                                                                            *
 * Permission is hereby granted, free of charge, to any person obtaining a    *
 * copy of this software and associated documentation files (the "Software"), *
 * to deal in the Software without restriction, including without limitation  *
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,   *
 * and/or sell copies of the Software, and to permit persons to whom the      *
 * Software is furnished to do so, subject to the following conditions:       *
 *                                                                            *
 * The above copyright notice and this permission notice shall be included    *
 * in all copies or substantial portions of the Software.                     *
 *                                                                            *
 * You should have received a copy of The MIT License (MIT) along with this   *
 * program. If not, see <http://opensource.org/licenses/MIT/>.                *
 ******************************************************************************/

/******************************************************************************
 * Configuration base.                                                        *
 ******************************************************************************/
var config = {};
config.debug = {};
config.db = {};
config.redis = {};
config.api = {};
config.web = {};
config.user = {};
config.security = {};
config.session = {};


/******************************************************************************
 * Application debug configuration.                                           *
 ******************************************************************************/

/**
 * NodeJS debug name for the server.
 * @type {string}
 */
config.debug.name = 'Dworek:server';


/******************************************************************************
 * MongoDB database configuration.                                            *
 ******************************************************************************/

/**
 * MongoDB host.
 * @type {string}
 */
config.db.host = '127.0.0.1';

/**
 * MongoDB port.
 * @type {number}
 */
config.db.port = 27017;

/**
 * MongoDB database name.
 * @type {string}
 */
config.db.db = 'dworek';

/**
 * Maximum number of allowed connections in MongoDB connection pool.
 * @type {number}
 */
config.db.maxConnectionPoolSize = 20;

/**
 * MongoDB connection URL.
 * @type {string}
 */
config.db.url = 'mongodb://' + config.db.host + ':' + config.db.port + '/' + config.db.db + '?maxPoolSize=' + config.db.maxConnectionPoolSize;


/******************************************************************************
 * Web configuration.                                                         *
 ******************************************************************************/

/**
 * Web server listening port.
 * @type {*|number}
 */
config.web.port = process.env.WEB_PORT || 3000;


/******************************************************************************
 * User configuration.                                                        *
 ******************************************************************************/

/**
 * Global salt used to hash user passwords.
 * @type {string}
 */
config.user.salt = 'OjERCLGYME6U8EwaPCKUN91q6wbyc5fL'; // Examples: https://goo.gl/iAzWfz


/******************************************************************************
 * Security configuration.                                                    *
 ******************************************************************************/

/**
 * Number of rounds to hash.
 * @type {string}
 */
config.security.hashRounds = 5;

/**
 * Default length of tokens, such as session tokens.
 * @type {int}
 */
config.security.tokenLength = 64;


/******************************************************************************
 * Session configuration.                                                     *
 ******************************************************************************/

/**
 * Default token length in characters.
 * @type {int}
 */
config.session.tokenLength = config.security.tokenLength;

/**
 * Maximum lifetime in seconds of a session.
 * @type {int}
 */
config.session.expire = 60 * 60 * 24 * 365;

/**
 * Number of seconds a session expires after it has been unused.
 * @type {number}
 */
config.session.expireUnused = 60 * 60 * 24 * 16;


// Export the configuration
module.exports = config;