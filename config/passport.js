var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var User = require('../app/models/user');
var configAuth = require('./auth'); // use this one for testing

module.exports = function (passport) {

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    passport.use('local-login', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
        function (req, username, password, done) {
            // asynchronous
            process.nextTick(function () {
                User.findOne({ 'local.username': username }, function (err, user) {
                    if (err)
                        return done(err);
                    if (!user)
                        return done(null, false, req.flash('loginMessage', 'No user found.'));
                    if (!user.validPassword(password))
                        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                    else
                        return done(null, user);
                });
            });

        }));

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
        function (req, username, password, done) {
            
            // asynchronous
            process.nextTick(function () {
                if (!req.user) {
                    User.findOne({ 'local.username': username }, function (err, user) {
                        if (err)
                            return done(err);
                        if (user) {
                            return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                        } else {
                            var newUser = new User();
                            newUser.type = 'local';
                            newUser.local.username = username;
                            newUser.local.email = req.body.email;
                            newUser.local.password = newUser.generateHash(password);
                            newUser.save(function (err) {
                                if (err)
                                    return done(err);
                                return done(null, newUser);
                            });
                        }
                    });
                } else if (!req.user.local.username) {
                    User.findOne({ 'local.username': username }, function (err, user) {
                        if (err)
                            return done(err);
                        if (user) {
                            return done(null, false, req.flash('loginMessage', 'That username is already taken.'));
                        } else {
                            var user = req.user;
                            user.type = 'local';
                            user.local.username = username;
                            user.local.email = req.body.email;
                            user.local.password = user.generateHash(password);
                            user.save(function (err) {
                                if (err)
                                    return done(err);
                                return done(null, user);
                            });
                        }
                    });
                } else {
                    return done(null, req.user);
                }
            });
        }));

    // // =========================================================================
    // // GOOGLE ==================================================================
    // // =========================================================================
    // passport.use(new GoogleStrategy({

    //     clientID: configAuth.googleAuth.clientID,
    //     clientSecret: configAuth.googleAuth.clientSecret,
    //     callbackURL: configAuth.googleAuth.callbackURL,
    //     passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    // },
    //     function (req,refreshToken, profile, done) {
    //         // asynchronous
    //         process.nextTick(function () {
    //             //console.log(req.user);
    //             // check if the user is already logged in
    //             if (!req.user) {
    //                 console.log(profile);
    //                 console.log(profile.emails);

    //                 User.findOne({ 'google.email': (profile.emails[0].value || '').toLowerCase() }, function (err, user) {
    //                     if (err)
    //                         return done(err);

    //                     if (user) {

    //                         // // if there is a user id already but no token (user was linked at one point and then removed)
    //                         // if (!user.google.token) {
    //                         //     user.google.token = token;
    //                         //     user.google.name = profile.displayName;
    //                         //     user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

    //                         //     user.save(function (err) {
    //                         //         if (err)
    //                         //             return done(err);

    //                         //         return done(null, user);
    //                         //     });
    //                         // }

    //                         return done(null, user);
    //                     } else {
    //                         var newUser = new User();

    //                         //newUser.google.id = profile.id;
    //                         //newUser.google.token = token;
    //                         newUser.google.displayName = profile.displayName;
    //                         newUser.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

    //                         newUser.save(function (err) {
    //                             if (err)
    //                                 return done(err);

    //                             return done(null, newUser);
    //                         });
    //                     }
    //                 });
    //             } else {
    //                 // user already exists and is logged in, we have to link accounts
    //                 var user = req.user; // pull the user out of the session
    //                 //user.google.id = profile.id;
    //                 //user.google.token = token;
    //                 user.google.displayName = profile.displayName;
    //                 user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
    //                 user.save(function (err) {
    //                     if (err)
    //                         return done(err);
    //                     return done(null, user);
    //                 });
    //             }
    //         });
    //     }));

    passport.use(new GoogleStrategy({

        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
        callbackURL: configAuth.googleAuth.callbackURL,
        passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
        function (req, token, refreshToken, profile, done) {

            // asynchronous
            process.nextTick(function () {
                if (!req.user) {
                    User.findOne({ 'google.id': profile.id }, function (err, user) {
                        if (err)
                            return done(err);
                        if (user) {
                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.google.token) {
                                user.type = 'google';
                                user.google.token = token;
                                user.google.name = profile.displayName;
                                user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
                                user.save(function (err) {
                                    if (err)
                                        return done(err);
                                    return done(null, user);
                                });
                            }
                            return done(null, user);
                        } else {
                            var newUser = new User();
                            newUser.type = 'google';
                            newUser.google.id = profile.id;
                            newUser.google.token = token;
                            newUser.google.name = profile.displayName;
                            newUser.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
                            newUser.save(function (err) {
                                if (err)
                                    return done(err);
                                return done(null, newUser);
                            });
                        }
                    });
                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user = req.user; // pull the user out of the session
                    user.type = 'google';
                    user.google.id = profile.id;
                    user.google.token = token;
                    user.google.name = profile.displayName;
                    user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                    user.save(function (err) {
                        if (err)
                            return done(err);
                        return done(null, user);
                    });
                }
            });
        }));
};