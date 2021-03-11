import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';
import { withAuth, searchUser, addPackage } from './admin';
import * as calendar from "./calendar";
import { CityInfo } from './types/calendar_types';

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

// Api end points
app.get('/user/:user', (req, res) => {
    withAuth(req, res, () => {
        const userName = req.params.user
        console.log("userName = " + userName);
        searchUser(userName)
            .then((user) => {
                res.status(200).json(user.toJSON());
            })
            .catch((err) => {
                res.status(500).json(err);
            })
    })
});

// Add package to user
app.post('/user/:uid/package', (req, res) => {
    withAuth(req, res, () => {
        const uid = req.params.uid;
        console.log("uid = " + uid);
        addPackage(uid)
            .then((success) => {
                res.status(200).json(success);
            })
            .catch((err) => {
                res.status(500).json(err);
            });
    })
});

app.get('/test/hebCal', (req, res) => {
    // calendar.default(new Date(), "Bnei Brak", { latitude: 32.0849, longitude: 34.8352 })
    //     .then(calendarRef => {
    //         res.status(200).json({ "ref": calendarRef })
    //     })

    calendar.generateCalendar(new Date(), new CityInfo({ latitude: 32.0849, longitude: 34.8352 },
        { city: "Bnei Brak", country: "Israel" }, 27504641)).then(calendar => {
            // console.log(calendar);
            res.status(200).json(calendar);
        }).catch(err => {
            console.error(err);
            res.status(500).json({"error": err });
        })
})

export const api = functions.https.onRequest(app);
