const express = require('express')
const Rates = require('../models/Rates')
const axios = require('axios')
const validator = require('validator')
const e = require('express')

const router = express.Router()

router.post('/api/latest', async (req, res) => {
    const addLatestRate = new Rates({
        ...req.body
    })
    try {
        await addLatestRate.save()
        res.status(201).send(addLatestRate)
    } catch (error) {
        res.status(400).send(error)
    }
})

const latestData = async (oldData, timeDifferenceInSecs) => {
    const url = 'https://openexchangerates.org/api/latest.json?app_id=' + process.env.APP_ID
    try {
        const res = await axios.get(url)
        // console.log(res)
        const addLatestRate = new Rates({
            ...res.data
        })
        let result = {}
        if (oldData === undefined) {
            console.log('Calling openexchangerate.org\'s API since DB is empty')
            result = await addLatestRate.save()
            return result
        }

        let date1 = oldData.timestamp.toISOString().slice(0, 10)
        let date2 = new Date(res.data.timestamp * 1000).toISOString().slice(0, 10)

        // console.log(date1)
        // console.log(date2)

        if ((date1 === date2 && timeDifferenceInSecs > 3600)) {
            console.log('Updating old data based on a same date')
            result = await Rates.findByIdAndUpdate(oldData._id,
                {
                    rates: res.data.rates,
                    timestamp: res.data.timestamp * 1000
                }, {
                new: true,
                runValidators: true
            })
            // console.log(result.timestamp)
            await result.save()
            // console.log(result)
        } else {
            console.log('New object')
            result = await addLatestRate.save()
        }

        console.log('saved')
        return result
    } catch (error) {
        return { error: true, message: error.message}
    }
}

router.get('/api/latest', async (req, res) => {

    let getLastRecord = await Rates.find({}).sort({ _id: -1 }).limit(1)
    let result = getLastRecord[0]

    // Convert Date object in seconds
    const oldTimeInSeconds = getLastRecord.length === 0 ? undefined : Math.floor(Date.parse(getLastRecord[0].timestamp) / 1000)
    const currentSeconds = getLastRecord.length === 0 ? undefined : Math.floor(Date.now() / 1000)
    let difference = currentSeconds - oldTimeInSeconds
    // console.log(difference)
    if (getLastRecord.length === 0) {
        console.log('DB is empty')
        result = await latestData(undefined, undefined)
    }
    else if (difference > 3600) {
        console.log('Difference is greater than an hour')
        result = await latestData(getLastRecord[0], difference)
    }
    try {
        res.status(200).send(result)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.get('/api/historical/:date', async (req, res) => {
    let date = req.params.date
    let dateFormat = validator.isDate(date, { format: "YYYY-MM-DD", strictMode: true })
    if (!dateFormat) {
        return res.status(400).send({ error: true, message: "Date should be in YYYY-MM-DD format" })
    }
    date = new Date(date)
    console.log(date)
    // console.log(date.getFullYear())
    if (date.getFullYear() < 1970) {
        return res.status(400).send({ message: "Invalid date" })
    }

    let nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)
    console.log(nextDate)
    try {
        const result = await Rates.find({
            timestamp: {
                $gte: date,
                $lt: nextDate
            }
        }).sort({ _id: -1 }).limit(1)
        // console.log(result)
        res.status(200).send(result)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.get('/api/time-range', async (req, res) => {
    let startDate = req.query.start
    let endDate = req.query.end

    let startDateFormat = validator.isDate(startDate, { format: "YYYY-MM-DD", strictMode: true })
    // console.log(startDateFormat)
    let endDateFormat = validator.isDate(endDate, { format: "YYYY-MM-DD", strictMode: true })
    if (!startDateFormat || !endDateFormat) {
        return res.status(400).send({
            error: true, message: "Date should be in YYYY-MM-DD format"
        })
    }

    startDate = new Date(startDate)
    endDate = new Date(endDate)
    // Check before adding 1 to the end date
    if (startDate > endDate) {
        return res.status(400).send({ error: true, message: "Invalid date range" })
    }
    endDate.setDate(endDate.getDate() + 1)
    console.log(startDate)
    console.log(endDate)

    try {
        const result = await Rates.find({
            timestamp: {
                $gte: startDate,
                $lt: endDate
            }
        })
        // console.log(result)
        res.status(200).send(result)
    } catch (error) {
        res.status(400).send(error)
    }
})

module.exports = router