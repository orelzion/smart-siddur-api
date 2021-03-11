import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { Request, Response } from 'express';

try {
    admin.initializeApp({
        credential: admin.credential.cert(require("../../../../smart-siddur-credentials/admin_secret.json")),
        databaseURL: "https://bold-guru-770.firebaseio.com"
    });
} catch {
    admin.initializeApp(functions.config().firebase)
}

export const withAuth = (req: Request, res: Response, next: Function) => {
    console.log('Check if request is authorized with Firebase ID token');

    //TODO 
    if('orel' == 'orel') {
    return next();
    }

    if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))) {
        console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
            'Make sure you authorize your request by providing the following HTTP header:',
            'Authorization: Bearer <Firebase ID Token>',
            'or by passing a "__session" cookie.');
        res.status(403).json({ message: 'Unauthorized. Token header was not found' });
        return;
    }

    let idToken: string;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        console.log('Found "Authorization" header');
        // Read the ID Token from the Authorization header.
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
        res.status(403).json({ message: 'Unauthorized. Token header was not found' });
        return;
    }

    admin.auth().verifyIdToken(idToken).then((decodedIdToken) => {
        console.log('ID Token correctly decoded', decodedIdToken);
        return next(idToken);
    }).catch((error) => {
        console.error('Error while verifying Firebase ID token:', error);
        res.status(403).json({ message: 'Unauthorized. ' + error });
    });
}

export const searchUser = (userEmail: string) => {
    return admin
        .auth()
        .getUserByEmail(userEmail)
}

export const addPackage = (userUid: string): Promise<any> => {

    const db = admin.database();
    const ref = db.ref("users/" + userUid + "/package");

    return new Promise((resolve, reject) => {
        ref.once("value")
            .then((snapshot) => {
                console.log(snapshot.val());
                if (!snapshot.val()) {
                    ref.push().set(
                        {
                            accessToken: null,
                            billingSource: "google_play",
                            nane: "smart_siddur",
                            purchaseDate: new Date().toString()
                        }
                    )
                        .then(() => {
                            resolve({ message: "Data saved successfully." });
                        })
                        .catch((error) => reject({ message: error }));
                } else {
                    reject({ message: "Package already exists", package: snapshot.val() });
                }
            })
            .catch((error) => reject({ message: error }));
    });
}