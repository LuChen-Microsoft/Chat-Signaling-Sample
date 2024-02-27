import React from "react";
import { ChatClient  } from '@azure/communication-chat';
import {
  AzureCommunicationTokenCredential,
  parseConnectionString
} from "@azure/communication-common";
import { CommunicationIdentityClient } from "@azure/communication-identity";
import {ConnectionString} from "./config.js"
const { AzureLogger, setLogLevel } = require("@azure/logger");


class Chat extends React.Component { 
    constructor(props) {
        super(props);

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
            chatClient: null,
            userToken: null,
            lastUser: null,
            threadId: null,
            threadClient: null,
            messageId: null,
            events: [],
            event: '',
            details: ''
        };
        
    }

    handleEvent(eventName, details) {
        console.log(`Notification: ${eventName}. Details: ${details}.`);

        this.state.events.push(eventName);
        this.setState({event: eventName});
        this.setState({details: details});
    }

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
            this.handleEvent(event, '');
        });

        chatClient.on("realTimeNotificationDisconnected", () => {
            let event = `Real-Time NotificationDisconnected`;
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
    }

    async sendChatMessage() {
        const sendMessageRequest =
        {
            content: 'Please take a look at the attachment'
        };
        let sendMessageOptions =
        {
        senderDisplayName : 'Jack',
        type: 'text',
        metadata: {
            'hasAttachment': 'true',
            'attachmentUrl': 'https://contoso.com/files/attachment.docx'
        }
        };
        const sendChatMessageResult = await this.state.threadClient.sendMessage(sendMessageRequest, sendMessageOptions);
        const messageId = sendChatMessageResult.id;
        this.setState({messageId: messageId});
        console.log(`Message sent!, message id:${messageId}`);
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

        let addParticipantsRequest = {
            participants: [
              {
                id: token.user,
              }
            ]
          };
        await this.state.threadClient.addParticipants(addParticipantsRequest);

        let chatClient = new ChatClient(endpoint,new AzureCommunicationTokenCredential(token.token));
        let chatThreadClient = chatClient.getChatThreadClient(this.state.threadId);

        await chatThreadClient.sendTypingNotification();
        this.setState({lastUser: token.user});
        console.log("Send Typing Notification.");
    }

    async sendReadReceipt()
    {
        const endpoint = parseConnectionString(ConnectionString).endpoint;
        
        const identityClient = new CommunicationIdentityClient(ConnectionString);
        let token = await identityClient.createUserAndToken(["chat"]);

        let addParticipantsRequest = {
            participants: [
              {
                id: token.user,
              }
            ]
          };
        await this.state.threadClient.addParticipants(addParticipantsRequest);

        let chatClient = new ChatClient(endpoint,new AzureCommunicationTokenCredential(token.token));
        let chatThreadClient = chatClient.getChatThreadClient(this.state.threadId);

        await chatThreadClient.sendReadReceipt({chatMessageId: this.state.messageId});
        this.setState({lastUser: token.user});

        console.log("Send Read Receipt.");
    }

    async updateTopic()
    {
        await this.state.threadClient.updateTopic("New Topic");
        console.log(`Updated thread's topic.`);
    }

    async updateMetadata()
    {
        await this.state.threadClient.updateProperties({
            metadata: { threadType: "secondary" },
        });
        console.log(`Updated thread's metadata.`);
    }

    async updateRetentionPolicy()
    {
        await this.state.threadClient.updateProperties({
            retentionPolicy: null,
        });
        const thread = await this.state.threadClient.getProperties();
        console.log(`Updated thread's retention policy. ${JSON.stringify(thread)}`);
    }

    async deleteChatThread() {
        await this.state.chatClient.deleteChatThread(this.state.threadId);

        this.setState({messageId: null});
        this.setState({threadId: null});
        this.setState({threadClient: null});
    }

    async addParticipants(){
        const identityClient = new CommunicationIdentityClient(ConnectionString);
        let userSue = await identityClient.createUserAndToken(["chat"]);
        let addParticipantsRequest = {
            participants: [
              {
                id: userSue.user,
                displayName: "Sue",
                metadata: {
                    "userType": "C2"
                }
              }
            ]
          };
          await this.state.threadClient.addParticipants(addParticipantsRequest);
          this.setState({lastUser: userSue.user});
          console.log(`Added chat participant user.`);
    }

    async removeParticipant(){
        await this.state.threadClient.removeParticipant(this.state.lastUser);
        this.setState({lastUser: null});
        console.log("Removed chat participant user.");
    }

    displayUserToken(){
        return (<p>User Token: {this.state.userToken}</p>)
    }

    displayThreadId(){
        return (<p>Thread ID: {this.state.threadId ?? "NULL"}</p>)
    }

    displaMessageId(){
        return (<p>Message ID: {this.state.messageId ?? "NULL"}</p>)
    }


    render() {
        if (this.state.chatClient === null)
        {
            return (
                <div className="btn-group">                    
                    <button onClick={this.createChatClient}>Start!</button>
                </div>
            );
        }
        else 
        {
            return (
                <div> 
                    {this.displayThreadId()}
                    {this.displaMessageId()}
                    <div className="btn-group">                    
                        <button onClick={this.createChatThread}>Create Chat Thread</button>
                        <button onClick={this.updateTopic} disabled={this.state.threadId === null}>Update Topic</button>
                        <button onClick={this.updateMetadata} disabled={this.state.threadId === null}>Update Metadata</button>
                        <button onClick={this.updateRetentionPolicy} disabled={this.state.threadId === null}>Update RetentionPolicy</button>
                        <button onClick={this.sendChatMessage} disabled={this.state.threadId === null}>Send Chat Message</button>
                        <button onClick={this.sendReadReceipt} disabled={this.state.messageId === null}>Send Read Receipt</button>
                        <button onClick={this.updateChatMessage} disabled={this.state.messageId === null}>Update Chat Message</button>
                        <button onClick={this.sendTypingNotification} disabled={this.state.threadId === null}>Send Typing Notification</button>
                        <button onClick={this.addParticipants} disabled={this.state.threadId === null}>Add Participants</button>
                        <button onClick={this.removeParticipant} disabled={this.state.threadId === null || this.state.lastUser === null}>Remove Participant</button>
                        <button onClick={this.deleteChatMessage} disabled={this.state.messageId === null}>Delete Chat Message</button>
                        <button onClick={this.deleteChatThread} disabled={this.state.threadId === null}>Delete Chat Thread</button>
                        
                    </div>
                    <div>
                        <div>
                        <p>New Event : {this.state.event} </p>
                        </div>
                        <div>
                            {this.state.details}
                        </div>
                    </div>
                </div>
                
            )           
        };
    }
}

export default Chat;