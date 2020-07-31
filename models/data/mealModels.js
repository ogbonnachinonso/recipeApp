const mongoose = require('mongoose');

let mealSchema = new mongoose.Schema({
 category: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  ingredients: {
    type: String,
    required: true,
  },
  instructions: {
    type: String,
    required: true,
  },

  img: String
   
});



module.exports = mongoose.model('Meal', mealSchema);


