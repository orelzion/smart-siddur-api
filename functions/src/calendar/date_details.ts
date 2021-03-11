import { HebDate } from "../types/calendar_types";

export class DateDetails {

    readonly isShabbat: boolean
    readonly isYomTov: boolean
    readonly isRoshHodesh: boolean
    readonly isHoliday: boolean
    readonly isFastDay: boolean
    readonly omer: number
    // readonly birkatHashanim: BirkatHashanim

    constructor(readonly events: EventDetails[], myZmanimDay: any, hebrewDate: HebDate) {
        this.isShabbat = events.find(event => event.category === EventCategory.Shabbat) != undefined;
        this.isYomTov = events.find(event => event.category === EventCategory.YomTov) != undefined;
        this.isRoshHodesh = this.events.find(event => event.category === EventCategory.RoshChodesh) != undefined;
        this.isHoliday = this.events.find(event => event.category === EventCategory.Holiday) != undefined;;
        this.isFastDay = this.events.find(event => event.category === EventCategory.Fast) != undefined;
        this.omer = myZmanimDay.Time.Omer
        // this.birkatHashanim = this.getBirkatHashanim(hebrewDate.asNumeric);
    }

    // getBirkatHashanim(hebrewDate: HebDate, gregorianDate: Date, isDiaspora: boolean): BirkatHashanim {
    //     let winterStartDay = () => {
    //         if (isDiaspora) {
    //             let dayToStart = leapYear(gregorianDate.getFullYear() + 1) ? 5 : 6;
    //             let yearToStart = gregorianDate.getMonth() < 6 ? // It's defiantly after the right time, so let's go back a year
    //                 gregorianDate.getFullYear() - 1 :
    //                 gregorianDate.getFullYear();
    //             return new Date(yearToStart, 12, dayToStart, 3, 10);
    //         }
    //     }


    //     if (hebrewDateAsNumber > 2.15 && hebrewDateAsNumber < 7.21) {
    //         // If date is after Iyar 15th and before Tishri 21
    //         return BirkatHashanim.Summer;
    //     } else if (hebrewDateAsNumber > 1.15 && hebrewDateAsNumber <= 2.15) {
    //         // If date is after first day of Pesach and before 30 days has passed
    //         return BirkatHashanim.SummerStart;
    //     } else if (hebrewDateAsNumber < 1.15) {
    //         // If date is before Pesach
    //         return BirkatHashanim.Winter;
    //     } else {
    //         if (isDiaspora) {

    //         } else {
    //             if (hebrewDateAsNumber > 8.7) { // Is after Cheshvan 7th
    //                 return BirkatHashanim.Winter;
    //             } else {
    //                 return BirkatHashanim.TalUmatar;
    //             }
    //         }
    //     }
    // }
}

// function leapYear(year: number) {
//     return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
// }

// enum BirkatHashanim {
//     WinterStart,
//     Winter,
//     SummerStart,
//     Summer
// }

// enum TalUmatar {
//     WinterStart,
//     Winter,
//     SummerStart,
//     Summer
// }

export enum EventCategory {
    RoshChodesh,
    Holiday,
    Shabbat,
    Fast,
    Omer,
    YomTov,
    ModernHoliday
}

export class EventDetails {

    static fromHebDate(hebDate: any): EventDetails | undefined {
        let category: EventCategory | null = null;

        switch (hebDate.category) {
            case 'holiday':
                if (hebDate.subcat === 'modern') {
                    category = EventCategory.ModernHoliday;
                } else if (hebDate.subcat === 'shabbat') {
                    category = EventCategory.Shabbat;
                } else if (hebDate.subcat === 'fast') {
                    category = EventCategory.Fast;
                } else if (hebDate.yomtov) {
                    category = EventCategory.YomTov;
                } else {
                    category = EventCategory.Holiday;
                }
                break;
            case 'parashat':
                category = EventCategory.Shabbat;
                break;
            case 'omer':
                category = EventCategory.Omer;
                break;
            case 'roshchodesh':
                category = EventCategory.RoshChodesh;
                break;
        }

        if (category != null) {
            return new EventDetails(hebDate.title, hebDate.hebrew, category);
        } else {
            console.error("Category could not be assigned to " + hebDate);
            return undefined;
        }
    }

    private constructor(
        readonly titleEnglish: string,
        readonly titleHebrew: string,
        readonly category: EventCategory
    ) { }
}