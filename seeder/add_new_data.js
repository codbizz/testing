require('dotenv').config()
var MONGODB_URL = process.env.MONGODB_URL
var mongoose = require('mongoose')
const TestModel = require('../models/TestModel')
const SetModel = require('../models/SetModel')
const QuestionModel = require('../models/QuestionModel')
const QuestionTestRelation = require('../models/QuestionTestRelation')
const Config = require('../models/Config')
mongoose
    .connect(MONGODB_URL)
    .then(async () => {
        // Define the data to insert
 
        const dataToInsert = {
            key: 'points_per_currency',
            value: '100',
        };

        // Insert the data into the database
        async function seed() {
            try {
                const config = new Config(dataToInsert);
                await config.save();
                console.log('Data inserted successfully.');
            } catch (err) {
                console.error('Error inserting data:', err);
            } finally {
                // Close the database connection
                mongoose.connection.close();
            }
        }

        // Run the seeder
        seed();

    })
    .catch(err => {
        console.error('App starting error:', err.message)
    })
