var mongoose = require('mongoose')

var ConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    value: { 
      type: String,
      required: true,
    },
  },
  { timestamps: true }
)

// Virtual for user's full name

module.exports = mongoose.model('Config', ConfigSchema)
