
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
const TEAM_NAME = "Seguro";
const TEAM_LOGO_BASE64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMTEhUTExMWFhUVFyAaGBgXGSAdGhodHR4dIBsgIBoaHighGiAlGxkbITEhJSktLy4uICAzODMtNyotLysBCgoKDg0OGxAQGzcmICYvNTcvLy0tLS0tLi0tLS0tMi4tLS0tLS0tLS0tLS0tLS0vLS0tLS0tLS0tLS0tLS0tLf/AABEIAOAA4QMBEQACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAAABgQFBwMCAf/EAEcQAAIBAgQDBAYIAwYFAwUAAAECAwQRAAUSIQYxQRMiUWEHMnGBkaEUI0JSgrHB0WJy8CQzkqKy0hVDU8LhVGOTFjREc/H/AAaAQEAAgMBAAAAAAAAAAAAAAAABAUBAgMG/8QAPBEAAQMCAgULBAEEAQQDAAAAAQACAwQRBSESEzFBUSIyYXGBkaGxwdHwBhQj4UIVM5LxYjRScqIkQ4L/2gAMAwEAAhEDEQA/ANxwRGCIwRGCIwRGCIwRGCIwRQK7OYIvXkF/ujc/AcscnzMZzitmMdIbMF1RVXGq/wDLiJ82NvkL4hvxFg5ov4KYzD5Hc428fneqmp4uqD9pEHkB/wB18chVzyf22+F11NHDHnI/yHzvVVPxRIedUfwtb/RjqKbEZNjT5LiajDI9rx3k+RUR+JPGokPvfHT+lYidx/yXM4phbeH+J9l8XiMf+ok+L4f0nERuP+X7WP6rhZO7/H9KVDxQ4NxVN+Jz+T40dSYlHtafNdRVYY/Y8d5CtaTi2oHKRZB5gH5rbHE1NTGbSN7wQuzaSnkF43+IKtabjX/qRe9D+h/fHRmIt/kFzfh8g5pB8PdXlDn9PLssgB+63dPz2PuxMjqI380qJJE+PN4t5d+xWeOy5owRGCIwRGCIwRGCIwRGCIwRGCIwRGCIwRGCIwRGCKjzXiaGLur9Y/gp2Htb9r4jTVcceW0rtFTyS5tGXHd++xJ2ccTSuPrJAi/dXYH9W9mIbH1NWdGJvd7qY+KlpW6U7u/239qV6jPFGyLfzOw+HP8ALFrTfTb3cqd3YNveqqp+pWN5NOy/ScvBfaSlrqn+6jcqeqjSv+M2HzxasocPptoBPTmql+IYjVbCQOjId/7U2bgt47GqqYINXLW5ZzbnYdbXHI9cSG1rNkTCeoWUZ9C8cqZ4F+OauMo4Ap5o+0WqaRbkXjTTcjnbVe+OMmIysOjo2K7w4bG9ulp36l9yDhGhqe00/TB2baSZNC97qANJII2uCBzGE1bPFa9s+CU9FBLe18uNlW1eWZck7U7JXdorabL2bauoIAFzcbjbljq2epLNZdtu1cXw0ok1dnX7ChOH8veQQiqnhkJsFnisbnkOSgE9LnfD7qoa3S0QR0J9rTOdoBxB6QpNZ6Mp13imje33gUP/AHD540biUbsnt9V0dhcjc2O9FUVeT5hTbtFIVHUWkX4i9h7bY0fT4dU7QAe4+y6MqcSpdjjbvCjU+effX3r+x/fFbUfTY2wu7D7qypvqbO07O0eyY8m4idP7qW4H2DuP8J3HtFsU0jKyiykGXh3q4iNHWi8Jz6Mj2hOWV8WRSWWQdm3ifVPv6e/44kw1rH5HIqPNSSR57RxHqmEG+4xMUZfcERgiMERgiMERgiMERgiMERgiMERgijV9dHCuuRrD5k+AHU40e9rBdxWWtLjogXKQ894nklBF+zi6i+5H8TfoPnisfUS1DtXCPdWLKaKBmsqCPT99XhvSZV5yT3Yhz2BtufYP3+GLyi+n2tGnVG/Ru7SqSt+o3OOhSi3Tv7ArjJeA6moIknJhU/e3kP4envIt4YtX1sMDdCEd2QVSyhnqHacx79qt6ugp6OaKlpYVlq5LfWT94RjfvW5A2BNgBsL77AxxJJM0ySOs0cN/Qu7mRwPEUTbvO87leVeSVwUPHXM8oIJR1VY28RZVuo+P64jCaLMFmXbdSnQTgAtfn4Ll6Tog1CzWBKOpB52udJ/PHTDyROAtMSAdASp/AcuqggPgpHwZh+mONW20zh0rtQuvTtXLIe5XV0XQmOVfxrZvmMZlziYesdyxBcTSN6j3pOaq053JJ2ckmh27sa6m2j0crjYYsNG9EG3tfj1qtL7VxdYm3DqXmrJzetARRCsa2bUfrNIbc2HUE2tyHU74NtSQZ56Xcjia2bLK3emn0gcTtSIqRW7WS5DHfQo62PM35X22OIdFTCZxLtgU6vqjC0NbtPgueS8N1TRrLNXVKzMNWlX7qX5AowIbzGw6eeEtRGHaLGC3itYaaUt03yG/goeUrDWyTUtbEhqYSR2qDSzqptqutje9jblvy546PL4GtkiPJO5c4tCoc6KYcob+Krc79HMsffpX7QDfSxs49jcj8sd48RY8aEwy8O5cZMNfGdKE+h70tx5lJExjnVrjYgizD2g88QqvAoZxrKY2PDcfZTaPH5oDq6gXHHePdNeQ8RvFYo2uPqh5e7qp/q2PPF1RRv0Jh86F6ERwVjNbAfnSN3zan/Ks1jqFuh3HrKeY/rxxYxStkF2qvexzHaLhYqdjqtUYIjBEYIjBEYIjBEYIjBEYIqzPM5SnW57zn1V8fM+AxxnnbE25XSKJ0rtFv+lmme50WPaSnUx9VR0HkOg8/wAziHTUc+Iyf8fD/alVNVBhsfFx7z7BU+XZdUVznTYIu7O20aDrc+NunP2DHrYoqfD2aLRn4leRlmqcRk0nHk+ATJw6sAlFPQFXm0ktVTC9gOfZR9Tv5eZIxxqDIW6c2z/tHqutOI2v1cPO3uPoE5ZHSfR5HiereaRwJNEhGpRcgkfwk2FhsLYgyu0wHBtgMslZQs1bi0vuTnmkjPKj6LnQnkvoJDX/AIWj7Mn3Wb4YsoW62jLG7f3dVU79TW6btn6snLibKfpMTOKmREERICMBGTYkMxAuynbrawxWwS6t1tG+e/arKph1rCQ4gW3bErcE0r1WXVFKV0rq+rcju6j3re5lBNvvYnVbhDUNe3tCg0THTUzoz2FTOEquro4zTy0czhWJRowCN+YvcC197368sc6lsUztY14HG66UjpoW6tzCeFlfZHRzdtPVTqI3lCqkeoEoiXtqYbXJN9r2xFkc3RaxuYG/pUuFrtN0j8r7uhUPDuQVceYPUypGVlLltEl9Gs3Fri7W5cuuJdRURvpxG2+VtyiU9PKyoMhtY338VErcqqoczNVDSyGLXc6SveBFpCAG6kk2PU43ZLE+m1b3Z/LLm+GVlVrWNy+XXX0lUJE1PVFSYlKpJ/CA99x5hiPaAOoxigk5D4xtOzpyW2Ixctkh2b+9PdXmMUcRmZwIwurVfYjpbxv0A54rWsc52iBmrR8rWs0yclnXo8jeorpqsghe8T4apDcLfrYfp44ta60cLYt6p8PDpJ3S7s/FadioV2qzPMhgql0ypcj1XGzr7D+nLyx1hnfEbtK4T08cws4LKs94cnomMkb9pEDbWu9j911Hqn5ew7YtdOCtZq5m5/Nip9GehfrYXZcR5Fd8lzk6gyHRIv8AW3iPLHl67DZqB+sYbt4+hXqqHEoMRbq5BZ/D1HzwWlcPZ8s40t3ZANx0bzH7Y609S2UdK5zwOhNjs3H5vV3iSuKMERgiMERgiMERgiMEVZnucLTpc7ufVXx8z5DHGeZsTbldIonSu0W/6WW57nBuXc6pH6eH7AdBiPh+HyV8mskyYPlgu2IYhFh0erjzeflz88FCyfJ+2BqalmSANa4F3lboka2uT025e429a97YGiGEZ+A6SvINY+ocZ5zkT2noC0/gura/YfQXp4VW8ZNiCOoYD1WN78yTvfFRM0c/Tud6uadxvoaGiNyVOP8AKXpZ0rafuAtuVHqPbnblZhe/nfxxPoZWysML8/noq+vgdC8TR5Jj4Yp6RYVrtRZypLzStdgeTA9BblYdMQ6gyaRi3cBsU2mbCGa6+e8lcYuyzGmeWsjEaJI3ZSeoez20sGbxGxvsSOXhm76eQCM3Nsxtz4LUaFTGXSiwvkdmSUayoy6AGNJKqqUH+7MmiG/nYC++/ڈیٹا";
const CALENDAR_DATA = [
    { date: '2025-09-20', time: '18:00', opponent: 'Vighignolo', location: 'Trasferta' },
    { date: '2025-09-27', time: '14:45', opponent: 'Villapizzone', location: 'Casa' },
    { date: '2025-10-04', time: '18:15', opponent: 'Sempione Half 1919', location: 'Trasferta' },
    { date: '2025-10-11', time: '14:45', opponent: 'Polisportiva Or. Pa. S.', location: 'Casa' },
    { date: '2025-10-18', time: '17:30', opponent: 'Cassina Nuova', location: 'Trasferta' },
    { date: '2025-10-25', time: '14:45', opponent: 'Cob 91', location: 'Casa' },
    { date: '2025-11-01', time: '17:30', opponent: 'Ardor Bollate', location: 'Trasferta' },
    { date: '2025-11-08', time: '14:45', opponent: 'Garibaldina 1932', location: 'Trasferta' },
    { date: '2025-11-15', time: '14:45', opponent: 'Quinto Romano', location: 'Casa' },
    { date: '2025-11-22', time: '17:45', opponent: 'Pro Novate', location: 'Trasferta' },
    { date: '2025-11-29', time: '14:45', opponent: 'Calcio Bonola', location: 'Casa' },
    { date: '2025-12-06', time: '18:00', opponent: 'Bollatese', location: 'Trasferta' },
    { date: '2025-12-13', time: '14:45', opponent: 'Vigor FC', location: 'Casa' },
    { date: '2026-01-17', time: '14:45', opponent: 'Vighignolo', location: 'Casa' },
    { date: '2026-01-24', time: '18:15', opponent: 'Villapizzone', location: 'Trasferta' },
    { date: '2026-01-31', time: '14:45', opponent: 'Sempione Half 1919', location: 'Casa' },
    { date: '2026-02-07', time: '16:00', opponent: 'Polisportiva Or. Pa. S.', location: 'Trasferta' },
    { date: '2026-02-14', time: '14:45', opponent: 'Cassina Nuova', location: 'Casa' },
    { date: '2026-02-21', time: '18:00', opponent: 'Cob 91', location: 'Trasferta' },
    { date: '2026-02-28', time: '14:45', opponent: 'Ardor Bollate', location: 'Casa' },
    { date: '2026-03-07', time: '14:45', opponent: 'Garibaldina 1932', location: 'Casa' },
    { date: '2026-03-14', time: '17:00', opponent: 'Quinto Romano', location: 'Trasferta' },
    { date: '2026-03-21', time: '14:45', opponent: 'Pro Novate', location: 'Casa' },
    { date: '2026-03-28', time: '18:00', opponent: 'Calcio Bonola', location: 'Trasferta' },
    { date: '2026-04-11', time: '14:45', opponent: 'Bollatese', location: 'Casa' },
    { date: '2026-04-18', time: '15:30', opponent: 'Vigor FC', location: 'Trasferta' }
];



// --- COMPONENTS ---

const Header = () => (
  <header>
    <img src={TEAM_LOGO_BASE64} alt={`${TEAM_NAME} Logo`} />
    <h1>{TEAM_NAME} Manager</h1>
  </header>
);

const Nav = ({ activeTab, setActiveTab }: { activeTab: ActiveTab, setActiveTab: (tab: ActiveTab) => void }) => {
  const tabs: ActiveTab[] = ['Partite', 'Risultati', 'Classifica', 'Marcatori', 'Calendario', 'Giocatori', 'Allenamenti', 'Statistiche', 'Assistente AI'];
  return (
    <nav>
      {tabs.map(tab => (
        <button
          key={tab}
          className={activeTab === tab ? 'active' : ''}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
};

const Partite = () => (
    <div className="tab-content">
        <h2>Prossima Partita & Ultima Partita</h2>
        <div className="widgets-container">
            <div className="widget-card">
                <h3>Prossima Partita</h3>
                <iframe src='https://www.tuttocampo.it/WidgetV2/ProssimaPartita/e888709c-f06f-4678-9178-40c209ac19ef' loading='lazy'></iframe>
            </div>
            <div className="widget-card">
                <h3>Ultima Partita</h3>
                <iframe src='https://www.tuttocampo.it/WidgetV2/Partita/e888709c-f06f-4678-9178-40c209ac19ef' loading='lazy'></iframe>
            </div>
        </div>
    </div>
);

const Risultati = () => (
    <div className="tab-content">
        <h2>Risultati</h2>
        <div className="classifica-container">
            <iframe src='https://www.tuttocampo.it/WidgetV2/Risultati/e888709c-f06f-4678-9178-40c209ac19ef' loading='lazy' style={{height: '600px'}}></iframe>
        </div>
    </div>
);

const Classifica = () => (
    <div className="tab-content">
        <h2>Classifica</h2>
        <div className="classifica-container">
            <iframe src='https://www.tuttocampo.it/WidgetV2/Classifica/e888709c-f06f-4678-9178-40c209ac19ef' loading='lazy'></iframe>
        </div>
    </div>
);

const Marcatori = () => (
    <div className="tab-content">
        <h2>Marcatori</h2>
        <div className="classifica-container">
            <iframe src='https://www.tuttocampo.it/WidgetV2/Marcatori/e888709c-f06f-4678-9178-40c209ac19ef' loading='lazy' style={{height: '700px'}}></iframe>
        </div>
    </div>
);


const Calendario = ({ uid }: { uid: string | null }) => {
    const calendarWithIds = CALENDAR_DATA.map((match, index) => ({ ...match, id: `match-${index}` }));

    const matchesByMonth = calendarWithIds.reduce((acc, match) => {
        const month = new Date(match.date).toLocaleString('it-IT', { month: 'long', year: 'numeric' });
        if (!acc[month]) {
            acc[month] = [];
        }
        acc[month].push(match);
        return acc;
    }, {} as Record<string, typeof calendarWithIds>);

    return (
        <div className="tab-content">
            <h2>Calendario Partite</h2>
            {Object.entries(matchesByMonth).map(([month, matches]) => (
                <div key={month}>
                    <h3 style={{ textTransform: 'capitalize', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '2rem' }}>{month}</h3>
                    <div className="player-grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'}}>
                        {matches.map(match => (
                            <div key={match.id} className="player-card" style={{borderColor: match.location === 'Casa' ? 'var(--present-color)' : 'var(--justified-color)'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <p><strong>{new Date(match.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</strong> - {match.time}</p>
                                    <span style={{
                                        backgroundColor: match.location === 'Casa' ? 'var(--present-color)' : 'var(--justified-color)',
                                        color: 'white',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '12px',
                                        fontSize: '0.8rem'
                                    }}>{match.location}</span>
                                </div>
                                <h3 style={{textAlign: 'center', margin: '1rem 0'}}>
                                    {match.location === 'Casa' ? `${TEAM_NAME} vs ${match.opponent}` : `${match.opponent} vs ${TEAM_NAME}`}
                                </h3>
                                <p style={{textAlign: 'center', fontSize: '0.9rem', color: '#555'}}>
                                    🗓️ {new Date(match.date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};


const Giocatori = ({ players, setPlayers, uid }: { players: Player[], setPlayers: (players: Player[]) => void, uid: string | null }) => {
    const [newPlayer, setNewPlayer] = useState({ name: '', role: '', number: '' });

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewPlayer(prev => ({ ...prev, [name]: value }));
    };

    const handleAddPlayer = () => {
        if (!newPlayer.name || !newPlayer.role || !newPlayer.number || !uid) return;
        const playerRef = db.collection('users').doc(uid).collection('players').doc();
        const playerToAdd = { ...newPlayer, id: playerRef.id };
        playerRef.set(playerToAdd).then(() => {
            setNewPlayer({ name: '', role: '', number: '' });
        }).catch(error => console.error("Error adding player: ", error));
    };

    const handleRemovePlayer = (playerId: string) => {
        if (!uid) return;
        db.collection('users').doc(uid).collection('players').doc(playerId).delete()
        .catch(error => console.error("Error removing player: ", error));
    };

    return (
        <div className="tab-content">
            <h2>Gestione Giocatori</h2>
            <div className="form-grid">
                <input name="name" value={newPlayer.name} onChange={handleInputChange} placeholder="Nome Cognome" />
                <select name="role" value={newPlayer.role} onChange={handleInputChange}>
                    <option value="">Seleziona Ruolo</option>
                    <option value="Portiere">Portiere</option>
                    <option value="Difensore">Difensore</option>
                    <option value="Centrocampista">Centrocampista</option>
                    <option value="Attaccante">Attaccante</option>
                </select>
                <input name="number" type="number" value={newPlayer.number} onChange={handleInputChange} placeholder="Numero Maglia" />
                <button onClick={handleAddPlayer}>Aggiungi Giocatore</button>
            </div>
            <div className="player-grid">
                {players.sort((a,b) => parseInt(a.number) - parseInt(b.number)).map(player => (
                    <div key={player.id} className="player-card">
                        <div>
                            <h3>{player.name}</h3>
                            <p><strong>Ruolo:</strong> {player.role}</p>
                            <p><strong>Maglia:</strong> {player.number}</p>
                        </div>
                        <div className="actions">
                            <button className="danger" onClick={() => handleRemovePlayer(player.id)}>Rimuovi</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Allenamenti = ({ players, trainings, attendance, uid }: { players: Player[], trainings: Training[], attendance: Attendance, uid: string | null }) => {
    const [newTrainingDate, setNewTrainingDate] = useState('');

    const handleAddTraining = () => {
        if (!newTrainingDate || !uid) return;
        const trainingRef = db.collection('users').doc(uid).collection('trainings').doc();
        trainingRef.set({ id: trainingRef.id, date: newTrainingDate })
        .then(() => setNewTrainingDate(''))
        .catch(error => console.error("Error adding training: ", error));
    };

    const handleSetAttendance = (trainingId: string, playerId: string, status: AttendanceStatus) => {
        if (!uid) return;
        const attendanceRef = db.collection('users').doc(uid).collection('attendance').doc(trainingId);
        attendanceRef.set({ [playerId]: status }, { merge: true })
        .catch(error => console.error("Error setting attendance: ", error));
    };
    
    const sortedTrainings = [...trainings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="tab-content">
            <h2>Presenze Allenamenti</h2>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr auto'}}>
                <input type="date" value={newTrainingDate} onChange={e => setNewTrainingDate(e.target.value)} />
                <button onClick={handleAddTraining}>Aggiungi Allenamento</button>
            </div>
            <div style={{overflowX: 'auto'}}>
                <table className="attendance-table">
                    <thead>
                        <tr>
                            <th>Giocatore</th>
                            {sortedTrainings.map(t => <th key={t.id}>{new Date(t.date).toLocaleDateString('it-IT')}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {players.sort((a,b) => parseInt(a.number) - parseInt(b.number)).map(p => (
                            <tr key={p.id}>
                                <td>{p.name} (#{p.number})</td>
                                {sortedTrainings.map(t => (
                                    <td key={t.id}>
                                        <div className="status-buttons">
                                            <button 
                                                className={`present ${attendance[t.id]?.[p.id] === 'present' ? 'selected' : ''}`}
                                                onClick={() => handleSetAttendance(t.id, p.id, 'present')}>P</button>
                                            <button 
                                                className={`absent ${attendance[t.id]?.[p.id] === 'absent' ? 'selected' : ''}`}
                                                onClick={() => handleSetAttendance(t.id, p.id, 'absent')}>A</button>
                                            <button 
                                                className={`justified ${attendance[t.id]?.[p.id] === 'justified' ? 'selected' : ''}`}
                                                onClick={() => handleSetAttendance(t.id, p.id, 'justified')}>G</button>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Statistiche = ({ players, convocations, matchStats, setMatchStats, uid }: { 
    players: Player[], 
    convocations: Convocation, 
    matchStats: MatchStats, 
    setMatchStats: (stats: MatchStats) => void,
    uid: string | null
}) => {
    const [selectedMatch, setSelectedMatch] = useState('');
    const matchesWithIds = CALENDAR_DATA.map((m, i) => ({ ...m, id: `match-${i}` }));

    const handleStatChange = (matchId: string, playerId: string, field: string, value: string) => {
        if (!uid) return;
        const numericValue = parseInt(value) || 0;
        const statPath = `${playerId}.${field}`;
        const matchStatsRef = db.collection('users').doc(uid).collection('matchStats').doc(matchId);
        
        matchStatsRef.set({
            [playerId]: {
                ...matchStats[matchId]?.[playerId],
                [field]: numericValue
            }
        }, { merge: true }).catch(err => console.error("Error updating stat: ", err));
    };

    const convocatedPlayers = selectedMatch && convocations[selectedMatch]
        ? players.filter(p => convocations[selectedMatch].includes(p.id))
        : [];

    return (
        <div className="tab-content">
            <h2>Statistiche Partite</h2>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <select value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)}>
                    <option value="">Seleziona una partita</option>
                    {matchesWithIds.map(m => (
                        <option key={m.id} value={m.id}>
                            {new Date(m.date).toLocaleDateString('it-IT')} - {m.opponent} ({m.location})
                        </option>
                    ))}
                </select>
            </div>
            {selectedMatch && (
                <div className="stats-grid-input">
                    <div className="header">Giocatore</div>
                    <div className="header">Minuti</div>
                    <div className="header">Goal</div>
                    <div className="header">Gialli</div>
                    <div className="header">Rossi</div>
                    {convocatedPlayers.sort((a,b) => parseInt(a.number) - parseInt(b.number)).map(p => (
                        <React.Fragment key={p.id}>
                            <div>{p.name}</div>
                            <input 
                                type="number"
                                placeholder="0"
                                value={matchStats[selectedMatch]?.[p.id]?.minutesPlayed || ''}
                                onChange={e => handleStatChange(selectedMatch, p.id, 'minutesPlayed', e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="0"
                                value={matchStats[selectedMatch]?.[p.id]?.goals || ''}
                                onChange={e => handleStatChange(selectedMatch, p.id, 'goals', e.target.value)}
                            />
                             <input
                                type="number"
                                placeholder="0"
                                value={matchStats[selectedMatch]?.[p.id]?.yellowCards || ''}
                                onChange={e => handleStatChange(selectedMatch, p.id, 'yellowCards', e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="0"
                                value={matchStats[selectedMatch]?.[p.id]?.redCards || ''}
                                onChange={e => handleStatChange(selectedMatch, p.id, 'redCards', e.target.value)}
                            />
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

const AssistenteAI = ({players, trainings, attendance, convocations, matchStats}: {
    players: Player[], 
    trainings: Training[],
    attendance: Attendance,
    convocations: Convocation,
    matchStats: MatchStats
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { sender: 'ai', text: `Ciao! Sono l'assistente di ${TEAM_NAME}. Come posso aiutarti oggi?` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatHistoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatHistoryRef.current?.scrollTo(0, chatHistoryRef.current.scrollHeight);
    }, [messages]);
    
    const generateTeamContext = (): string => {
        let context = `Contesto per la squadra di calcio "${TEAM_NAME}":\n\n`;

        // Players
        context += "Rosa Giocatori:\n";
        if (players.length > 0) {
            players.forEach(p => {
                context += `- ${p.name}, Maglia #${p.number}, Ruolo: ${p.role}\n`;
            });
        } else {
            context += "- Nessun giocatore in rosa.\n";
        }

        // Trainings and Attendance
        context += "\nAllenamenti e Presenze:\n";
        if (trainings.length > 0) {
            trainings.slice(-5).forEach(t => { // Last 5 trainings
                context += `Data Allenamento: ${new Date(t.date).toLocaleDateString('it-IT')}\n`;
                const attendanceForTraining = attendance[t.id];
                if (attendanceForTraining) {
                    Object.entries(attendanceForTraining).forEach(([playerId, status]) => {
                        const player = players.find(p => p.id === playerId);
                        if(player) context += `  - ${player.name}: ${status}\n`;
                    });
                }
            });
        } else {
            context += "- Nessun allenamento registrato.\n";
        }
        
        // Matches, Convocations, and Stats
        context += "\nPartite, Convocazioni e Statistiche:\n";
        const matchesWithIds = CALENDAR_DATA.map((m, i) => ({ ...m, id: `match-${i}` }));
        matchesWithIds.slice(-5).forEach(m => { // Last 5 matches
            context += `Partita contro ${m.opponent} il ${new Date(m.date).toLocaleDateString('it-IT')}\n`;
            const convocatedIds = convocations[m.id];
            if (convocatedIds && convocatedIds.length > 0) {
                context += `  Convocati: ${convocatedIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean).join(', ')}\n`;
            }
            const statsForMatch = matchStats[m.id];
            if(statsForMatch){
                context += "  Statistiche:\n";
                Object.entries(statsForMatch).forEach(([playerId, stats]) => {
                    const player = players.find(p => p.id === playerId);
                    if(player) {
                        context += `    - ${player.name}: ${stats.minutesPlayed}' min, ${stats.goals} goal, ${stats.yellowCards} gialli, ${stats.redCards} rossi\n`;
                    }
                });
            }
        });

        return context;
    };


    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>, prompt?: string) => {
        if(e) e.preventDefault();
        const currentInput = prompt || input;
        if (!currentInput.trim()) return;

        const userMessage: ChatMessage = { sender: 'user', text: currentInput };
        setMessages(prev => [...prev, userMessage, { sender: 'loading', text: '...' }]);
        setInput('');
        setLoading(true);

        try {
            const teamContext = generateTeamContext();
            const fullPrompt = `${teamContext}\n\nRispondi alla seguente domanda basandoti SOLO sul contesto fornito. Se la risposta non è nel contesto, usa la ricerca Google. Domanda: ${currentInput}`;
            
            const response = await ai.models.generateContent({
               model: "gemini-2.5-flash",
               contents: fullPrompt,
               config: {
                 tools: [{googleSearch: {}}],
               },
            });

            const aiMessage: ChatMessage = {
                sender: 'ai',
                text: response.text,
                groundingLinks: response.candidates?.[0]?.groundingMetadata?.groundingChunks as any[] || [],
            };
            setMessages(prev => [...prev.slice(0, -1), aiMessage]);

        } catch (error) {
            console.error("Gemini API error:", error);
            const errorMessage: ChatMessage = { sender: 'error', text: 'Oops, qualcosa è andato storto. Riprova.' };
            setMessages(prev => [...prev.slice(0, -1), errorMessage]);
        } finally {
            setLoading(false);
        }
    };
    
    const promptSuggestions = [
        "Chi sono i nostri difensori?",
        "Quanti goal ha fatto Rossi?",
        "Chi era assente all'ultimo allenamento?",
        "Quando è la prossima partita in casa?",
    ];

    return (
        <div className="tab-content ai-assistant">
            <div className="chat-history" ref={chatHistoryRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.sender}`}>
                        {msg.text}
                         {/* FIX: Robust rendering logic for grounding links */}
                        {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                            <div className="grounding-links">
                                <p>Fonti:</p>
                                {msg.groundingLinks.map((link, i) => (
                                    link.web && link.web.uri && (
                                        <a key={i} href={link.web.uri} target="_blank" rel="noopener noreferrer">
                                            {link.web.title || link.web.uri}
                                        </a>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
             <div className="prompt-suggestions">
                {promptSuggestions.map(prompt => (
                    <button key={prompt} onClick={() => handleSubmit(undefined, prompt)} disabled={loading}>
                        {prompt}
                    </button>
                ))}
            </div>
            <form className="chat-input-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Fai una domanda alla squadra..."
                    disabled={loading}
                />
                <button type="submit" disabled={loading}>Invia</button>
            </form>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
const App = () => {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('Partite');
  
  // Data states
  const [players, setPlayers] = useState<Player[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [attendance, setAttendance] = useState<Attendance>({});
  const [convocations, setConvocations] = useState<Convocation>({});
  const [matchStats, setMatchStats] = useState<MatchStats>({});

  useEffect(() => {
    const timeout = setTimeout(() => {
        if (loading) {
            console.warn("Loading timeout expired. Forcing UI render.");
            setLoading(false);
        }
    }, 10000); // 10 seconds timeout

    const unsubscribe = auth.onAuthStateChanged((user: any) => {
        if (user) {
            setUid(user.uid);
            // Setup listeners
            const playersUnsub = db.collection('users').doc(user.uid).collection('players')
              .onSnapshot((snapshot: any) => {
                const playersData = snapshot.docs.map((doc: any) => doc.data());
                setPlayers(playersData);
              });

            const trainingsUnsub = db.collection('users').doc(user.uid).collection('trainings')
              .onSnapshot((snapshot: any) => {
                const trainingsData = snapshot.docs.map((doc: any) => doc.data());
                setTrainings(trainingsData);
              });
              
            const attendanceUnsub = db.collection('users').doc(user.uid).collection('attendance')
              .onSnapshot((snapshot: any) => {
                  const attendanceData: Attendance = {};
                  snapshot.docs.forEach((doc: any) => {
                      attendanceData[doc.id] = doc.data();
                  });
                  setAttendance(attendanceData);
              });
              
             const convocationUnsub = db.collection('users').doc(user.uid).collection('convocations')
              .onSnapshot((snapshot: any) => {
                  const convoData: Convocation = {};
                  snapshot.docs.forEach((doc: any) => {
                      convoData[doc.id] = doc.data().playerIds;
                  });
                  setConvocations(convoData);
              });

             const matchStatsUnsub = db.collection('users').doc(user.uid).collection('matchStats')
                .onSnapshot((snapshot: any) => {
                    const statsData: MatchStats = {};
                    snapshot.docs.forEach((doc: any) => {
                        statsData[doc.id] = doc.data();
                    });
                    setMatchStats(statsData);
                });

            Promise.all([
                 db.collection('users').doc(user.uid).collection('players').get(),
                 db.collection('users').doc(user.uid).collection('trainings').get(),
                 db.collection('users').doc(user.uid).collection('attendance').get(),
                 db.collection('users').doc(user.uid).collection('convocations').get(),
                 db.collection('users').doc(user.uid).collection('matchStats').get()
            ]).then(() => {
                clearTimeout(timeout);
                setLoading(false);
            }).catch(err => {
                console.error("Error fetching initial data:", err);
                clearTimeout(timeout);
                setLoading(false);
            });
            
            return () => {
              playersUnsub();
              trainingsUnsub();
              attendanceUnsub();
              convocationUnsub();
              matchStatsUnsub();
              clearTimeout(timeout);
            };

        } else {
            auth.signInAnonymously().catch((error: any) => {
              console.error("Anonymous sign-in failed:", error);
              // Handle sign-in failure, maybe show an error message
              clearTimeout(timeout);
              setLoading(false);
            });
        }
    });

    return () => {
        unsubscribe();
        clearTimeout(timeout);
    };
  }, []);

  if (loading) {
    return <div className="loading-container">Caricamento dati in corso...</div>;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'Partite': return <Partite />;
      case 'Risultati': return <Risultati />;
      case 'Classifica': return <Classifica />;
      case 'Marcatori': return <Marcatori />;
      case 'Calendario': return <Calendario uid={uid} />;
      case 'Giocatori': return <Giocatori players={players} setPlayers={setPlayers} uid={uid} />;
      case 'Allenamenti': return <Allenamenti players={players} trainings={trainings} attendance={attendance} uid={uid}/>;
      case 'Statistiche': return <Statistiche players={players} convocations={convocations} matchStats={matchStats} setMatchStats={setMatchStats} uid={uid}/>;
      case 'Assistente AI': return <AssistenteAI players={players} trainings={trainings} attendance={attendance} convocations={convocations} matchStats={matchStats} />;
      default: return null;
    }
  };

  return (
    <>
      <Header />
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="container">
        {renderTab()}
      </main>
    </>
  );
};


// --- RENDER ---
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
