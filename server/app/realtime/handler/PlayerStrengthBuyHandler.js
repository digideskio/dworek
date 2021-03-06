/******************************************************************************
 * Copyright (c) Dworek 2016. All rights reserved.                            *
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

var _ = require('lodash');

var Core = require('../../../Core');
var PacketType = require('../PacketType');

/**
 * Type of packets to handle by this handler.
 * @type {number} Packet type.
 */
const HANDLER_PACKET_TYPE = PacketType.PLAYER_STRENGTH_BUY;

/**
 * Location update handler.
 *
 * @param {boolean=false} init True to initialize after constructing.
 *
 * @class
 * @constructor
 */
var PlayerStrengthBuyHandler = function(init) {
    // Initialize
    if(init)
        this.init();
};

/**
 * Initialize the handler.
 */
PlayerStrengthBuyHandler.prototype.init = function() {
    // Make sure the real time instance is initialized
    if(Core.realTime === null)
        throw new Error('Real time server not initialized yet');

    // Register the handler
    Core.realTime.getPacketProcessor().registerHandler(HANDLER_PACKET_TYPE, this.handler);
};

/**
 * Handle the packet.
 *
 * @param {Object} packet Packet object.
 * @param socket SocketIO socket.
 */
PlayerStrengthBuyHandler.prototype.handler = function(packet, socket) {
    // Make sure we only call back once
    var calledBack = false;

    // Create a function to call back an error
    const callbackError = function(err) {
        // Print the error
        console.error('An error occurred while buying strength upgrades for a factory');
        if(err !== null && err !== undefined)
            console.error(err.stack || err);

        // Only call back once
        if(calledBack)
            return;

        // Send a message to the user
        Core.realTime.packetProcessor.sendPacket(PacketType.MESSAGE_RESPONSE, {
            error: true,
            message: 'Failed to buy upgrade, a server error occurred.',
            dialog: true
        }, socket);

        // Set the called back flag
        calledBack = true;
    };

    // Make sure a session is given
    if(!packet.hasOwnProperty('index') || !packet.hasOwnProperty('cost') || !packet.hasOwnProperty('strength')) {
        console.log('Received malformed packet');
        callbackError(new Error('Malformed packet'));
        return;
    }

    // Get the raw parameters
    const rawGame = packet.game;
    const index = packet.index;
    const cost = packet.cost;
    const strength = packet.strength;

    // Make sure the user is authenticated
    if(!_.has(socket, 'session.valid') || !socket.session.valid) {
        // Send a message response to the user
        Core.realTime.packetProcessor.sendPacket(PacketType.MESSAGE_RESPONSE, {
            error: true,
            message: 'Failed to buy strength upgrade, you\'re not authenticated.',
            dialog: true
        }, socket);
        return;
    }

    // Get the user
    const user = socket.session.user;

    // Get the game
    Core.model.gameModelManager.getGameById(rawGame, function(err, game) {
        // Call back errors
        if(err !== null) {
            callbackError(err);
            return;
        }

        // Get the game user
        Core.model.gameUserModelManager.getGameUser(game, user, function(err, gameUser) {
            // Call back errors
            if(err !== null) {
                callbackError(err);
                return;
            }

            Core.gameManager.getGame(game, function(err, liveGame) {
                // Call back errors
                if(err !== null || liveGame === null) {
                    callbackError(err);
                    return;
                }

                // Get the current strength of the player
                gameUser.getStrength(function(err, userStrength) {
                    // Call back errors
                    if(err !== null) {
                        callbackError(err);
                        return;
                    }

                    // Get the game configuration
                    game.getConfig(function(err, gameConfig) {
                        // Call back errors
                        if(err !== null) {
                            callbackError(err);
                            return;
                        }

                        // Get the upgrades
                        const upgrades = gameConfig.player.getStrengthUpgrades(userStrength);

                        // Make sure the index is in-bound
                        if(index < 0 || index >= upgrades.length) {
                            Core.realTime.packetProcessor.sendPacket(PacketType.MESSAGE_RESPONSE, {
                                error: true,
                                message: 'Failed to buy strength, prices have changed.',
                                dialog: true
                            }, socket);
                            return;
                        }

                        // Get the strength
                        var selectedStrength = upgrades[index];

                        // Compare the price and strength
                        if(selectedStrength.cost !== cost || selectedStrength.strength !== strength) {
                            Core.realTime.packetProcessor.sendPacket(PacketType.MESSAGE_RESPONSE, {
                                error: true,
                                message: 'Failed to buy strength, prices have changed.',
                                dialog: true
                            }, socket);
                            return;
                        }

                        // Make sure the user has enough money
                        gameUser.getMoney(function(err, money) {
                            // Call back errors
                            if(err !== null) {
                                callbackError(err);
                                return;
                            }

                            if(money < selectedStrength.cost) {
                                Core.realTime.packetProcessor.sendPacket(PacketType.MESSAGE_RESPONSE, {
                                    error: true,
                                    message: 'Failed to buy defence, you don\'t have enough money.',
                                    dialog: true
                                }, socket);
                                return;
                            }

                            // Subtract the money
                            gameUser.subtractMoney(selectedStrength.cost, function(err) {
                                // Call back errors
                                if(err !== null) {
                                    callbackError(err);
                                    return;
                                }

                                // Get the current strength
                                gameUser.getStrength(function(err, strength) {
                                    // Call back errors
                                    if(err !== null) {
                                        callbackError(err);
                                        return;
                                    }

                                    // Set the new strength
                                    gameUser.setStrength(strength + selectedStrength.strength, function(err) {
                                        // Call back errors
                                        if(err !== null) {
                                            callbackError(err);
                                            return;
                                        }

                                        // Update the game state for this user
                                        Core.gameManager.sendGameData(game, user, undefined, function(err) {
                                            if(err !== null)
                                                console.error('Failed to send game data to user, ignoring');
                                        });

                                        // Send a notification to the user
                                        Core.realTime.packetProcessor.sendPacket(PacketType.MESSAGE_RESPONSE, {
                                            error: false,
                                            message: 'Transaction succeed!',
                                            dialog: false,
                                            toast: true
                                        }, socket);

                                        // Get the live user
                                        liveGame.getUser(user, function(err, liveUser) {
                                            // Call back errors
                                            if(err !== null) {
                                                console.error(err.stack || err);
                                                console.error('Failed to get user, unable to broadcast factory data, ignoring');
                                                return;
                                            }

                                            // Loop through all factories in this game
                                            liveGame.factoryManager.factories.forEach(function(liveFactory) {
                                                // Check whether this user is in range of the given factory
                                                if(!liveFactory.isInRangeMemory(liveUser))
                                                    return;

                                                // Broadcast the updated state for this factory to everyone, as the conquer value has changed
                                                liveFactory.broadcastData(function(err) {
                                                    // Handle errors
                                                    if(err !== null) {
                                                        console.error('Failed to broadcast factory data to user, ignoring');
                                                        console.error(err.stack || err);
                                                    }
                                                });
                                            });
                                        });
                                    });
                                }, {
                                    noCache: true
                                });
                            });
                        }, {
                            noCache: true
                        });
                    });
                }, {
                    noCache: true
                });
            });
        });
    });
};

// Export the module
module.exports = PlayerStrengthBuyHandler;
