import { DateDetails } from '../calendar/date_details'

export interface LatLng {
    latitude: number,
    longitude: number
}

export interface Address {
    city: string,
    state?: string,
    country: string
}

export class CityInfo {

    readonly name: string;
    readonly isDiaspora: boolean;

    constructor(
        readonly latLng: LatLng,
        readonly address: Address,
        readonly locationId: number
    ) {
        this.isDiaspora = this.address.country !== "Israel";
        this.name = `${this.address.city}, ${this.address.state ? this.address.state + ", " : ""} ${this.address.country}`;
    }
}

export enum HebrewMonth {
    Nissan = 1,
    Iyar,
    Sivan,
    Tamuz,
    Av,
    Elul,
    Tishri,
    Cheshvan,
    Kislev,
    Tevet,
    Shvat,
    Adar,
    AdarI,
    AdarII
}

export interface Limud {
    url: string,
    title: { [key: string]: string; },
    displayValue: { [key: string]: string; },
    category: { [key: string]: string; }
}

export class HebDate {

    readonly asNumeric: number;

    constructor(
        readonly dayInWeek: number,
        readonly dayInMonth: number,
        readonly month: HebrewMonth,
        readonly year: number
    ) {
        this.asNumeric = parseFloat(this.month + "." + this.dayInMonth);
    }
}

export class GregorianDate {
    constructor(readonly dateStart: Date,
        readonly dateEnd: Date) { }

    static fromMyZmanim(myZmanim: any) {
        return new GregorianDate(
            myZmanim.Zman.SunsetDefault,
            myZmanim.Zman.TomorrowSunsetDefault
        )
    }
}

export interface Day {
    cityInfo: CityInfo,
    hebDate: HebDate,
    dateDetails: DateDetails,
    gregorianDate: GregorianDate,
    limudYomi: Limud[],
    zmanim: { [key: string]: Date; }
}

// let example: Day = {
//     locationId: "43242",
//     locationName: "Bnei Brak, Israel",
//     hebDate: {
//         dayInWeek: 1,
//         dayInMonth: 30,
//         month: HebrewMonth.AdarI,
//         year: 5779
//     },
//     dateDetails: {
//         isFastDay: false,
//         isShabbat: true,
//         isYomTov: true
//     },
//     zmanim: {
//         "misheyakir": new Date("0001-01-01T00:00:00Z")
//     },
//     limudYomi: [
//         {
//             url: "Exodus.38.21-40.38",
//             category: {
//                 "en": "Parashat Hashavua",
//                 "he": "פרשת השבוע"
//             },
//             title: {
//                 "en": "Pekudei",
//                 "he": "פקודי"
//             }
//         }
//     ]
// }