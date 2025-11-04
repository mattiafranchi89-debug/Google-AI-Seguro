import React, { useState, useEffect, useRef, ChangeEvent, FormEvent, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// --- TYPES ---
type Player = {
  id: string;
  name: string;
  role: string;
  birthYear: string;
};

type Match = {
  id: string;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  address: string;
  city: string;
  location: 'Casa' | 'Trasferta';
  opponent: string;
};

type PlayerStats = {
    goals: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
}

type MatchStats = {
    [matchId: string]: {
        [playerId: string]: PlayerStats
    }
};

type TrainingSession = {
    id: string;
    date: string;
    notes: string;
};

type AttendanceStatus = 'present' | 'absent' | 'justified';

type TrainingAttendance = {
    [trainingId: string]: {
        [playerId: string]: AttendanceStatus;
    };
};

type ActiveTab = 'Giocatori' | 'Convocazioni' | 'Campionato' | 'Allenamenti' | 'Statistiche';

type Widget = {
    src: string;
    height: string;
};

// --- CONSTANTS ---
const TEAM_NAME = "Seguro";
const TEAM_LOGO_BASE64 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const WIDGETS: { [key: string]: Widget } = {
    'Prossima Partita': { src: 'https://www.tuttocampo.it/WidgetV2/ProssimaPartita/e888709c-f06f-4678-9178-40c209ac19ef', height: '350' },
    'Ultima Partita': { src: 'https://www.tuttocampo.it/WidgetV2/Partita/e888709c-f06f-4678-9178-40c209ac19ef', height: '350' },
    'Risultati': { src: 'https://www.tuttocampo.it/WidgetV2/Risultati/e888709c-f06f-4678-9178-40c209ac19ef', height: '600' },
    'Classifica': { src: 'https://www.tuttocampo.it/WidgetV2/Classifica/e888709c-f06f-4678-9178-40c209ac19ef', height: '800' },
    'Marcatori': { src: 'https://www.tuttocampo.it/WidgetV2/Marcatori/e888709c-f06f-4678-9178-40c209ac19ef', height: '700' },
};

const initialMatches: Omit<Match, 'location' | 'opponent' | 'id'>[] = [
    { date: "2025-09-20", time: "18:00", homeTeam: "Vighignolo", awayTeam: "Seguro", address: "Via Pace S.N.C.", city: "Settimo Milanese Fr. Vighignolo" },
    { date: "2025-09-27", time: "14:45", homeTeam: "Seguro", awayTeam: "Villapizzone", address: "Via Sandro Pertini 13", city: "Seguro" },
    { date: "2025-10-04", time: "18:15", homeTeam: "Sempione Half 1919", awayTeam: "Seguro", address: "Via Arturo Graf, 4", city: "Milano" },
    { date: "2025-10-11", time: "14:45", homeTeam: "Seguro", awayTeam: "Polisportiva Or. Pa. S.", address: "Via Sandro Pertini 13", city: "Seguro" },
    { date: "2025-10-18", time: "17:30", homeTeam: "Cassina Nuova", awayTeam: "Seguro", address: "Via Oglio, 1/3", city: "Bollate Fraz. Cassina Nuova" },
    { date: "2025-10-25", time: "14:45", homeTeam: "Seguro", awayTeam: "Cob 91", address: "Via Sandro Pertini 13", city: "Seguro" },
    { date: "2025-11-01", time: "17:30", homeTeam: "Ardor Bollate", awayTeam: "Seguro", address: "Via Repubblica 6", city: "Bollate" },
    { date: "2025-11-08", time: "14:45", homeTeam: "Garibaldina 1932", awayTeam: "Seguro", address: "Via Don Giovanni Minzoni 4", city: "Milano" },
    { date: "2025-11-15", time: "14:45", homeTeam: "Seguro", awayTeam: "Quinto Romano", address: "Via Sandro Pertini 13", city: "Seguro" },
    { date: "2025-11-22", time: "17:45", homeTeam: "Pro Novate", awayTeam: "Seguro", address: "Via V. Toriani 6", city: "Novate Milanese" },
    { date: "2025-11-29", time: "14:45", homeTeam: "Seguro", awayTeam: "Calcio Bonola", address: "Via Sandro Pertini 13", city: "Seguro" },
    { date: "2025-12-06", time: "18:00", homeTeam: "Bollatese", awayTeam: "Seguro", address: "Via Varalli n. 2", city: "Bollate" },
    { date: "2025-12-13", time: "14:45", homeTeam: "Seguro", awayTeam: "Vigor FC", address: "Via Sandro Pertini 13", city: "Seguro" },
    { date: "2026-01-17", time: "14:45", homeTeam: "Seguro", awayTeam: "Vighignolo", address: "Via Sandro Pertini 13", city: "Seguro" },
    { date: "2026-01-24", time: "18:15", homeTeam: "Villapizzone", awayTeam: "Seguro", address: "Via Perin del Vaga 11", city: "Milano" },
    { date: "2026-01-31", time: "14:45", homeTeam: "Seguro", awayTeam: "Sempione Half 1919", address: "Via Sandro Pertini 13", city: "Seguro" },
    { date: "2026-02-07", time: "16:00", homeTeam: "Polisportiva Or. Pa. S.", awayTeam: "Seguro", address: "Via Comasina 115", city: "Milano" },
    { date: "2026-02-14", time: "14:45", homeTeam: "Seguro", awayTeam: "Cassina Nuova", address: "Via Sandro Pertini 13", city: "Seguro" },
    { date: "2026-02-21", time: "18:00", homeTeam: "Cob 91", awayTeam: "Seguro", address: "Via Fabio Filzi, 31", city: "Cormano" },
    { date: "2026-02-28", time: "14:45", homeTeam: "Seguro", awayTeam: "Ardor Bollate", address: "Via Sandro Pertini 13", city: "Seguro" },
    { date: "2026-03-07", time: "14:45", homeTeam: "Seguro", awayTeam: "Garibaldina 1932", address: "Via Sandro Pertini 13", city: "Seguro" },
    { date: "2026-03-14", time: "17:00", homeTeam: "Quinto Romano", awayTeam: "Seguro", address: "Via Vittorio De Sica, 14", city: "Quinto Romano" },
    { date: "2026-03-21", time: "14:45", homeTeam: "Seguro", awayTeam: "Pro Novate", address: "Via Sandro Pertini 13", city: "Seguro" },
    { date: "2026-03-28", time: "18:00", homeTeam: "Calcio Bonola", awayTeam: "Seguro", address: "Via Fichi, 1", city: "Milano" },
    { date: "2026-04-11", time: "14:45", homeTeam: "Seguro", awayTeam: "Bollatese", address: "Via Sandro Pertini 13", city: "Seguro" },
    { date: "2026-04-18", time: "15:30", homeTeam: "Vigor FC", awayTeam: "Seguro", address: "Via San Michele del Carso, 55", city: "Paderno Dugnano" },
];

const EMPTY_STATS: PlayerStats = { goals: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0 };
const BIRTH_YEARS = ['2009', '2008', '2007', '2006', '2005'];
const ROLES = ['Portiere', 'Terzino Sx', 'Terzino Dx', 'Dif.Centrale', 'Centr. C', 'Ala', 'Attaccante'];
const ROLE_ORDER = ['Portiere', 'Terzino Sx', 'Terzino Dx', 'Dif.Centrale', 'Centr. C', 'Ala', 'Attaccante'];


// --- APP COMPONENT ---
const App = () => {
    
    // --- STATE ---
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    // Effect to apply theme class and save preference
    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const [activeTab, setActiveTab] = useState<ActiveTab>('Giocatori');
    const [players, setPlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [matchStats, setMatchStats] = useState<MatchStats>({});
    const [sortConfig, setSortConfig] = useState<{ key: keyof PlayerStats | 'name'; direction: 'ascending' | 'descending' } | null>({ key: 'minutesPlayed', direction: 'descending' });
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Player Management State
    const [newPlayer, setNewPlayer] = useState({ name: '', role: '', birthYear: '' });
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [playerView, setPlayerView] = useState<'grid' | 'list'>('grid');

    // Training Management State
    const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
    const [newTraining, setNewTraining] = useState({ date: new Date().toISOString().split('T')[0], notes: '' });
    const [trainingAttendance, setTrainingAttendance] = useState<TrainingAttendance>({});
    const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);
    const [selectedSummaryMonth, setSelectedSummaryMonth] = useState<string>('');
    const [trainingToDelete, setTrainingToDelete] = useState<string | null>(null);

    // Convocazioni State
    const [selectedMatchForSquad, setSelectedMatchForSquad] = useState<string>('');
    const [squadSelections, setSquadSelections] = useState<{[matchId: string]: string[]}>({});
    const [whatsAppMessage, setWhatsAppMessage] = useState('');
    const [copySuccess, setCopySuccess] = useState('');

    // Campionato Widget State
    const [activeWidget, setActiveWidget] = useState<string>('Prossima Partita');

    // Statistiche State
    const [selectedMatchIdForStats, setSelectedMatchIdForStats] = useState<string>('');
    const [statsView, setStatsView] = useState<'match' | 'global'>('match');
    const [editingStatsPlayerId, setEditingStatsPlayerId] = useState<string | null>(null);
    const [currentEditingStats, setCurrentEditingStats] = useState<PlayerStats | null>(null);


    useEffect(() => {
        setPlayers([]);

        const processedMatches: Match[] = initialMatches.map((match, index) => {
            const isHomeGame = match.homeTeam === TEAM_NAME;
            return {
                ...match,
                id: `m${index + 1}`,
                location: isHomeGame ? 'Casa' : 'Trasferta',
                opponent: isHomeGame ? match.awayTeam : match.homeTeam,
            };
        });
        setMatches(processedMatches);
        
        setMatchStats({});
        
        const mockTrainings: TrainingSession[] = [
            { id: 't1', date: '2024-10-23', notes: 'Tattica difensiva' },
            { id: 't2', date: '2024-10-24', notes: 'Schemi su palla inattiva' },
            { id: 't3', date: '2024-11-05', notes: 'Partitella' },
        ];
        setTrainingSessions(mockTrainings);
        
        const mockAttendance: TrainingAttendance = { 't1': {}, 't2': {}, 't3': {} };
        setTrainingAttendance(mockAttendance);
    }, []);
    
    useEffect(() => {
        setWhatsAppMessage('');
        setCopySuccess('');
    }, [selectedMatchForSquad]);

    useEffect(() => {
        setSortConfig({ key: 'minutesPlayed', direction: 'descending' }); // Reset sort on view change
    }, [statsView]);

    // --- CSV IMPORT HANDLERS ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCsvFile(e.target.files[0]);
        } else {
            setCsvFile(null);
        }
    };

    const handleImportCSV = () => {
        if (!csvFile) {
            alert("Per favore, seleziona un file CSV.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');

                if (rows.length < 2) {
                    alert("Il file CSV è vuoto o contiene solo l'intestazione.");
                    return;
                }

                const header = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
                const nomeIndex = header.indexOf('nome');
                const cognomeIndex = header.indexOf('cognome');
                const ruoloIndex = header.indexOf('ruolo');
                const annoIndex = header.indexOf('anno di nascita');

                if (nomeIndex === -1 || cognomeIndex === -1 || ruoloIndex === -1 || annoIndex === -1) {
                    alert("L'intestazione del CSV non è valida. Assicurati che contenga le colonne: nome, cognome, Ruolo, anno di nascita.");
                    return;
                }

                const newPlayers: Player[] = [];
                let skippedCount = 0;
                let duplicateCount = 0;

                for (let i = 1; i < rows.length; i++) {
                    const data = rows[i].split(',').map(d => d.trim().replace(/"/g, ''));

                    if (data.length <= Math.max(nomeIndex, cognomeIndex, ruoloIndex, annoIndex)) {
                        skippedCount++;
                        continue;
                    }

                    const name = `${data[nomeIndex]} ${data[cognomeIndex]}`.trim();
                    const roleRaw = data[ruoloIndex];
                    const birthYear = data[annoIndex];

                    const canonicalRole = ROLES.find(r => r.toLowerCase() === roleRaw?.toLowerCase());
                    const isValidYear = BIRTH_YEARS.includes(birthYear);
                    const playerExists = players.some(p => p.name.toLowerCase() === name.toLowerCase() && p.birthYear === birthYear);
                    
                    if (!name || !canonicalRole || !birthYear || !isValidYear) {
                        skippedCount++;
                        continue;
                    }

                    if (playerExists) {
                        duplicateCount++;
                        continue;
                    }

                    newPlayers.push({
                        id: `p${Date.now()}_${i}`,
                        name,
                        role: canonicalRole,
                        birthYear,
                    });
                }
                
                if (newPlayers.length > 0) {
                     setPlayers(prev => [...prev, ...newPlayers].sort((a,b) => a.name.localeCompare(b.name)));
                }
               
                alert(`Importazione completata!\n- ${newPlayers.length} giocatori importati.\n- ${skippedCount} righe saltate (dati mancanti, non validi o formattazione errata).\n- ${duplicateCount} duplicati ignorati.`);
                
                setCsvFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            } catch (error) {
                alert("Si è verificato un errore durante la lettura del file. Assicurati che sia un file di testo CSV valido.");
                console.error("CSV Import Error:", error);
            }
        };

        reader.onerror = () => {
             alert("Impossibile leggere il file.");
        };

        reader.readAsText(csvFile);
    };


    // --- PLAYER CRUD HANDLERS ---
    const handleAddPlayer = (e: FormEvent) => {
        e.preventDefault();
        if (!newPlayer.name || !newPlayer.role || !newPlayer.birthYear) {
            alert("Per favore, compila tutti i campi.");
            return;
        }
        const playerToAdd: Player = { id: `p${Date.now()}`, ...newPlayer };
        setPlayers(prev => [playerToAdd, ...prev]);
        setNewPlayer({ name: '', role: '', birthYear: '' });
    };

    const handleDeletePlayer = (playerId: string) => {
        if (window.confirm("Sei sicuro di voler eliminare questo giocatore?")) {
            setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== playerId));
        }
    };

    const performUpdatePlayer = () => {
        if (!editingPlayer) return;

        if (!editingPlayer.name.trim()) {
            alert("Il nome del giocatore non può essere vuoto.");
            return;
        }

        setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? editingPlayer : p));
        setEditingPlayer(null);
    };

    const handleUpdatePlayerSubmit = (e: FormEvent) => {
        e.preventDefault();
        performUpdatePlayer();
    };
    
    // --- TRAINING HANDLERS ---
    const handleCreateTraining = (e: FormEvent) => {
        e.preventDefault();
        const newSession: TrainingSession = { id: `t${Date.now()}`, ...newTraining };
        setTrainingSessions(prev => [newSession, ...prev]);

        // Set all players as 'present' by default for the new session
        const defaultAttendance: { [playerId: string]: AttendanceStatus } = {};
        players.forEach(player => {
            defaultAttendance[player.id] = 'present';
        });
        setTrainingAttendance(prev => ({ ...prev, [newSession.id]: defaultAttendance }));

        setNewTraining({ date: new Date().toISOString().split('T')[0], notes: '' });
    };

    const handleSetAttendance = (trainingId: string, playerId: string, status: AttendanceStatus) => {
        setTrainingAttendance(prev => ({
            ...prev,
            [trainingId]: { ...prev[trainingId], [playerId]: status }
        }));
    };
    
    const handleConfirmDeleteTraining = () => {
        if (!trainingToDelete) return;
        setTrainingSessions(prev => prev.filter(s => s.id !== trainingToDelete));
        setTrainingAttendance(prev => {
            const newAttendance = { ...prev };
            delete newAttendance[trainingToDelete];
            return newAttendance;
        });
        if (selectedTrainingId === trainingToDelete) {
            setSelectedTrainingId(null);
        }
        setTrainingToDelete(null); // Close the dialog
    };

    // --- SQUAD SELECTION & WHATSAPP HANDLERS ---
    const handleToggleSquadSelection = (matchId: string, playerId: string) => {
        setSquadSelections(prev => {
            const currentSquad = prev[matchId] || [];
            const isSelected = currentSquad.includes(playerId);
            const playerToAdd = players.find(p => p.id === playerId);

            let newSquad;

            if (isSelected) {
                newSquad = currentSquad.filter(id => id !== playerId);
            } else {
                if (!playerToAdd) return prev; // Player not found

                const totalSelected = currentSquad.length;
                const fuoriQuotaSelected = currentSquad.filter(pId => {
                    const p = players.find(player => player.id === pId);
                    return p && ['2005', '2006'].includes(p.birthYear);
                }).length;

                if (totalSelected >= 20) return prev; // Max players reached
                if (['2005', '2006'].includes(playerToAdd.birthYear) && fuoriQuotaSelected >= 4) return prev; // Max "fuori quota" reached

                newSquad = [...currentSquad, playerId];
            }
            return { ...prev, [matchId]: newSquad };
        });
    };
    
    const handleGenerateWhatsAppMessage = () => {
        if (!selectedMatchForSquad) return;
        const match = matches.find(m => m.id === selectedMatchForSquad);
        if (!match) return;
        
        const currentSquadIds = squadSelections[selectedMatchForSquad] || [];

        const selectedPlayers = players.filter(p => currentSquadIds.includes(p.id));
        
        // Sort selected players by role order for the message
        const sortedSelectedPlayers = [...selectedPlayers].sort((a, b) => {
            const roleAIndex = ROLE_ORDER.indexOf(a.role);
            const roleBIndex = ROLE_ORDER.indexOf(b.role);
            if (roleAIndex !== roleBIndex) return roleAIndex - roleBIndex;
            return a.name.localeCompare(b.name);
        });
        
        const selectedPlayerNames = sortedSelectedPlayers.map(p => p.name).join('\n');
        
        if (selectedPlayerNames.length === 0) {
            alert("Nessun giocatore convocato. Selezionane almeno uno.");
            setWhatsAppMessage('');
            return;
        }
        
        const matchDate = new Date(`${match.date}T${match.time}`);
        const formattedDate = matchDate.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const meetingTime = new Date(matchDate.getTime() - 90 * 60000);
        const formattedMeetingTime = meetingTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        const message = `JUNIORES PROVINCIALE – Girone B
${match.opponent.toUpperCase()} (${match.location})

  ${formattedDate}
  Ritrovo: ${formattedMeetingTime}
  Calcio d'inizio: ${match.time}
  Campo: ${match.address}, ${match.city}

CONVOCATI

${selectedPlayerNames}

  IMPORTANTE: Portare documento di identità!

  Occorrente:
Kit allenamento completo
Calzettoni blu`.trim();

        setWhatsAppMessage(message);
    };

    const handleCopyToClipboard = () => {
        if (!whatsAppMessage) return;
        navigator.clipboard.writeText(whatsAppMessage).then(() => {
            setCopySuccess('Copiato!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => setCopySuccess('Errore'));
    };
    
    // --- STATS HANDLERS ---
    const handleEditStatsClick = (player: Player) => {
        setEditingStatsPlayerId(player.id);
        const stats = matchStats[selectedMatchIdForStats]?.[player.id] || EMPTY_STATS;
        setCurrentEditingStats({ ...stats });
    };

    const handleSaveStats = () => {
        if (!editingStatsPlayerId || !currentEditingStats || !selectedMatchIdForStats) return;
        setMatchStats(prev => ({
            ...prev,
            [selectedMatchIdForStats]: {
                ...prev[selectedMatchIdForStats],
                [editingStatsPlayerId]: currentEditingStats,
            }
        }));
        setEditingStatsPlayerId(null);
        setCurrentEditingStats(null);
    };

    const handleCancelEditStats = () => {
        setEditingStatsPlayerId(null);
        setCurrentEditingStats(null);
    };

    const handleStatInputChange = (e: ChangeEvent<HTMLInputElement>, field: keyof PlayerStats) => {
        if (!currentEditingStats) return;
        setCurrentEditingStats({
            ...currentEditingStats,
            [field]: Math.max(0, parseInt(e.target.value, 10) || 0)
        });
    };
    
    // --- MEMOIZED DATA & EXPORT LOGIC ---
    const requestSort = (key: keyof PlayerStats | 'name') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else {
            direction = key === 'name' ? 'ascending' : 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: keyof PlayerStats | 'name') => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };
    
    const sortedPlayersForSquad = useMemo(() => {
        return [...players].sort((a, b) => {
            const roleAIndex = ROLE_ORDER.indexOf(a.role);
            const roleBIndex = ROLE_ORDER.indexOf(b.role);
            if (roleAIndex !== roleBIndex) {
                return roleAIndex - roleBIndex;
            }
            return a.name.localeCompare(b.name);
        });
    }, [players]);

    const sortedPlayersForMatchStats = useMemo(() => {
        let sortableItems = players.map(player => ({
            ...player,
            stats: matchStats[selectedMatchIdForStats]?.[player.id] || EMPTY_STATS
        }));

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;
                if (sortConfig.key === 'name') {
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                } else {
                    aValue = a.stats[sortConfig.key];
                    bValue = b.stats[sortConfig.key];
                }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [players, matchStats, selectedMatchIdForStats, sortConfig]);

    const globalStats = useMemo(() => {
        const aggregatedStats: { [playerId: string]: PlayerStats & { name: string, id: string } } = {};

        players.forEach(p => {
            aggregatedStats[p.id] = { ...EMPTY_STATS, name: p.name, id: p.id };
        });

        Object.values(matchStats).forEach(match => {
            Object.entries(match).forEach(([playerId, stats]) => {
                if (aggregatedStats[playerId]) {
                    aggregatedStats[playerId].goals += stats.goals;
                    aggregatedStats[playerId].yellowCards += stats.yellowCards;
                    aggregatedStats[playerId].redCards += stats.redCards;
                    aggregatedStats[playerId].minutesPlayed += stats.minutesPlayed;
                }
            });
        });
        return Object.values(aggregatedStats);
    }, [matchStats, players]);

    const sortedGlobalStats = useMemo(() => {
        const sortableItems = [...globalStats];
        if (sortConfig) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;
                if (sortConfig.key === 'name') {
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }
                 if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [globalStats, sortConfig]);

    const availableSummaryMonths = useMemo(() => {
        const months = new Set(trainingSessions.map(s => s.date.substring(0, 7)));
        return Array.from(months).sort().reverse();
    }, [trainingSessions]);
    
    const monthlySummaryData = useMemo(() => {
        if (!selectedSummaryMonth) return [];
        const trainingsInMonth = trainingSessions.filter(s => s.date.startsWith(selectedSummaryMonth));
        return players.map(player => {
            const stats = { present: 0, absent: 0, justified: 0 };
            trainingsInMonth.forEach(session => {
                const attendance = trainingAttendance[session.id]?.[player.id];
                if (attendance) stats[attendance]++;
            });
            return { playerId: player.id, playerName: player.name, ...stats };
        });
    }, [selectedSummaryMonth, trainingSessions, trainingAttendance, players]);

    const handleExportCSV = () => {
        if (!selectedSummaryMonth || monthlySummaryData.length === 0) return;
        const monthYear = new Date(`${selectedSummaryMonth}-02`).toLocaleString('it-IT', { month: 'long', year: 'numeric' });
        const filename = `Riepilogo_Presenze_${monthYear.replace(' ', '_')}.csv`;
        const headers = ['Giocatore', 'Presente', 'Assente', 'Giustificato'];
        const csvRows = [headers.join(','), ...monthlySummaryData.map(d => [d.playerName, d.present, d.absent, d.justified].join(','))];
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // --- RENDER LOGIC ---
    const renderContent = () => {
        switch (activeTab) {
            case 'Giocatori':
                return (
                    <div>
                        <h2>Gestione Giocatori</h2>
                         <form onSubmit={handleAddPlayer}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="name">Nome Giocatore</label>
                                    <input type="text" id="name" placeholder="Es. Mario Rossi" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="role">Ruolo</label>
                                    <select id="role" value={newPlayer.role} onChange={e => setNewPlayer({...newPlayer, role: e.target.value})}>
                                        <option value="">Seleziona ruolo</option>
                                        {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="birthYear">Anno di Nascita</label>
                                    <select id="birthYear" value={newPlayer.birthYear} onChange={e => setNewPlayer({...newPlayer, birthYear: e.target.value})}>
                                        <option value="">Seleziona anno</option>
                                        {BIRTH_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                                    </select>
                                </div>
                                <button type="submit">Aggiungi Giocatore</button>
                            </div>
                        </form>
                        <hr/>
                        <div className="import-section">
                            <h3>Importa da CSV</h3>
                            <p>Carica un file CSV con le colonne: <strong>nome, cognome, Ruolo, anno di nascita</strong>. L'intestazione è obbligatoria.</p>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="csv-import">Seleziona File CSV</label>
                                    <input 
                                        type="file" 
                                        id="csv-import" 
                                        accept=".csv,text/csv" 
                                        onChange={handleFileChange} 
                                        ref={fileInputRef}
                                    />
                                </div>
                                <button type="button" onClick={handleImportCSV} disabled={!csvFile}>
                                    Importa Giocatori
                                </button>
                            </div>
                        </div>
                        <div className="view-header">
                             <h3>Elenco Giocatori</h3>
                             <div className="view-toggle">
                                 <button className={playerView === 'grid' ? 'active' : ''} onClick={() => setPlayerView('grid')}>Griglia</button>
                                 <button className={playerView === 'list' ? 'active' : ''} onClick={() => setPlayerView('list')}>Lista</button>
                             </div>
                        </div>
                        {players.length === 0 ? (<p className="info-message">Nessun giocatore in rosa. Aggiungine uno per iniziare.</p>) :
                        playerView === 'grid' ? (
                            <div className="player-grid">
                                {players.map(p => (
                                    <div key={p.id} className="player-card">
                                    {editingPlayer && editingPlayer.id === p.id ? (
                                        <form className="edit-form" onSubmit={handleUpdatePlayerSubmit}>
                                            <div className="form-grid">
                                                <input type="text" value={editingPlayer.name} onChange={e => setEditingPlayer({...editingPlayer, name: e.target.value})} />
                                                <select value={editingPlayer.role} onChange={e => setEditingPlayer({...editingPlayer, role: e.target.value})}>
                                                    {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                                </select>
                                                <select value={editingPlayer.birthYear} onChange={e => setEditingPlayer({...editingPlayer, birthYear: e.target.value})}>
                                                    {BIRTH_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                                                </select>
                                            </div>
                                            <div className="actions">
                                                <button type="submit">Salva</button>
                                                <button type="button" className="secondary" onClick={() => setEditingPlayer(null)}>Annulla</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div>
                                                <h4>{p.name}</h4>
                                                <p><strong>Ruolo:</strong> {p.role}</p>
                                                <p><strong>Anno di Nascita:</strong> {p.birthYear}</p>
                                            </div>
                                            <div className="actions">
                                                <button onClick={() => setEditingPlayer(p)}>Modifica</button>
                                                <button className="danger" onClick={() => handleDeletePlayer(p.id)}>Elimina</button>
                                            </div>
                                        </>
                                    )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <table className="player-list-table">
                                <thead>
                                    <tr>
                                        <th>Nome Giocatore</th>
                                        <th>Ruolo</th>
                                        <th>Anno di Nascita</th>
                                        <th>Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map(p => (
                                        <tr key={p.id}>
                                            {editingPlayer && editingPlayer.id === p.id ? (
                                                <>
                                                    <td><input type="text" value={editingPlayer.name} onChange={e => setEditingPlayer({...editingPlayer, name: e.target.value})} /></td>
                                                    <td>
                                                        <select value={editingPlayer.role} onChange={e => setEditingPlayer({...editingPlayer, role: e.target.value})}>
                                                            {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <select value={editingPlayer.birthYear} onChange={e => setEditingPlayer({...editingPlayer, birthYear: e.target.value})}>
                                                            {BIRTH_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <div className="actions">
                                                            <button onClick={performUpdatePlayer}>Salva</button>
                                                            <button className="secondary" onClick={() => setEditingPlayer(null)}>Annulla</button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td>{p.name}</td>
                                                    <td>{p.role}</td>
                                                    <td>{p.birthYear}</td>
                                                    <td>
                                                        <div className="actions">
                                                            <button onClick={() => setEditingPlayer(p)}>Modifica</button>
                                                            <button className="danger" onClick={() => handleDeletePlayer(p.id)}>Elimina</button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            case 'Convocazioni': {
                const currentSquad = squadSelections[selectedMatchForSquad] || [];
                const totalSelected = currentSquad.length;
                const fuoriQuotaSelected = currentSquad.filter(playerId => {
                    const player = players.find(p => p.id === playerId);
                    return player && ['2005', '2006'].includes(player.birthYear);
                }).length;

                return (
                    <div>
                        <h2>Convocazioni Partite</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="match-squad-select">Seleziona Partita</label>
                                <select id="match-squad-select" value={selectedMatchForSquad} onChange={e => setSelectedMatchForSquad(e.target.value)}>
                                    <option value="">-- Seleziona una partita --</option>
                                    {matches.map(match => (
                                        <option key={match.id} value={match.id}>
                                            {new Date(match.date).toLocaleDateString('it-IT')} vs {match.opponent} ({match.location})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {selectedMatchForSquad ? (
                             <>
                                {players.length > 0 ? (
                                    <>
                                        <div className="squad-summary">
                                            <span>Convocati: <strong>{totalSelected} / 20</strong></span>
                                            <span>Fuori Quota (2005/06): <strong>{fuoriQuotaSelected} / 4</strong></span>
                                        </div>
                                        <ul className="squad-list">
                                            {sortedPlayersForSquad.map(player => {
                                                const isSelected = currentSquad.includes(player.id);
                                                const isFuoriQuota = ['2005', '2006'].includes(player.birthYear);
                                                const isDisabled = !isSelected && (
                                                    totalSelected >= 20 ||
                                                    (isFuoriQuota && fuoriQuotaSelected >= 4)
                                                );

                                                return (
                                                    <li key={player.id} className={`squad-player-item ${isDisabled ? 'disabled' : ''}`}>
                                                        <div className="squad-player-info">
                                                            <span className="player-name">{player.name}</span>
                                                            <span className="player-details">{player.role} - {player.birthYear}</span>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="squad-checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleToggleSquadSelection(selectedMatchForSquad, player.id)}
                                                            disabled={isDisabled}
                                                        />
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </>
                                ) : <p className="info-message">Aggiungi giocatori per creare una convocazione.</p>}
                                <div className="whatsapp-generator">
                                    <button type="button" onClick={handleGenerateWhatsAppMessage} disabled={!selectedMatchForSquad}>
                                        Genera Messaggio WhatsApp
                                    </button>
                                    {whatsAppMessage && (
                                        <div className="whatsapp-message-container">
                                            <textarea readOnly value={whatsAppMessage}></textarea>
                                            <div className="copy-container">
                                                <button type="button" onClick={handleCopyToClipboard}>
                                                    {copySuccess ? copySuccess : 'Copia Messaggio'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="info-message">Seleziona una partita per gestire le convocazioni.</p>
                        )}
                    </div>
                );
            }
            case 'Campionato':
                 return (
                    <div>
                        <h2>Campionato</h2>
                        <nav className="sub-nav">
                            {Object.keys(WIDGETS).map(widgetName => (
                                <button
                                    key={widgetName}
                                    className={activeWidget === widgetName ? 'active' : ''}
                                    onClick={() => setActiveWidget(widgetName)}
                                >
                                    {widgetName}
                                </button>
                            ))}
                        </nav>
                        <div className="widget-container">
                             <iframe
                                key={activeWidget}
                                src={WIDGETS[activeWidget].src}
                                style={{ height: `${WIDGETS[activeWidget].height}px` }}
                                scrolling="no"
                                frameBorder="0"
                                loading="lazy"
                            ></iframe>
                        </div>
                    </div>
                );
            case 'Allenamenti':
                 return (
                    <div>
                        <h2>Gestione Allenamenti</h2>
                        <form onSubmit={handleCreateTraining}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="trainingDate">Data Allenamento</label>
                                    <input
                                        type="date"
                                        id="trainingDate"
                                        value={newTraining.date}
                                        onChange={e => setNewTraining({...newTraining, date: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="trainingNotes">Note</label>
                                    <input
                                        type="text"
                                        id="trainingNotes"
                                        placeholder="Es. Lavoro atletico"
                                        value={newTraining.notes}
                                        onChange={e => setNewTraining({...newTraining, notes: e.target.value})}
                                    />
                                </div>
                                <button type="submit">Crea Allenamento</button>
                            </div>
                        </form>
                        <hr/>
                        <h3>Elenco Allenamenti</h3>
                        {trainingSessions.length === 0 ? <p className="info-message">Nessun allenamento creato.</p> :
                         <ul className="trainings-list">
                             {trainingSessions.map(session => (
                                 <li
                                     key={session.id}
                                     className={selectedTrainingId === session.id ? 'active' : ''}
                                     onClick={() => setSelectedTrainingId(session.id)}
                                 >
                                     <div className="training-item-content">
                                        <span>{new Date(session.date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        <span>{session.notes}</span>
                                     </div>
                                     <button 
                                         className="danger" 
                                         onClick={(e) => {
                                             e.stopPropagation();
                                             setTrainingToDelete(session.id);
                                         }}
                                     >
                                         Elimina
                                     </button>
                                 </li>
                             ))}
                         </ul>
                        }

                        {selectedTrainingId && (
                            <>
                                <h3>Presenze per l'allenamento del {new Date(trainingSessions.find(t=>t.id === selectedTrainingId)?.date || '').toLocaleDateString('it-IT')}</h3>
                                {players.length === 0 ? <p className="info-message">Aggiungi giocatori per registrare le presenze.</p> :
                                <div className="attendance-grid">
                                    {players.map(player => (
                                        <React.Fragment key={player.id}>
                                            <div className="attendance-player-name">{player.name}</div>
                                            <div className="attendance-controls">
                                                <button
                                                    className={`present ${trainingAttendance[selectedTrainingId]?.[player.id] === 'present' ? 'selected' : ''}`}
                                                    onClick={() => handleSetAttendance(selectedTrainingId, player.id, 'present')}>
                                                    Presente
                                                </button>
                                                <button
                                                    className={`absent ${trainingAttendance[selectedTrainingId]?.[player.id] === 'absent' ? 'selected' : ''}`}
                                                    onClick={() => handleSetAttendance(selectedTrainingId, player.id, 'absent')}>
                                                    Assente
                                                </button>
                                                <button
                                                    className={`justified ${trainingAttendance[selectedTrainingId]?.[player.id] === 'justified' ? 'selected' : ''}`}
                                                    onClick={() => handleSetAttendance(selectedTrainingId, player.id, 'justified')}>
                                                    Giustificato
                                                </button>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>
                                }
                            </>
                        )}
                        <div className="summary-section">
                            <h3>Riepilogo Presenze Mensile</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="summaryMonth">Seleziona Mese</label>
                                    <select id="summaryMonth" value={selectedSummaryMonth} onChange={e => setSelectedSummaryMonth(e.target.value)}>
                                        <option value="">-- Seleziona --</option>
                                        {availableSummaryMonths.map(month => (
                                            <option key={month} value={month}>
                                                {new Date(month + '-02').toLocaleString('it-IT', { month: 'long', year: 'numeric' })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button type="button" onClick={handleExportCSV} disabled={!selectedSummaryMonth || monthlySummaryData.length === 0}>
                                    Esporta CSV
                                </button>
                            </div>
                             {selectedSummaryMonth ? (
                                players.length > 0 ? (
                                <table className="summary-table">
                                    <thead>
                                        <tr>
                                            <th>Giocatore</th>
                                            <th>Presente</th>
                                            <th>Assente</th>
                                            <th>Giustificato</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthlySummaryData.map(data => (
                                            <tr key={data.playerId}>
                                                <td>{data.playerName}</td>
                                                <td>{data.present}</td>
                                                <td>{data.absent}</td>
                                                <td>{data.justified}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                ) : <p className="info-message">Aggiungi giocatori per vedere il riepilogo.</p>
                            ) : (
                                <p className="info-message">Seleziona un mese per visualizzare il riepilogo.</p>
                            )}
                        </div>
                    </div>
                 );
            case 'Statistiche':
                return (
                    <div>
                        <h2>Statistiche</h2>
                        <div className="stats-view-toggle">
                            <button className={statsView === 'match' ? 'active' : ''} onClick={() => setStatsView('match')}>Partita</button>
                            <button className={statsView === 'global' ? 'active' : ''} onClick={() => setStatsView('global')}>Globale</button>
                        </div>

                        {statsView === 'match' && (
                            <>
                                <h3>Statistiche Partita</h3>
                                <div className="form-grid">
                                     <select onChange={(e) => setSelectedMatchIdForStats(e.target.value)} value={selectedMatchIdForStats}>
                                        <option value="">Seleziona una partita</option>
                                        {matches.map(match => (
                                            <option key={match.id} value={match.id}>
                                                {new Date(match.date).toLocaleDateString('it-IT')} - {match.homeTeam} vs {match.awayTeam}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {selectedMatchIdForStats ? (
                                    players.length > 0 ? (
                                    <table className="stats-table sortable">
                                        <thead>
                                            <tr>
                                                <th><button type="button" onClick={() => requestSort('name')}>Giocatore {getSortIndicator('name')}</button></th>
                                                <th><button type="button" onClick={() => requestSort('goals')}>Gol {getSortIndicator('goals')}</button></th>
                                                <th><button type="button" onClick={() => requestSort('yellowCards')}>Gialli {getSortIndicator('yellowCards')}</button></th>
                                                <th><button type="button" onClick={() => requestSort('redCards')}>Rossi {getSortIndicator('redCards')}</button></th>
                                                <th><button type="button" onClick={() => requestSort('minutesPlayed')}>Minuti {getSortIndicator('minutesPlayed')}</button></th>
                                                <th>Azioni</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedPlayersForMatchStats.map(item => (
                                                <tr key={item.id}>
                                                    {editingStatsPlayerId === item.id ? (
                                                        <>
                                                          <td>{item.name}</td>
                                                          <td><input type="number" value={currentEditingStats?.goals} onChange={(e) => handleStatInputChange(e, 'goals')} /></td>
                                                          <td><input type="number" value={currentEditingStats?.yellowCards} onChange={(e) => handleStatInputChange(e, 'yellowCards')} /></td>
                                                          <td><input type="number" value={currentEditingStats?.redCards} onChange={(e) => handleStatInputChange(e, 'redCards')} /></td>
                                                          <td><input type="number" value={currentEditingStats?.minutesPlayed} onChange={(e) => handleStatInputChange(e, 'minutesPlayed')} /></td>
                                                          <td>
                                                              <div className="actions">
                                                                  <button onClick={handleSaveStats}>Salva</button>
                                                                  <button className="secondary" onClick={handleCancelEditStats}>Annulla</button>
                                                              </div>
                                                          </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                          <td>{item.name}</td>
                                                          <td>{item.stats.goals}</td>
                                                          <td>{item.stats.yellowCards}</td>
                                                          <td>{item.stats.redCards}</td>
                                                          <td>{item.stats.minutesPlayed}</td>
                                                          <td>
                                                              <div className="actions">
                                                                  <button onClick={() => handleEditStatsClick(item)}>Modifica</button>
                                                              </div>
                                                          </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    ) : <p className="info-message">Aggiungi giocatori per inserire le statistiche.</p>
                                ) : (
                                    <p className="info-message">Seleziona una partita per vedere e modificare le statistiche.</p>
                                )}
                            </>
                        )}

                        {statsView === 'global' && (
                             <>
                                <h3>Statistiche Globali Stagione</h3>
                                {players.length > 0 ? (
                                <table className="stats-table sortable">
                                    <thead>
                                        <tr>
                                            <th><button type="button" onClick={() => requestSort('name')}>Giocatore {getSortIndicator('name')}</button></th>
                                            <th><button type="button" onClick={() => requestSort('goals')}>Gol {getSortIndicator('goals')}</button></th>
                                            <th><button type="button" onClick={() => requestSort('yellowCards')}>Gialli {getSortIndicator('yellowCards')}</button></th>
                                            <th><button type="button" onClick={() => requestSort('redCards')}>Rossi {getSortIndicator('redCards')}</button></th>
                                            <th><button type="button" onClick={() => requestSort('minutesPlayed')}>Minuti Giocati {getSortIndicator('minutesPlayed')}</button></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedGlobalStats.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.name}</td>
                                                <td>{item.goals}</td>
                                                <td>{item.yellowCards}</td>
                                                <td>{item.redCards}</td>
                                                <td>{item.minutesPlayed}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                ) : <p className="info-message">Nessun dato statistico disponibile. Aggiungi giocatori e statistiche di partita.</p>}
                            </>
                        )}
                    </div>
                );
        }
    };

    const trainingSessionToDelete = useMemo(() => {
        if (!trainingToDelete) return null;
        return trainingSessions.find(s => s.id === trainingToDelete);
    }, [trainingToDelete, trainingSessions]);
    
    return (
        <div className="container">
            <header>
                <div className="header-content">
                    <img src={TEAM_LOGO_BASE64} alt={`${TEAM_NAME} Logo`} />
                    <h1>{TEAM_NAME} Manager</h1>
                </div>
                 <div className="theme-switcher">
                    <label htmlFor="theme-toggle" className="switch-label" title={isDarkMode ? 'Attiva modalità chiara' : 'Attiva modalità scura'}>
                        <input
                            id="theme-toggle"
                            type="checkbox"
                            checked={isDarkMode}
                            onChange={() => setIsDarkMode(prev => !prev)}
                            aria-label="Toggle dark mode"
                        />
                        <span className="switch-slider"></span>
                    </label>
                </div>
            </header>
            <nav>
                <button onClick={() => setActiveTab('Giocatori')} className={activeTab === 'Giocatori' ? 'active' : ''}>Giocatori</button>
                <button onClick={() => setActiveTab('Convocazioni')} className={activeTab === 'Convocazioni' ? 'active' : ''}>Convocazioni</button>
                <button onClick={() => setActiveTab('Campionato')} className={activeTab === 'Campionato' ? 'active' : ''}>Campionato</button>
                <button onClick={() => setActiveTab('Allenamenti')} className={activeTab === 'Allenamenti' ? 'active' : ''}>Allenamenti</button>
                <button onClick={() => setActiveTab('Statistiche')} className={activeTab === 'Statistiche' ? 'active' : ''}>Statistiche</button>
            </nav>
            <main>
                <div className="tab-content">
                    {renderContent()}
                </div>
            </main>
            
            {trainingToDelete && trainingSessionToDelete && (
                <div className="modal-overlay" onClick={() => setTrainingToDelete(null)}>
                    <div className="modal-dialog" onClick={e => e.stopPropagation()}>
                        <h3>Conferma Eliminazione</h3>
                        <p>
                            Sei sicuro di voler eliminare l'allenamento del{' '}
                            <strong>
                                {new Date(trainingSessionToDelete.date + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </strong>
                            ?
                            <br/>
                            L'azione è irreversibile e cancellerà anche le presenze associate.
                        </p>
                        <div className="modal-actions">
                            <button className="secondary" onClick={() => setTrainingToDelete(null)}>Annulla</button>
                            <button className="danger" onClick={handleConfirmDeleteTraining}>Conferma Eliminazione</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);