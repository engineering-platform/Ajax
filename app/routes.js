var User = require('../app/models/user');
module.exports = function (app, passport,session,nodemailer) {

    app.get('/', function (req, res) {
        res.render('index.ejs');
    });

    app.get('/profile', isLoggedIn, function (req, res) {
        res.render('profile.ejs', {
            user: req.user
        });
    });

    app.post('/sendEmail', function (req, res) {
        console.log(req.body.email);
        console.log(req.body.username);
        console.log(req.body.password);

        var smtpTransport = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: "arshankar38@gmail.com",
                pass: "shankarrupa38"
            }
        });

        req.session.email = req.body.email;
        req.session.username= req.body.username;
        req.session.password = req.body.password;

        var rand = Math.floor((Math.random() * 100) + 54);
        req.session.rand = rand;
        host = req.get('host');
        link = "http://" + req.get('host') + "/verify?id=" + rand;
        mailOptions = {
            to: req.session.email,
            subject: "Please confirm your Email account",
            html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
        }
        console.log(mailOptions);
        smtpTransport.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
                res.end("error");
            } else {
                console.log("Message sent: " + response.message);
                res.json({ res: "Email has been Sent!" });
                //res.end("sent");
            }
        });

    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    // app.get('/login', function(req, res) {
    //     res.render('login.ejs', { message: req.flash('loginMessage') });
    // });

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/',
        failureFlash: true
    }));


    // app.get('/signup', function(req, res) {
    //     res.render('signup.ejs', { message: req.flash('signupMessage') });
    // });


    // app.get('/signup', function(req,res,next){
    //     req._toParam = 'Hello';
    //     passport.authenticate('local-signup', {
    //         successRedirect : '/profile', 
    //         failureRedirect : '/', 
    //         failureFlash : true 
    //     })(req,res,next);
    // })
    
    
    
    // app.get('/signup', passport.authenticate('local-signup', {
    //     successRedirect : '/profile', 
    //     failureRedirect : '/', 
    //     failureFlash : true 
    // }));

    app.get('/verify',function(req,res){
        console.log(req.protocol+":/"+req.get('host'));
        if((req.protocol+"://"+req.get('host'))==("http://"+host))
        {
            console.log("Domain is matched. Information is from Authentic email");
            if(req.query.id==req.session.rand)
            {
                console.log("email is verified");
                res.redirect('/signup');
                //res.end("<h1>Email "+mailOptions.to+" is been Successfully verified");
            }
            else
            {
                console.log("email is not verified");
                res.end("<h1>Bad Request</h1>");
            }
        }
        else
        {
            res.end("<h1>Request is from unknown source");
        }
        });

        app.get('/signup',function(req,res){
            if (!req.user) {
                User.findOne({ 'local.email': req.session.email }, function (err, user) {
                    if(!user) {
                        var newUser = new User();
                        newUser.type = 'local';
                        newUser.local.username = req.session.username;
                        newUser.local.email = req.session.email;
                        newUser.local.password = newUser.generateHash(req.session.password);
                        newUser.save(function (err) {
                            if (err)
                                return res.send(err);
                            return res.redirect('/');
                        });
                    }
                });
            } else if (!req.user.local.username) {
                User.findOne({ 'local.email': req.session.email }, function (err, user) {
                    if (err)
                        return res.send(err);
                    if (!user) {
                        var user = req.user;
                        user.type = 'local';
                        user.local.username = req.session.username;
                        user.local.email = req.session.email;
                        user.local.password = user.generateHash(req.session.password);
                        user.save(function (err) {
                            if (err)
                                return res.send(err);
                            return res.redirect('/');
                        });
                    }
                });
            } else {
                return res.redirect('/');
            }
        });

    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    app.get('/auth/google/redirect',
        passport.authenticate('google', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

    // app.get('/auth/google', passport.authenticate('google', { scope : ['profile'] }));

    // // app.get('/auth/google/redirect',
    // //     passport.authenticate('google', {
    // //         successRedirect : '/profile',
    // //         failureRedirect : '/'
    // //     }));

    // app.get('auth/google/redirect', passport.authenticate('google'), (req, res) => {
    //     // res.send(req.user);
    //     console.log("routes  ",req.user);
    //     res.redirect('/profile');
    // });

    // app.get('/connect/local', function(req, res) {
    //     res.render('connect-local.ejs', { message: req.flash('loginMessage') });
    // });
    // app.post('/connect/local', passport.authenticate('local-signup', {
    //     successRedirect : '/profile', 
    //     failureRedirect : '/connect/local',
    //     failureFlash : true
    // }));

    // app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

    // app.get('/connect/google/redirect',
    //     passport.authorize('google', {
    //         successRedirect : '/profile',
    //         failureRedirect : '/'
    //     }));

    // app.get('/unlink/local', isLoggedIn, function(req, res) {
    //     var user            = req.user;
    //     user.local.email    = undefined;
    //     user.local.password = undefined;
    //     user.save(function(err) {
    //         res.redirect('/profile');
    //     });
    // });

    // app.get('/unlink/google', isLoggedIn, function(req, res) {
    //     var user          = req.user;
    //     user.google.email = undefined;
    //     user.save(function(err) {
    //         res.redirect('/profile');
    //     });
    // });
};
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}