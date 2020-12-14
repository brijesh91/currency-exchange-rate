const mongoose = require("mongoose")

const RatesSchema = new mongoose.Schema({
    disclaimer: {
        type: String,
        default: "Usage subject to terms: https://openexchangerates.org/terms"
    },
    license: {
        type: String,
        default: "https://openexchangerates.org/license"
    },
    // Store time in seconds
    timestamp: {
        type: Date
    },
    base: {
        type: String,
        required: true,
        default: "USD"
    },
    rates: {
        type: Object,
        required: true
    }
})

RatesSchema.pre('save', function(next) {
    console.log('Pre hook worked')
    console.log(this.isNew)
    if(this.isNew && this.timestamp != undefined) {
        console.log("New object So changing timestamp")
        console.log(this.timestamp)
        // Convert to Date object
        this.timestamp = new Date(this.timestamp * 1000)
        console.log(this.timestamp)
    }
    else if(this.isNew && this.timestamp === undefined) {
        this.timestamp = Date.now()
    } else {
        console.log('No change in timestamp')
        // console.log(this.timestamp)
    }
    next()
})

module.exports = mongoose.model("Rates", RatesSchema)