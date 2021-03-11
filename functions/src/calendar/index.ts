import { cityIdFromMyZmanim, holidaysFromHebCal, dayFromMyZmanim, limudFromSefaria } from "./external_api";
import { LatLng, CityInfo, Day, HebDate, GregorianDate } from "../types/calendar_types";
import * as admin from 'firebase-admin';
import { DocumentReference } from "@google-cloud/firestore";
import { EventDetails, DateDetails } from "./date_details";


function areTheSameDates(leftDate: Date, rightDate: Date): boolean {
    return (
        leftDate.getFullYear() === rightDate.getFullYear() &&
        leftDate.getMonth() === rightDate.getMonth() &&
        leftDate.getDate() === rightDate.getDate()
    );
}

function normalizeDate(date: Date) {
    date.setHours(1, 1, 1, 1);
}

/**
 * This function generates a Hebrew dates with Zmanim out of several apis 
 * and saves it to a Firestore table so the apps can use it
 * @param date - A Gregorian date to which we generate an Hebrew date
 * @param cityName - A city name to which we generate an Hebrew date. 
 * Important for generating the right Zmanim and to determine if it's diaspora
 * @returns A string with a firestore reference to the month object with all Hebrew dates listed
 */
export default async (date: Date, cityName: string, latLng: LatLng): Promise<string> => {
    try {
        var cityInfo = await getCityId(cityName)
    } catch (err) {
        console.warn(cityName + " " + err);
        await findCityInfo(latLng);
        cityInfo = await getCityId(cityName)
    }

    try {
        var calendarRef = await getMonthReference(date, cityInfo.locationId);
    } catch (err) {
        console.warn(cityInfo + " " + err);
        calendarRef = await generateCalendar(date, cityInfo);
    }

    return calendarRef.path;
}

async function getCityId(cityName: string): Promise<CityInfo> {
    let cityInfoDoc = await admin.firestore().collection("cities")
        .doc(cityName)
        .get();
    if (cityInfoDoc.exists) {
        return <CityInfo>cityInfoDoc.data();
    } else {
        throw new Error("City info was not found for " + cityName);
    }
}

async function findCityInfo(latLng: LatLng): Promise<DocumentReference> {
    // Getting city id for lat lng required
    let cityIdResponse = await cityIdFromMyZmanim(latLng);
    if (cityIdResponse.ErrMsg) {
        throw new Error("Can't get city ID for " + latLng + " " + cityIdResponse.ErrMsg);
    }

    // Getting first response with myZmanim with some city info to save
    let myZmanimDayResponse = await dayFromMyZmanim(cityIdResponse.LocationID, new Date());
    if (myZmanimDayResponse.ErrMsg) {
        throw new Error("Can't get city info for " + latLng + " " + myZmanimDayResponse.ErrMsg);
    }

    // Creating city info from myZmanim response
    const cityInfo = new CityInfo(latLng, {
        city: myZmanimDayResponse.Place.City,
        country: myZmanimDayResponse.Place.Country,
        state: myZmanimDayResponse.Place.State
    }, cityIdResponse.LocationID);

    // Creating a new doc with city name
    let docRef = await admin.firestore().collection('cities')
        .doc(cityInfo.address.city);
    // Setting the city info to it
    docRef.set(cityInfo);

    // Returning doc reference
    return docRef;
}

async function getMonthReference(date: Date, cityId: number): Promise<DocumentReference> {
    let query = await admin.firestore().collection("months")
        .where("month", "==", date.getMonth())
        .where("cityId", "==", cityId)
        .get();
    if (query.empty || query.docs.length <= 0 || !query.docs[0].exists) {
        throw new Error("No calendar reference found");
    } else {
        return query.docs[0].ref;
    }
}

export async function generateCalendar(date: Date, cityInfo: CityInfo): Promise<any> {

    // Converting to ISO to avoid time zone differences (since myZmanim use ISO format)
    date = new Date(date.toISOString());

    // Getting all events for this month
    const hebCalResponse = await holidaysFromHebCal(date.getFullYear(), date.getMonth(), cityInfo.isDiaspora, cityInfo.latLng);

    // Getting JS dates for the full month
    let fullMonth = getFullMonth(date);

    let dayFromMyZmanimPromises = fullMonth.map(date => dayFromMyZmanim(cityInfo.locationId.toString(), date));
    let lastDateOfLastMonth = new Date();
    lastDateOfLastMonth.setDate(fullMonth[0].getDate() - 1)
    dayFromMyZmanimPromises.push(dayFromMyZmanim(cityInfo.locationId.toString(), lastDateOfLastMonth))

    let limudFromSefariaPromises = fullMonth.map(date => limudFromSefaria(date, cityInfo.isDiaspora));

    const combinedPromises = (await Promise.all([...dayFromMyZmanimPromises, ...limudFromSefariaPromises]))
        .map(item => item.data)
        .reduce((map, item) => {
            let isMyZmanim = item.Time;
            let date = new Date(isMyZmanim ? item.Time.DateCivil : item.date);

            normalizeDate(date);

            let previousEntry = map[date.getTime()]
            if (!previousEntry) {
                map[date.getTime()] = {}
            }
            if (isMyZmanim) {
                map[date.getTime()].myZmanim = item;
            } else {
                map[date.getTime()].sefaria = item;
            }

            return map;
        }, {})

    let allMonthData: Day[] = new Array();

    for (const dayInMonth of fullMonth) {
        const eventsFromHebCal = hebCalResponse.data.items
            .filter((item: any) => {
                const itemDate = new Date(item.date);
                return areTheSameDates(itemDate, dayInMonth);
            }).map((item: any) =>
                EventDetails.fromHebDate(item)
            )

        normalizeDate(dayInMonth);
        let myZmanim = combinedPromises[dayInMonth.getTime()].myZmanim;
        let yesterday = new Date();
        yesterday.setDate(dayInMonth.getDate() - 1)
        normalizeDate(yesterday);

        let myZmanimYesterday = combinedPromises[yesterday.getTime()].myZmanim;

        let hebDate = new HebDate(
            dayInMonth.getDay(),
            myZmanim.Time.DateJewish.split('-')[2],
            myZmanim.Time.DateJewish.split('-')[1],
            myZmanim.Time.DateJewish.split('-')[0],
        )

        const zmanim = myZmanim.Zman;
        zmanim["shaa_zmanit"] = getShaaZmanit(
            new Date(zmanim.SunriseDefault),
            new Date(zmanim.SunsetDefault)
        );

        allMonthData.push({
            cityInfo: cityInfo,
            dateDetails: new DateDetails(eventsFromHebCal, myZmanim, hebDate),
            limudYomi: combinedPromises[dayInMonth.getTime()].sefaria.calendar_items,
            gregorianDate: GregorianDate.fromMyZmanim(myZmanimYesterday),
            hebDate: hebDate,
            zmanim: zmanim
        })
    }

    return allMonthData;
}

function getFullMonth(date: Date): Date[] {
    let firstDay = new Date(date.getFullYear(), date.getMonth(), 1, 10);
    let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 10);

    let allDates: Date[] = new Array();
    let currentDate = firstDay
    allDates.push(new Date(currentDate.getTime()));
    while (currentDate < lastDay) {
        // Using new Date() to avoid manipulations on the item inside the array
        currentDate.setDate(currentDate.getDate() + 1);
        allDates.push(new Date(currentDate.getTime()));
    }

    return allDates;
}

function getShaaZmanit(sunrise: Date, sunset: Date): number {
    // time difference in ms
    let timeDiff = sunset.getTime() - sunrise.getTime();

    // strip the ms
    timeDiff /= 1000;

    // get seconds (Original had 'round' which incorrectly counts 0:28, 0:29, 1:30 ... 1:59, 1:0)
    // const seconds = Math.round(timeDiff % 60);

    // remove seconds from the date
    timeDiff = Math.floor(timeDiff / 60);

    // get minutes
    const minutes = Math.round(timeDiff % 60);

    return minutes / 24;
}