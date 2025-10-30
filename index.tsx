// Fix: Removed content from package.json and file separators that were erroneously included in this file.
import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
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
    groundingLinks?: { uri?: string; title?: string; }[];
};


type ActiveTab = 'Campionato' | 'Giocatori' | 'Allenamenti' | 'Statistiche' | 'Assistente AI';


// --- INITIALIZATION ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- CONSTANTS ---
const TEAM_NAME = "Seguro";
const TEAM_LOGO_BASE64 = "data:image/jpeg;base64,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-- RENDER ---
// Fix: Added App component definition to resolve "Cannot find name 'App'" error.
// --- APP COMPONENT ---
const App = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('Giocatori');
    const [players, setPlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Mock data for demonstration as Firestore logic is not fully specified.
        const mockPlayers: Player[] = [
            { id: '1', name: 'Mario Rossi', role: 'Attaccante', number: '10' },
            { id: '2', name: 'Luigi Verdi', role: 'Difensore', number: '3' },
            { id: '3', name: 'Paolo Bianchi', role: 'Centrocampista', number: '8' },
        ];
        setPlayers(mockPlayers);

        const mockMatches: Match[] = [
            { id: 'm1', date: '2024-10-26', time: '15:00', opponent: 'AC Milan', location: 'Casa' },
            { id: 'm2', date: '2024-11-02', time: '20:45', opponent: 'Juventus', location: 'Trasferta' },
        ];
        setMatches(mockMatches);

        setChatMessages([
          { sender: 'ai', text: 'Ciao! Sono il tuo assistente AI per la squadra. Come posso aiutarti oggi?' }
        ]);
    }, []);

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || loading) return;

        const userMessage: ChatMessage = { sender: 'user', text: userInput };
        setChatMessages(prev => [...prev, userMessage, { sender: 'loading', text: '...' }]);
        setLoading(true);
        setUserInput('');

        try {
            const context = `
                You are a helpful AI assistant for the "${TEAM_NAME}" football team.
                Current team data:
                Players: ${JSON.stringify(players, null, 2)}.
                Matches: ${JSON.stringify(matches, null, 2)}.
                Use this data and also search the web to answer questions.
            `;
            const fullPrompt = `${context}\n\nUser question: ${userInput}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
                 config: {
                    tools: [{googleSearch: {}}],
                }
            });

            const aiText = response.text;
            const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
            const groundingLinks = groundingMetadata?.groundingChunks
                ?.map(chunk => chunk.web)
                .filter(web => web?.uri);

            const aiMessage: ChatMessage = { 
                sender: 'ai', 
                text: aiText, 
                groundingLinks: groundingLinks as { uri?: string; title?: string; }[] | undefined
            };
            setChatMessages(prev => [...prev.slice(0, -1), aiMessage]);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessage: ChatMessage = { sender: 'error', text: 'Oops! Qualcosa è andato storto. Riprova.' };
            setChatMessages(prev => [...prev.slice(0, -1), errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Giocatori':
                return (
                    <div>
                        <h2>Elenco Giocatori</h2>
                        <ul>
                            {players.map(p => <li key={p.id}>{p.number} - {p.name} ({p.role})</li>)}
                        </ul>
                    </div>
                );
            case 'Campionato':
                 return (
                    <div>
                        <h2>Partite Campionato</h2>
                        <ul>
                            {matches.map(m => <li key={m.id}>{m.date} {m.time} - {TEAM_NAME} vs {m.opponent} ({m.location})</li>)}
                        </ul>
                    </div>
                );
            case 'Assistente AI':
                return (
                    <div className="chat-container">
                        <div className="chat-messages">
                            {chatMessages.map((msg, index) => (
                                <div key={index} className={`message ${msg.sender}`}>
                                    <p>{msg.text}</p>
                                    {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                                        <div className="grounding-links">
                                           <strong>Fonti:</strong>
                                           <ul>
                                               {msg.groundingLinks.map((link, i) => (
                                                   <li key={i}><a href={link.uri} target="_blank" rel="noopener noreferrer">{link.title || link.uri}</a></li>
                                               ))}
                                           </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendMessage} className="chat-input-form">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Chiedi qualcosa..."
                                disabled={loading}
                            />
                            <button type="submit" disabled={loading}>{loading ? '...' : 'Invia'}</button>
                        </form>
                    </div>
                );
            case 'Allenamenti':
            case 'Statistiche':
                 return <div><h2>{activeTab}</h2><p>Contenuto non ancora implementato.</p></div>;
            default:
                return <div>Seleziona una scheda</div>;
        }
    };

    return (
        <div className="app-container">
            <header>
                <img src={TEAM_LOGO_BASE64} alt="Team Logo" className="team-logo" />
                <h1>{TEAM_NAME} Team Manager</h1>
            </header>
            <nav>
                {(['Giocatori', 'Campionato', 'Allenamenti', 'Statistiche', 'Assistente AI'] as ActiveTab[]).map(tab => (
                    <button
                        key={tab}
                        className={activeTab === tab ? 'active' : ''}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </nav>
            <main>
                {renderContent()}
            </main>
            <footer>
                <p>Seguro Calcio Management App</p>
            </footer>
             <style>{`
                /* Basic Styles */
                body { font-family: sans-serif; margin: 0; background-color: #f4f4f9; color: #333; }
                .app-container { max-width: 1200px; margin: 0 auto; padding: 20px; background-color: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                header { display: flex; align-items: center; border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 20px; }
                .team-logo { width: 50px; height: 50px; margin-right: 15px; }
                header h1 { color: #0056b3; margin: 0; }
                nav { margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; }
                nav button { padding: 10px 15px; border: 1px solid #ccc; background-color: #f0f0f0; cursor: pointer; border-radius: 5px; font-size: 16px; }
                nav button.active { background-color: #0056b3; color: white; border-color: #0056b3; }
                nav button:hover:not(.active) { background-color: #e0e0e0; }
                main { min-height: 400px; }
                footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; font-size: 14px; color: #777; }
                ul { list-style-type: none; padding-left: 0;}
                li { background-color: #f9f9f9; border: 1px solid #ddd; padding: 10px; margin-bottom: 5px; border-radius: 3px;}

                /* Chat Styles */
                .chat-container { display: flex; flex-direction: column; height: 500px; border: 1px solid #ccc; border-radius: 5px; }
                .chat-messages { flex-grow: 1; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
                .message { max-width: 80%; padding: 10px 15px; border-radius: 15px; line-height: 1.5; }
                .message.user { background-color: #007bff; color: white; align-self: flex-end; border-bottom-right-radius: 0; }
                .message.ai { background-color: #e9ecef; color: #333; align-self: flex-start; border-bottom-left-radius: 0; }
                .message.loading, .message.error { background-color: #f8d7da; color: #721c24; align-self: center; text-align: center; }
                .grounding-links { margin-top: 10px; font-size: 0.9em; border-top: 1px solid #ddd; padding-top: 5px; }
                .grounding-links ul { list-style-type: none; padding-left: 0; }
                .grounding-links li { padding: 2px 0; border: none; background: none; }
                .grounding-links a { color: #0056b3; }
                .chat-input-form { display: flex; padding: 10px; border-top: 1px solid #ccc; }
                .chat-input-form input { flex-grow: 1; padding: 10px; border: 1px solid #ccc; border-radius: 5px; margin-right: 10px; }
                .chat-input-form button { padding: 10px 15px; border: none; background-color: #007bff; color: white; border-radius: 5px; cursor: pointer; }
                .chat-input-form button:disabled { background-color: #ccc; }
             `}</style>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);