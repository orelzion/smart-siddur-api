import axios from 'axios';
import * as querystring from 'querystring';
import { LatLng } from "../types/calendar_types";

// axios.interceptors.request.use(request => {
//     console.log('Starting Request', request)
//     return request
// })

// axios.interceptors.response.use(response => {
//     console.log('Response:', response)
//     return response
// })

export const cityIdFromMyZmanim = (latLng: LatLng): Promise<any> =>
    axios.post("https://api.myzmanim.com/engine1.json.aspx/searchGps", querystring.stringify({
        "key": "ef409a14ec288af184cde2a6f42e9d34756c8a9294477d17bd8af9fb6618ac69f440e7d49971ad4e",
        "user": "0007817401",
        "latitude": latLng.latitude,
        "longitude": latLng.longitude
    }))

export const dayFromMyZmanim = (locationId: string, inputDate: Date): Promise<any> =>
    axios.post("https://api.myzmanim.com/engine1.json.aspx/getDay", querystring.stringify({
        "key": "ef409a14ec288af184cde2a6f42e9d34756c8a9294477d17bd8af9fb6618ac69f440e7d49971ad4e",
        "user": "0007817401",
        "locationid": locationId,
        "inputdate": inputDate.toISOString()
    }))

export const limudFromSefaria = (date: Date, isDiaspora: boolean): Promise<any> =>
    axios.get("https://www.sefaria.org/api/calendars", {
        params: {
            "diaspora": isDiaspora ? 1 : 0,
            "year": date.getFullYear(),
            "month": date.getMonth() + 1,
            "day": date.getDate()
        }
    })

export const holidaysFromHebCal = (gregorianYear: number, gregorianMonth: number, isDiaspora: boolean, latLng: LatLng): Promise<any> =>
    axios.get("https://www.hebcal.com/hebcal", {
        params: {
            "v": "1",
            "cfg": "json",
            "year": gregorianYear,
            "month": gregorianMonth + 1, // JS starts from 0 but hebCal api expects months that start from 1
            "maj": "on", // Major holidays
            "min": "on", //  Minor holidays (Tu BiShvat, Lag B’Omer, …)
            "nx": "on", // Rosh Chodesh
            "mf": "on", // Minor fasts (Ta’anit Esther, Tzom Gedaliah, …)
            "ss": "on", // Special Shabbatot (Shabbat Shekalim, Zachor, …)
            "mod": "on", // Modern holidays (Yom HaShoah, Yom HaAtzma’ut, …)
            "s": "on", // Parashat ha-Shavuah on Saturday,
            "c": "off", // Candle lighting times
            "o": "on", // Days of the Omer
            "i": isDiaspora ? "off" : "on",
            "geo": "pos", // Geolocation will be determined by lat/lng position
            "latitude": latLng.latitude,
            "longitude": latLng.longitude,
            "tzid": "Asia/Jerusalem" // We don't use hebcal's zmanim anyway, so we don't care about the time zone
        }
    })