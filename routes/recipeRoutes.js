const express = require('express');
const router = express.Router();
const passport = require('passport');
const crypto = require('crypto');
const async = require('async');
const nodemailer = require('nodemailer');
const Meal = require('../models/data/mealModels');
const Admin = require('../models/data/adminModels');
const { request } = require("express");


function isAuthUser(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  req.flash("error_msg", "Please Login in fisrt to access this page");
  res.redirect('/login');
}

//login get route

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/signup', (req, res) => {
  res.render('signup');
});

router.get('/changepassword', (req, res) => {
  res.render('change');
});

router.get('/password/new', (req, res) => {
  res.render('newpassword');
});

router.get('/forgot', (req, res) => {
  res.render('forgot');
});

router.get('/reset/:token', (req, res) => {
  Admin.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
    .then(user => {
      if (!user) {
        req.flash('error_msg', 'Password reset token is invalid or has expired');
        res.redirect('/forgot');
      }
      res.render('change', { token: req.params.token });
    })
    .catch(err => {
      req.flash('error_msg', 'ERROR:' + err);
      res.redirect('/forgot');
    })
});
//Post New Password Route
router.post('/password/new', isAuthUser, (req, res) => {
  if (req.body.password !== req.body.confirmpassword) {
    req.flash('error_msg', "Password don't match. Type Again!");
    return res.redirect('/password/new');
  }
  Admin.findOne({ email: req.user.email })
    .then(user => {
      user.setPassword(req.body.password, err => {
        user.save()
          .then(user => {
            req.flash('success_msg', 'Password Changed Successfully.');
            res.redirect('/dashboard')
          })
          .catch(err => {
            req.flash('error_msg', 'ERROR: ' + err);
            res.redirect('/password/new');
          })
      })
    })

});
//Post Reset Route
router.post('/reset/:token', (req, res) => {
  async.waterfall([
    (done) => {
      Admin.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
        .then(user => {
          if (!user) {
            req.flash('error_msg', 'Password reset token is invalid or has expired');
            res.redirect('/forgot');
          }
          if (req.body.password !== req.body.confirmpassword) {
            req.flash('error_msg', "Password don't match");
            return res.redirect('/forgot');
          }
          user.setPassword(req.body.password, err => {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(err => {
              req.logIn(user, err => {
                done(err, user);
              })
            });
          });
        })
        .catch(err => {
          req.flash('error_msg', 'ERROR:' + err);
          res.redirect('/forgot');
        });
    },
    (user) => {
      let smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.GMAIL_EMAIL,
          pass: process.env.GMAIL_PASSWORD
        }
      });
      let mailOptions = {
        to: user.email,
        from: 'Desmond chinonsoubadire2@gmail.com',
        subject: 'Your Password is changed',
        text: 'Hello, ' + user.username + '\n\n' +
          'This is a confirmation that the password for your account' + user.email + 'has been changed.'
      };
      smtpTransport.sendMail(mailOptions, err => {
        req.flash('success_msg', 'Email sent with further instructions. Please check that.');
        res.redirect('/login');
      });
    }
  ], err => {
    res.redirect('/login');
  });
});

//signup post route
router.post('/signup', (req, res) => {
  let { username, email, password } = req.body;
  let userData = {
    username: username,
    email: email
  };
  Admin.findOne({ username: req.body.username }, function (err, user) {
    if (err)
      console.log(err);
    if (user) {
      req.flash("error_msg", "A user with that email already exists...");
      res.redirect("/signup");
    } else {
      Admin.register(userData, password, (err, user) => {
        if (err) {
          req.flash("error_msg", "ERROR:" + err);
          res.redirect('/signup');
        }
        passport.authenticate('local')(req, res, () => {
          req.flash("success_msg", "Account Created Successfully");
          res.redirect('/login')
        });
      });
    }
  });
});

// login post route
router.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: 'Invalid email or password. Try again!!'
}))

//Post route forgot password
router.post('/forgot', (req, res, next) => {
  let recoveryPassword = '';
  async.waterfall([
    (done) => {
      crypto.randomBytes(20, (err, buf) => {
        let token = buf.toString('hex');
        done(err, token);
      });
    },
    (token, done) => {
      Admin.findOne({ email: req.body.email })
        .then(user => {
          if (!user) {
            req.flash('error_msg', 'user does not exist with this email');
            return res.redirect('/forgot');
          }
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 1800000; //1/2 hour

          user.save(err => {
            done(err, token, user);
          });
        })
        .catch(err => {
          req.flash('error_msg', 'ERROR:' + err);
          res.redirect('/forgot');
        })
    },
    (token, user) => {
      let smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.GMAIL_EMAIL,
          pass: process.env.GMAIL_PASSWORD
        }
      });
      let mailOptions = {
        to: user.email,
        from: 'Desmond chinonsoubadire2@gmail.com',
        subject: 'Recovery Email from Recipe App',
        text: 'Please click the following link to recover your password:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' + 'If you did not request this, please ignore this email.'
      };
      smtpTransport.sendMail(mailOptions, err => {
        req.flash('success_msg', 'Email sent with further instructions. Please check that.');
        res.redirect('/forgot');
      })
    }
  ], err => {
    if (err) res.redirect('/forgot');
  });
});

// Get route logout
router.get('/logout', isAuthUser, (req, res) => {
  req.logout();
  req.flash('success_msg', 'You Are logged Out')
  res.redirect('/login');
})

// Get route dashboard
const verify = require("../role");

router.get("/dashboard", isAuthUser, verify.isAdmin, (req, res) => {
  Meal.find({})
    .then(stores => {
      res.render('dashboard', { stores: stores });
    })
    .catch(err => {
      req.flash('error_msg', 'ERROR: +err');
      res.redirect('/');
    })
});


// Get routes home
router.get("/", (req, res) => {
  Meal.find({})
    .then(stores => {
      res.render('index', { stores: stores });
    })
    .catch(err => {
      req.flash('error_msg', 'ERROR: +err');
      res.redirect('/dashboard');
    })
});

// Get routes addrecipe
router.get('/addrecipe', (req, res) => {
  res.render('addrecipe');
});


// Get routes edit/:id
router.get('/edit/:id', isAuthUser, verify.isAdmin, (req, res) => {

  let searchQuery = { _id: req.params.id };

  Meal.findOne(searchQuery)
    .then(store => {
      req.flash('success_msg', 'Recipe Details edited Successfully');
      res.render('edit', { store: store });
    })
    .catch(err => {
      req.flash('error_msg', 'ERROR: +err');
      res.redirect('/dashboard');
    });
});
//post request starts here
router.post('/addrecipe', isAuthUser, verify.isAdmin, (req, res) => {
  let newMeal = {
    category: req.body.category,
    name: req.body.name,
    ingredients: req.body.ingredients,
    instructions: req.body.instructions,
    img: req.body.img
  };

  Meal.create(newMeal)
    .then((store) => {
      req.flash('success_msg', 'Recipes Details Added Successfully')
      res.redirect('/dashboard')
    })
    .catch(err => {
      req.flash('error_msg', 'ERROR: +err');
      console.error(err);
      res.redirect('/addrecipe');
    });
});

router.get("/edit/:id", (req, res) => {
  let searchQuery = { _id: req.params.id };
  Meal.findOne(searchQuery)
    .then(store => {
      res.render("edit", { store });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.post('/edit/:id', isAuthUser, verify.isAdmin, (req, res) => {
  let searchQuery = { _id: req.params.id };

  Meal.updateOne(searchQuery, {
    $set: {
      category: req.body.category,
      name: req.body.name,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
      img: req.body.img
    }
  })
    .then(store => {
      req.flash('success_msg', 'Recipe data updated successfully');
      res.redirect('/dashboard');
    })
    .catch(err => {
      req.flash('error_msg', 'ERROR: +err');
      res.redirect('/dashboard');
      console.error(err)
    });
});

router.get('/search', (req, res) => {
  res.render('search', { stores: "" });
});

router.post("/recipeSearch", (req, res) => {
  let searchQuery = { category: req.body.category.toLowerCase() };

  Meal.find(searchQuery)
    .then((stores) => {
      if (!stores.length >= 1) {
        req.flash("unavailability_message", "No stores is/are available under that title...");
        return res.redirect("/details");
      } else {
        res.render("search", { stores: stores });
      }
    })
    .catch((err) => {
      console.error(err);
    });
});

// details route
router.get('/details/:id', (req, res) => {
  // let searchQuery = { title: req.body.title };
  Meal.findOne({ _id: req.params.id })
    .then((store) => {
      res.render('details', { store: store });
    })
    .catch(err => {
      req.flash('error_msg', 'ERROR: +err');
      res.redirect('/details');
      console.error(err)
    });
})



//delete request starts here
router.post('/delete/:id', isAuthUser, verify.isAdmin, (req, res) => {
  let searchQuery = { _id: req.params.id };

  Meal.remove(searchQuery)
    .then(store => {
      req.flash('success_msg', 'Recipe deleted successfully');
      res.redirect('/dashboard');
    })
    .catch(err => {
      req.flash('error_msg', 'ERROR: +err');
      res.redirect('/dashboard');
    });
});
//delete request ends here
//post request ends here
router.get('/contact', (req, res) => {
  res.render('index')
});

router.post('/send', (req, res) => {
  const output = `
      <p>You have a new contact request</p>
      <h3>Contact Details</h3>
      <ul>  
        <li>Name: ${req.body.name}</li>
        <li>Email: ${req.body.email}</li>
        <li>Phone: ${req.body.phone}</li>
        <li>Subject: ${req.body.subject}</li>
      </ul>
      <h3>Message</h3>
      <p>${req.body.message}</p>
    `;

  let transporter = nodemailer.createTransport({
    host: 'mail.botgence.com.ng',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: 'info@botgence.com.ng', // generated ethereal user
      pass: '980750botgence.'  // generated ethereal password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {
    from: '"Desmond" chinonsoubadire2@gmail.com', // sender address
    to: 'desmondubadire@yahoo.com', // list of receivers
    subject: 'Message From Recipe App', // Subject line
    text: '', // plain text body
    html: output // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    res.render('message', { msg: 'Your Email Has Been Sent Successfully' });
  });
});



module.exports = router;