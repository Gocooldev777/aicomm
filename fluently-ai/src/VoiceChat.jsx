import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { speakWithElevenLabs } from "./elevenlabsTTS";
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';
import './VoiceChat.css';

const VoiceChat = () => {
    const [messages, setMessages] = useState([]);
    const [typedMessage, setTypedMessage] = useState("");
    const [listening, setListening] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [userMetrics, setUserMetrics] = useState({
        grammarScore: 0,
        vocabularyScore: 0,
        fluencyScore: 0,
        improvements: []
    });
    const recognitionRef = useRef(null);
    const silenceTimeout = useRef(null);
    const chatContainerRef = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("❌ Speech Recognition not supported. Please use Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-US";
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            console.log("🎤 Voice recognition started");
            setListening(true);
        };

        recognition.onend = () => {
            console.log("🛑 Voice recognition ended");
            setListening(false);
        };

        recognition.onresult = (event) => {
            const finalTranscript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('')
                .trim();

            if (finalTranscript.length === 0) return;

            setTranscript(finalTranscript);

            if (silenceTimeout.current) {
                clearTimeout(silenceTimeout.current);
            }

            // Set a timeout to pause listening after 4 seconds of silence
            silenceTimeout.current = setTimeout(() => {
                stopListening();
                processUserInput(finalTranscript);
            }, 4000);
        };

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [hasStarted, isProcessing]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        console.log("Listening state changed:", listening);
    }, [listening]);

    const startSession = async () => {
        const greeting = "Hi! I'm your English fluency coach. Let's begin. Tell me how your day is going.";
        addMessage("assistant", greeting);
        await speakWithElevenLabs(greeting);
    };

    const startListening = () => {
        if (recognitionRef.current && !listening) {
            try {
                recognitionRef.current.start();
                setListening(true);
            } catch (error) {
                console.error('Error starting recognition:', error);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && listening) {
            recognitionRef.current.stop();
            setListening(false);
        }
        if (silenceTimeout.current) {
            clearTimeout(silenceTimeout.current);
        }
    };

    const processUserInput = async (text) => {
        try {
            setIsProcessing(true);
            addMessage("user", text);

            const conversationHistory = messages.slice(-4).map(m => 
                `${m.role}: ${m.content}`
            ).join('\n');

            const prompt = `
                Previous conversation:
                ${conversationHistory}

                User's input: "${text}"

                As a friendly English tutor:
                1. Provide a natural response
                2. If there are grammar/vocabulary improvements needed, use the format: "You meant: '[correction]' ✅ [reason]"
                3. Continue the conversation with a follow-up question
                4. Track progress by noting improvements

                Keep the conversation flowing naturally while teaching gradually.
            `;

            const response = await axios.post("http://localhost:3001/chat", {
                message: prompt,
                model: "ft:gpt-3.5-turbo-0125:hysteresis::BHByNyyK"
            });

            const aiResponse = response.data.reply;
            addMessage("assistant", aiResponse);

            // Speak the response
            await speakWithElevenLabs(aiResponse);

            setIsProcessing(false);

        } catch (err) {
            console.error("❌ Error processing response:", err);
            setIsProcessing(false);
        }
    };

    const updateUserMetrics = (feedback, validation) => {
        const newMetrics = {
            grammarScore: userMetrics.grammarScore,
            vocabularyScore: userMetrics.vocabularyScore,
            fluencyScore: userMetrics.fluencyScore,
            improvements: [...userMetrics.improvements]
        };

        // Update scores based on feedback
        if (feedback.toLowerCase().includes('grammar')) {
            newMetrics.grammarScore = Math.min(100, newMetrics.grammarScore + 5);
        }
        if (feedback.toLowerCase().includes('vocabulary')) {
            newMetrics.vocabularyScore = Math.min(100, newMetrics.vocabularyScore + 5);
        }
        if (feedback.toLowerCase().includes('fluent')) {
            newMetrics.fluencyScore = Math.min(100, newMetrics.fluencyScore + 5);
        }

        // Adjust scores based on validation
        if (validation.toLowerCase().includes('yes')) {
            // Boost all scores slightly for good understanding
            newMetrics.grammarScore = Math.min(100, newMetrics.grammarScore + 2);
            newMetrics.vocabularyScore = Math.min(100, newMetrics.vocabularyScore + 2);
            newMetrics.fluencyScore = Math.min(100, newMetrics.fluencyScore + 2);
        } else if (validation.toLowerCase().includes('no')) {
            // Slightly decrease scores for lack of understanding
            newMetrics.grammarScore = Math.max(0, newMetrics.grammarScore - 1);
            newMetrics.vocabularyScore = Math.max(0, newMetrics.vocabularyScore - 1);
            newMetrics.fluencyScore = Math.max(0, newMetrics.fluencyScore - 1);
        }

        // Add combined feedback to improvements
        const combinedFeedback = `${feedback}\nUnderstanding: ${validation}`;
        newMetrics.improvements.push({
            timestamp: new Date(),
            feedback: combinedFeedback
        });

        setUserMetrics(newMetrics);
    };

    const speak = (text) => {
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = resolve;
            window.speechSynthesis.speak(utterance);
        });
    };

    const handleTypedMessage = async () => {
        if (typedMessage.trim()) {
            await processUserInput(typedMessage);
            setTypedMessage("");
        }
    };

    const addMessage = (role, content) => {
        setMessages(prevMessages => [...prevMessages, { role, content }]);
    };

    return (
        <div className="voice-chat-layout">
            <div className="chat-section">
                {!hasStarted ? (
                    <div className="welcome-screen">
                        <div className="welcome-content">
                            <h1>🗣️ Fluently AI</h1>
                            <p>Your personal English fluency coach powered by AI</p>
                            <button 
                                className="start-button"
                                onClick={() => {
                                    setHasStarted(true);
                                    startSession();
                                }}
                            >
                                Start Conversation
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="chat-interface">
                        <div className="chat-header">
                            <h2>Fluently AI</h2>
                            <div className={`status-indicator ${listening ? 'active' : ''}`}>
                                {isProcessing ? (
                                    <span className="processing">Processing...</span>
                                ) : listening ? (
                                    <>
                                        <FaMicrophone className="mic-icon pulse" />
                                        <span>Listening...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaMicrophoneSlash className="mic-icon" />
                                        <span>Paused</span>
                                    </>
                                )}
                            </div>
                            <button 
                                className="toggle-listening-button"
                                onClick={listening ? stopListening : startListening}
                            >
                                {listening ? "Pause Listening" : "Start Listening"}
                            </button>
                        </div>

                        <div className="chat-messages" ref={chatContainerRef}>
                            {messages.map((msg, i) => (
                                <div key={i} className={`message ${msg.role}-message`}>
                                    <div className="message-content">
                                        <p>{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="chat-input">
                            <input
                                type="text"
                                placeholder="Type your message here..."
                                value={typedMessage}
                                onChange={(e) => setTypedMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleTypedMessage();
                                }}
                            />
                            <button 
                                className="send-button"
                                onClick={handleTypedMessage}
                                disabled={!typedMessage.trim() || isProcessing}
                            >
                                <IoSend />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="metrics-dashboard">
                <h3>Learning Progress</h3>
                
                <div className="metrics-grid">
                    <div className="metric-card">
                        <h4>Grammar</h4>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill"
                                style={{width: `${userMetrics.grammarScore}%`}}
                            />
                        </div>
                        <span>{userMetrics.grammarScore}%</span>
                    </div>

                    <div className="metric-card">
                        <h4>Vocabulary</h4>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill"
                                style={{width: `${userMetrics.vocabularyScore}%`}}
                            />
                        </div>
                        <span>{userMetrics.vocabularyScore}%</span>
                    </div>

                    <div className="metric-card">
                        <h4>Fluency</h4>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill"
                                style={{width: `${userMetrics.fluencyScore}%`}}
                            />
                        </div>
                        <span>{userMetrics.fluencyScore}%</span>
                    </div>
                </div>

                <div className="recent-improvements">
                    <h4>Recent Feedback</h4>
                    <div className="improvements-list">
                        {userMetrics.improvements.slice(-3).map((improvement, index) => (
                            <div key={index} className="improvement-item">
                                {improvement.feedback}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceChat;