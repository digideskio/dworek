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

var express = require('express');
var router = express.Router();

var pageJoin = require('./join');
var pageInfo = require('./info');
var pagePlayers = require('./player/index');
var pageTeams = require('./team/index');
var pageManage = require('./manage');
var pageLang = require('./language');
var pageFactory = require('./factory/index');
var pageSpecial = require('./special/index');

var CallbackLatch = require('../../util/CallbackLatch');
var LayoutRenderer = require('../../layout/LayoutRenderer');
var GameParam = require('../../router/middleware/GameParam');

// Games overview, redirect back to the front page
router.get('/', (req, res) => res.redirect('/'));

// Attach the game param middleware
GameParam.attach(router);

// Game page
router.get('/:game', function(req, res, next) {
    // Make sure the user has a valid session
    if(!req.requireValidSession())
        return;

    // Get the game and user
    const game = req.game;
    const user = req.session.user;

    // Call back if the game is invalid
    if(game === undefined) {
        // Create an error instance, and configure it
        var err = new Error('This game does not exist.');
        err.status = 404;

        // Call back the error
        next(err);
        return;
    }

    // Create a game and user object
    var gameObject = {
        id: game.getIdHex()
    };
    var userObject = {};

    // Create a callback latch for the games properties
    var latch = new CallbackLatch();

    // Make sure we only call back once
    var calledBack = false;

    // Fetch the game name
    latch.add();
    game.getName(function(err, name) {
        // Call back errors
        if(err !== null) {
            if(!calledBack)
                next(err);
            calledBack = true;
            return;
        }

        // Set the property
        gameObject.name = name;

        // Resolve the latch
        latch.resolve();
    });

    // Fetch the game stage
    latch.add();
    game.getStage(function(err, stage) {
        // Call back errors
        if(err !== null) {
            if(!calledBack)
                next(err);
            calledBack = true;
            return;
        }

        // Set the property
        gameObject.stage = stage;

        // Resolve the latch
        latch.resolve();
    });

    // Fetch the game's users count
    latch.add();
    game.getUsersCount(function(err, usersCount) {
        // Call back errors
        if(err !== null) {
            if(!calledBack)
                next(err);
            calledBack = true;
            return;
        }

        // Set the property
        gameObject.usersCount = usersCount;

        // Resolve the latch
        latch.resolve();
    });

    // Fetch the user state for this game
    latch.add();
    game.getUserState(user, function(err, userState) {
        // Call back errors
        if(err !== null) {
            if(!calledBack)
                next(err);
            calledBack = true;
            return;
        }

        // Set the property
        gameObject.userState = userState;

        // Resolve the latch
        latch.resolve();
    });

    // Count the number of teams for this game
    latch.add();
    game.getTeamCount(function(err, teamCount) {
        // Call back errors
        if(err !== null) {
            if(!calledBack)
                next(err);
            calledBack = true;
            return;
        }

        // Set the number of teams
        gameObject.teamCount = teamCount;

        // Resolve the latch
        latch.resolve();
    });

    // Determine whether the user is game host
    latch.add();
    game.getUser(function(err, host) {
        // Call back errors
        if(err !== null) {
            if(!calledBack)
                next(err);
            calledBack = true;
            return;
        }

        // Make sure the user isn't null
        if(host === null) {
            userObject.isHost = false;
            return;
        }

        // Set whether the user is
        userObject.isHost = host.getId().equals(user.getId());

        // Resolve the latch
        latch.resolve();
    });

    // Determine whether the user is administrator
    latch.add();
    user.isAdmin(function(err, isAdmin) {
        // Call back errors
        if(err !== null) {
            if(!calledBack)
                next(err);
            calledBack = true;
            return;
        }

        // Set whether the user is administrator
        userObject.isAdmin = isAdmin;

        // Resolve the latch
        latch.resolve();
    });

    // Render the page when we're ready
    latch.then(function() {
        // Render the game page
        //noinspection JSCheckFunctionSignatures
        LayoutRenderer.render(req, res, next, 'game/index', gameObject.name, {
            game: gameObject,
            user: userObject
        });
    });
});

// Route the game join page
pageJoin.route(router);

// Route the game info page
pageInfo.route(router);

// Route the game players page
pagePlayers.route(router);

// Route the game teams page
pageTeams.route(router);

// Route the game management page
pageManage.route(router);

// Route the game language page
pageLang.route(router);

// Route the factory page
pageFactory.route(router);

// Route the special pages
pageSpecial.route(router);

// Export the module
module.exports = router;
