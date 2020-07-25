const express = require('express');
const router = express.Router();
const passport = require('passport');
const nodemailer = require('nodemailer');
const Meal = require('../models/data/mealModels');
const Admin = require('../models/data/adminModels');
const { request } = require("express");


function isAuthUser(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login');
}

//login get route

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/signup', (req, res) => {
  res.render('signup');
});

//signup post route
router.post('/signup', (req, res) => {
  let { username, password } = req.body;
  let userData = {
    username
  };
  Admin.findOne({ username: req.body.username }, function (err, user) {
    if (err)
      console.log(err);
    if (user) {
      req.flash("error_msg", "A user with that username already exists...");
      res.redirect("/signup");
    } else {
      Admin.register(userData, password, (err) => {
        if (err) {
          console.log(err)
          res.redirect('/signup');
        }
        passport.authenticate('local')(req, res, () => {
          req.flash("success_msg", "Account Created Successfully");
          console.log('Account Created Successfully');
          res.redirect('/login')
        });
      });
    }
  });
});

// login post route
router.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  falureRedirect: '/login'
}))


router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You Are logged Out')
  res.redirect('/login');
})

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

router.get('/addrecipe', (req, res) => {
  res.render('addrecipe');
});


// ///
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
    name: req.body.name,
    title: req.body.title,
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

  router.post('/edit/:id', isAuthUser, verify.isAdmin,(req, res) => {
    let searchQuery = { _id: req.params.id };
  
    Meal.updateOne(searchQuery, {
      $set: {
          name: req.body.name,
          title: req.body.title,
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
    let searchQuery = { name: req.body.name};
  
    Meal.find(searchQuery)
      .then((stores) => {
        if(!stores.length >= 1){
           req.flash("unavailability_message", "No stores is/are available under that title...");
         return res.redirect("/details");
         }else{
          res.render("search", { stores:stores });
         }
      })
      .catch((err) => {
        console.error(err);
      });
  });

// details route
  router.get('/details/:id', (req, res) => {
    // let searchQuery = { title: req.body.title };
    Meal.findOne( { _id: req.params.id } )
      .then((store) => {
        res.render('details', { store:store });
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
  router.get('/contact',(req, res) => {
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
      tls:{
        rejectUnauthorized:false
      }
    });
  
    // setup email data with unicode symbols
    let mailOptions = {
        from: '"Recipe" <info@botgence.com.ng>', // sender address
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
  
        res.render('message', {msg:'Your Email Has Been Sent Successfully'});
    });
  });



  module.exports = router;