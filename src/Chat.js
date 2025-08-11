import React from "react";
import { ChatClient  } from '@azure/communication-chat';
import {
  AzureCommunicationTokenCredential,
  parseConnectionString
} from "@azure/communication-common";
import { CommunicationIdentityClient } from "@azure/communication-identity";
import {ConnectionString} from "./config.js"
import './ChatUI.css';
const { AzureLogger, setLogLevel } = require("@azure/logger");


class Chat extends React.Component {
    constructor(props) {
        super(props);

        // Bind all methods (using arrow functions would be cleaner in a modern refactor)
        this.handleEvent = this.handleEvent.bind(this);
        this.createChatClient = this.createChatClient.bind(this);
        this.createChatThread = this.createChatThread.bind(this);
        this.sendChatMessage = this.sendChatMessage.bind(this);
        this.updateChatMessage = this.updateChatMessage.bind(this);
        this.deleteChatMessage = this.deleteChatMessage.bind(this);
        this.sendTypingNotification = this.sendTypingNotification.bind(this);
        this.sendReadReceipt = this.sendReadReceipt.bind(this);
        this.updateTopic = this.updateTopic.bind(this);
        this.updateMetadata = this.updateMetadata.bind(this);
        this.updateRetentionPolicy = this.updateRetentionPolicy.bind(this);
        this.deleteChatThread = this.deleteChatThread.bind(this);
        this.addParticipants = this.addParticipants.bind(this);
        this.removeParticipant = this.removeParticipant.bind(this);

        this.state = {
            // Core Azure Communication Services state
            chatClient: null,
            threadId: null,
            threadClient: null,
            messageId: null,
            lastUser: null,
            isConnected: false,

            // UI and data state
            messages: [],
            participants: [],
            events: [],
            messageInput: '',

            // Participant name management
            participantNames: [
                'Alice', 'Bob', 'Charlie', 'Diana', 'Emma', 'Frank', 'Grace', 'Henry',
                'Isabella', 'Jack', 'Kate', 'Liam', 'Maya', 'Nathan', 'Olivia', 'Peter',
                'Quinn', 'Rachel', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zoe'
            ],
            usedNameIndex: 0,

            // Legacy state (can be removed in future refactor)
            userToken: null,
            event: '',
            details: ''
        };
    }

    // =============================================================================
    // EVENT HANDLING
    // =============================================================================

    handleEvent(eventName, details) {
        console.log(`Notification: ${eventName}. Details: ${details}.`);

        const newEvent = {
            id: Date.now(),
            name: eventName,
            details: details,
            timestamp: new Date().toLocaleTimeString()
        };

        this.setState(prevState => ({
            events: [newEvent, ...prevState.events].slice(0, 50), // Keep last 50 events
            event: eventName,
            details: details
        }));

        // Handle specific events to update UI state
        if (eventName.includes('Message Received')) {
            this.loadMessages();
        }
        if (eventName.includes('Participants Added') || eventName.includes('Participants Removed')) {
            this.loadParticipants();
        }
    }

    // =============================================================================
    // DATA LOADING METHODS
    // =============================================================================

    async loadMessages() {
        if (!this.state.threadClient) return;
        
        try {
            const messages = [];
            for await (let message of this.state.threadClient.listMessages()) {
                messages.push(message);
                if (messages.length >= 20) break; // Limit to recent 20 messages
            }
            this.setState({ messages: messages.reverse() });
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    async loadParticipants() {
        if (!this.state.threadClient) return;
        
        try {
            const participants = [];
            for await (let participant of this.state.threadClient.listParticipants()) {
                participants.push(participant);
            }
            this.setState({ participants });
        } catch (error) {
            console.error('Error loading participants:', error);
        }
    }

    // =============================================================================
    // AZURE COMMUNICATION SERVICES - CLIENT SETUP
    // =============================================================================

    async createChatClient() {
        setLogLevel("verbose");
        // override logging to output to console.log (default location is stderr)
        AzureLogger.log = (...args) => {
                console.log(...args); 
        };

        const endpoint = parseConnectionString(ConnectionString).endpoint;
        
        const identityClient = new CommunicationIdentityClient(ConnectionString);
        const user = await identityClient.createUser();
        const token = await identityClient.getToken(user, ["chat"]);
        const options = {
            // signalingClientOptions: {environment: "INT"}
        };
        const chatClient = new ChatClient(endpoint,new AzureCommunicationTokenCredential(token.token), options);
        console.log(token.token)
        console.log("Chat Client Created")   

        this.setState({chatClient: chatClient});

        chatClient.on("realTimeNotificationConnected", () => {
            let event = `Real-Time Notification Connected`;
            this.setState({ isConnected: true });
            this.handleEvent(event, '');
        });

        chatClient.on("realTimeNotificationDisconnected", () => {
            let event = `Real-Time NotificationDisconnected`;
            this.setState({ isConnected: false });
            this.handleEvent(event, '');
        });

        await chatClient.startRealtimeNotifications();

        chatClient.on("chatThreadCreated", (e) => {
            let event = `Chat Thread Created.`;
            console.log(e.properties.retentionPolicy ?? "NULL");
            this.handleEvent(event, JSON.stringify(e));
        });

        chatClient.on("chatThreadPropertiesUpdated", (e) => {
            let event = `Chat Thread Properties Updated.`;
            this.handleEvent(event, JSON.stringify(e));
        });

        chatClient.on("chatThreadDeleted", (e) => {
            let event = `Chat Thread Deleted.`;
            this.handleEvent(event, JSON.stringify(e));
        });

        chatClient.on("chatMessageReceived", (e) => {
            let event = `Chat Message Received.`;
            this.handleEvent(event, JSON.stringify(e));
        });

        chatClient.on("chatMessageEdited", (e) => {
            let event = `Chat Message Edited.`;
            this.handleEvent(event, JSON.stringify(e));
        });

        chatClient.on("chatMessageDeleted", (e) => {
            let event = `Chat Message Deleted.`;
            this.handleEvent(event, JSON.stringify(e));
        });

        chatClient.on("typingIndicatorReceived", (e) => {
            let event = `Typing Indicator Received.`;
            this.handleEvent(event, JSON.stringify(e));
        });

        chatClient.on("readReceiptReceived", (e) => {
            let event = `Read Receipt Received. `;
            this.handleEvent(event, JSON.stringify(e));
        });

        chatClient.on("participantsAdded", (e) => {
            let event = `Participants Added.`;
            console.log(e.participantsAdded[0].metadata);
            this.handleEvent(event, JSON.stringify(e));
        });

        chatClient.on("participantsRemoved", (e) => {
            let event = `Participants Removed.`;
            this.handleEvent(event, JSON.stringify(e));
        });
    };

    async createChatThread() {
        function onResponse(rawResponse) {
            // log the raw response
            console.log(rawResponse)
        };

        const request = { topic: "Hello, World!" };
        const options = {
            retentionPolicy: {
                kind: "threadCreationDate",
                deleteThreadAfterDays: 90,
            },

            requestOptions: {
                customHeaders: {"access-control-expose-headers": "*"}
            },
            onResponse: onResponse
        };
        const createChatThreadResult = await this.state.chatClient.createChatThread(request, options);
        const threadId = createChatThreadResult.chatThread ? createChatThreadResult.chatThread.id : "";
        const chatThreadClient = this.state.chatClient.getChatThreadClient(threadId);

        console.log(`Created thread. ${JSON.stringify(createChatThreadResult.chatThread)}`);
        

        this.setState({threadId: threadId});
        this.setState({threadClient: chatThreadClient});
        this.setState({messageId: null});
        this.setState({lastUser: null});
        this.setState({messages: []});
        this.setState({participants: []});
        
        // Load initial participants
        await this.loadParticipants();
    }

    async sendChatMessage(messageText = null) {
        const content = messageText || this.state.messageInput;
        if (!content.trim()) return;

        const sendMessageRequest = {
            content: content
        };
        
        let sendMessageOptions = {
            senderDisplayName: 'You',
            type: 'text',
            metadata: {
                timestamp: new Date().toISOString()
            }
        };
        
        const sendChatMessageResult = await this.state.threadClient.sendMessage(sendMessageRequest, sendMessageOptions);
        const messageId = sendChatMessageResult.id;
        this.setState({messageId: messageId, messageInput: ''});
        console.log(`Message sent!, message id:${messageId}`);
        
        // Refresh messages
        await this.loadMessages();
    }

    async updateChatMessage()
    {
        await this.state.threadClient.updateMessage(this.state.messageId, { metadata: {"testvalue" : "testvalue"} });
        console.log(`Updated message.`);
    }

    async deleteChatMessage()
    {
        await this.state.threadClient.deleteMessage(this.state.messageId);
        this.setState({messageId: null});
        console.log("Deleted message.");
    }

    async sendTypingNotification()
    {
        const endpoint = parseConnectionString(ConnectionString).endpoint;
        
        const identityClient = new CommunicationIdentityClient(ConnectionString);
        let token = await identityClient.createUserAndToken(["chat"]);
        const participantName = this.getNextParticipantName();

        let addParticipantsRequest = {
            participants: [
              {
                id: token.user,
                displayName: participantName
              }
            ]
          };
        await this.state.threadClient.addParticipants(addParticipantsRequest);

        let chatClient = new ChatClient(endpoint,new AzureCommunicationTokenCredential(token.token));
        let chatThreadClient = chatClient.getChatThreadClient(this.state.threadId);

        await chatThreadClient.sendTypingNotification();
        this.setState({lastUser: token.user});
        console.log(`Send Typing Notification from ${participantName}.`);
        
        // Refresh participants list
        await this.loadParticipants();
    }

    async sendReadReceipt()
    {
        const endpoint = parseConnectionString(ConnectionString).endpoint;
        
        const identityClient = new CommunicationIdentityClient(ConnectionString);
        let token = await identityClient.createUserAndToken(["chat"]);
        const participantName = this.getNextParticipantName();

        let addParticipantsRequest = {
            participants: [
              {
                id: token.user,
                displayName: participantName
              }
            ]
          };
        await this.state.threadClient.addParticipants(addParticipantsRequest);

        let chatClient = new ChatClient(endpoint,new AzureCommunicationTokenCredential(token.token));
        let chatThreadClient = chatClient.getChatThreadClient(this.state.threadId);

        await chatThreadClient.sendReadReceipt({chatMessageId: this.state.messageId});
        this.setState({lastUser: token.user});

        console.log(`Send Read Receipt from ${participantName}.`);
        
        // Refresh participants list
        await this.loadParticipants();
    }

    async updateTopic()
    {
        await this.state.threadClient.updateTopic("New Topic");
        console.log(`Updated thread's topic.`);
        
        // Refresh messages to show any system messages
        setTimeout(() => this.loadMessages(), 1000);
    }

    async updateMetadata()
    {
        await this.state.threadClient.updateProperties({
            metadata: { threadType: "secondary" },
        });
        console.log(`Updated thread's metadata.`);
        
        // Refresh messages to show any system messages
        setTimeout(() => this.loadMessages(), 1000);
    }

    async updateRetentionPolicy()
    {
        await this.state.threadClient.updateProperties({
            retentionPolicy: null,
        });
        const thread = await this.state.threadClient.getProperties();
        console.log(`Updated thread's retention policy. ${JSON.stringify(thread)}`);
        
        // Refresh messages to show any system messages
        setTimeout(() => this.loadMessages(), 1000);
    }

    async deleteChatThread() {
        await this.state.chatClient.deleteChatThread(this.state.threadId);

        this.setState({
            messageId: null,
            threadId: null,
            threadClient: null,
            messages: [],
            participants: []
        });
    }

    async addParticipants(){
        const identityClient = new CommunicationIdentityClient(ConnectionString);
        let userSue = await identityClient.createUserAndToken(["chat"]);
        const participantName = this.getNextParticipantName();
        
        let addParticipantsRequest = {
            participants: [
              {
                id: userSue.user,
                displayName: participantName,
                metadata: {
                    "userType": "C2"
                }
              }
            ]
          };
          await this.state.threadClient.addParticipants(addParticipantsRequest);
          this.setState({lastUser: userSue.user});
          console.log(`Added chat participant user: ${participantName}`);
          
          // Refresh participants list and messages
          await this.loadParticipants();
          setTimeout(() => this.loadMessages(), 1000);
    }

    async removeParticipant(){
        await this.state.threadClient.removeParticipant(this.state.lastUser);
        this.setState({lastUser: null});
        console.log("Removed chat participant user.");
        
        // Refresh participants list and messages
        await this.loadParticipants();
        setTimeout(() => this.loadMessages(), 1000);
    }

    handleMessageInputChange = (e) => {
        this.setState({ messageInput: e.target.value });
    }

    handleMessageSubmit = (e) => {
        e.preventDefault();
        if (this.state.messageInput.trim()) {
            this.sendChatMessage();
        }
    }

    getNextParticipantName() {
        const name = this.state.participantNames[this.state.usedNameIndex % this.state.participantNames.length];
        this.setState(prevState => ({
            usedNameIndex: prevState.usedNameIndex + 1
        }));
        return name;
    }

    renderMessage(message) {
        let senderName = message.senderDisplayName || 'Unknown';
        let messageClass = 'message';
        
        // Check if it's a system message
        if (message.type && message.type !== 'text' && !message.senderDisplayName) {
            senderName = 'System';
            messageClass = 'message system-message';
        } else if (message.type && message.type !== 'text') {
            senderName = 'System';
            messageClass = 'message system-message';
        }
        
        return (
            <div key={message.id} className={messageClass}>
                <div className="message-header">
                    {senderName} - {new Date(message.createdOn).toLocaleTimeString()}
                </div>
                <div className="message-content">{message.content?.message}</div>
                <div className="message-metadata">
                    ID: {message.id} | Type: {message.type || 'text'}
                </div>
            </div>
        );
    }

    renderParticipant(participant) {
        const isLastUser = this.state.lastUser && participant.id.communicationUserId === this.state.lastUser.communicationUserId;
        return (
            <div key={participant.id.communicationUserId} className="participant-item">
                <div className="participant-info">
                    <div>{participant.displayName || 'Anonymous'}</div>
                    <div className="participant-id">{participant.id.communicationUserId}</div>
                </div>
                {isLastUser && (
                    <button 
                        className="btn btn-danger"
                        onClick={this.removeParticipant}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                        Remove
                    </button>
                )}
            </div>
        );
    }

    renderEvent(event) {
        let formattedDetails = '';
        try {
            if (event.details) {
                const parsed = JSON.parse(event.details);
                formattedDetails = JSON.stringify(parsed, null, 2);
            }
        } catch (e) {
            formattedDetails = event.details;
        }

        return (
            <div key={event.id} className="event-item">
                <div className="event-name">{event.timestamp} - {event.name}</div>
                {formattedDetails && (
                    <div className="event-details">{formattedDetails}</div>
                )}
            </div>
        );
    }


    render() {
        if (this.state.chatClient === null) {
            return (
                <div className="init-screen">
                    <h1 className="init-title">Azure Communication Services</h1>
                    <p className="init-subtitle">Chat Demo Application</p>
                    <button className="btn btn-primary btn-large" onClick={this.createChatClient}>
                        Initialize Chat Client
                    </button>
                </div>
            );
        }

        return (
            <div className="chat-container">
                <div className="chat-main">
                    {/* Header */}
                    <div className="header">
                        <h2>Azure Communication Services - Chat Demo</h2>
                        <div>
                            Connection Status: <strong>{this.state.isConnected ? 'Connected' : 'Disconnected'}</strong>
                        </div>
                    </div>

                    {/* Thread Management */}
                    <div className="thread-section">
                        <div className="section-title">Chat Thread Management</div>
                        
                        <div className="status-info">
                            <div>
                                <span className="status-label">Thread ID:</span> {this.state.threadId || 'No active thread'}
                            </div>
                            <div>
                                <span className="status-label">Message ID:</span> {this.state.messageId || 'No message selected'}
                            </div>
                        </div>

                        <div className="thread-controls">
                            <button className="btn btn-success" onClick={this.createChatThread}>
                                Create Chat Thread
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                onClick={this.updateTopic} 
                                disabled={!this.state.threadId}
                            >
                                Update Topic
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                onClick={this.updateMetadata} 
                                disabled={!this.state.threadId}
                            >
                                Update Metadata
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                onClick={this.updateRetentionPolicy} 
                                disabled={!this.state.threadId}
                            >
                                Update Retention Policy
                            </button>
                            <button 
                                className="btn btn-danger" 
                                onClick={this.deleteChatThread} 
                                disabled={!this.state.threadId}
                            >
                                Delete Thread
                            </button>
                        </div>
                    </div>

                    {/* Chat Box */}
                    {this.state.threadId && (
                        <div className="chat-box">
                            <div className="section-title" style={{padding: '15px 15px 0 15px'}}>Chat Messages</div>
                            
                            <div className="chat-messages">
                                {this.state.messages.length === 0 ? (
                                    <div style={{textAlign: 'center', color: '#666', marginTop: '20px'}}>
                                        No messages yet. Send a message to start the conversation.
                                    </div>
                                ) : (
                                    this.state.messages.map(message => this.renderMessage(message))
                                )}
                            </div>
                            
                            <form onSubmit={this.handleMessageSubmit} className="message-input-section">
                                <input
                                    type="text"
                                    className="message-input"
                                    placeholder="Type your message..."
                                    value={this.state.messageInput}
                                    onChange={this.handleMessageInputChange}
                                />
                                <button type="submit" className="btn btn-primary">Send</button>
                                <button 
                                    type="button"
                                    className="btn btn-secondary" 
                                    onClick={this.sendTypingNotification}
                                >
                                    Typing
                                </button>
                                <button 
                                    type="button"
                                    className="btn btn-secondary" 
                                    onClick={this.sendReadReceipt}
                                    disabled={!this.state.messageId}
                                >
                                    Read Receipt
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Message Operations */}
                    {this.state.threadId && (
                        <div className="thread-section">
                            <div className="section-title">Message Operations</div>
                            <div className="thread-controls">
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={this.updateChatMessage} 
                                    disabled={!this.state.messageId}
                                >
                                    Update Last Message
                                </button>
                                <button 
                                    className="btn btn-danger" 
                                    onClick={this.deleteChatMessage} 
                                    disabled={!this.state.messageId}
                                >
                                    Delete Last Message
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="chat-sidebar">
                    {/* Participants Section */}
                    {this.state.threadId && (
                        <div className="participants-section">
                            <div className="section-title">Participants</div>
                            <div className="participants-list">
                                {this.state.participants.length === 0 ? (
                                    <div style={{textAlign: 'center', color: '#666', fontSize: '14px'}}>
                                        No participants
                                    </div>
                                ) : (
                                    this.state.participants.map(participant => this.renderParticipant(participant))
                                )}
                            </div>
                            <div style={{marginTop: '10px'}}>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={this.addParticipants}
                                    style={{width: '100%'}}
                                >
                                    Add Participant
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Events Section */}
                    <div className="events-section">
                        <div className="section-title">Real-time Events</div>
                        <div className="events-list">
                            {this.state.events.length === 0 ? (
                                <div style={{textAlign: 'center', color: '#666', fontSize: '14px'}}>
                                    No events yet
                                </div>
                            ) : (
                                this.state.events.map(event => this.renderEvent(event))
                            )}
                        </div>
                        {this.state.events.length > 0 && (
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => this.setState({events: []})}
                                style={{width: '100%', marginTop: '10px'}}
                            >
                                Clear Events
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default Chat;