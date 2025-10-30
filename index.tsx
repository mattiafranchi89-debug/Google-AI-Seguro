
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
type Player = {
  id: string;
  name: string;
  role: string;
  number: string;
};

type Training = {
  id: string;
  date: string;
};

type AttendanceStatus = 'present' | 'absent' | 'justified';

type Attendance = {
  [trainingId: string]: {
    [playerId: string]: AttendanceStatus;
  };
};

type Match = {
  id: string;
  date: string;
  time: string;
  opponent: string;
  location: 'Casa' | 'Trasferta';
};

type Convocation = {
    [matchId: string]: string[]; // Array of player IDs
};

type MatchStats = {
    [matchId: string]: {
        [playerId: string]: {
            goals: number;
            yellowCards: number;
            redCards: number;
            minutesPlayed: number;
        }
    }
};

type ChatMessage = {
    sender: 'user' | 'ai' | 'loading' | 'error';
    text: string;
    // FIX: Updated ChatMessage type to allow optional uri and title for groundingLinks to match Gemini API response.
    groundingLinks?: { web: { uri?: string; title?: string; } }[];
};

// FIX: Added 'Calendario' to ActiveTab type to resolve type errors.
type ActiveTab = 'Partite' | 'Risultati' | 'Classifica' | 'Marcatori' | 'Calendario' | 'Giocatori' | 'Allenamenti' | 'Statistiche' | 'Assistente AI';


// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBJK6lIIbkA-VO06VOcQjfkwBq0HEXsc-M",
  authDomain: "seguro-calcio.firebaseapp.com",
  projectId: "seguro-calcio",
  storageBucket: "seguro-calcio.firebasestorage.app",
  messagingSenderId: "679847669085",
  appId: "1:679847669085:web:133e6f4446d2bf25c7ccb4",
  measurementId: "G-Q7J689KBCK"
};

// --- INITIALIZATION ---
const firebaseApp = (window as any).firebase.initializeApp(firebaseConfig);
const db = firebaseApp.firestore();
const auth = firebaseApp.auth();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- CONSTANTS ---
const TEAM_NAME = "Seguro Calcio";
const TEAM_LOGO_BASE64 = "data:image/jpeg;base64,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ڈیٹا]>
</content>
  </change>
</changes>
```