import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
	apiKey: "AIzaSyAtUPhMKwJxUDwQUPezFsojNPMn0gUkkoA",
	authDomain: "pacer-firebase-react-storage.firebaseapp.com",
	projectId: "pacer-firebase-react-storage",
	storageBucket: "pacer-firebase-react-storage.appspot.com",
	messagingSenderId: "915079763418",
	appId: "1:915079763418:web:c46f1f943da1071c59dce3"
};
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);