import React from "react";
import { ChatClient } from '@azure/communication-chat';
import {
    AzureCommunicationTokenCredential,
    parseConnectionString
} from "@azure/communication-common";
import { CommunicationIdentityClient } from "@azure/communication-identity";

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
            details: '',
            connectionString: ''
        };
    }

    handleEvent(eventName, details) {
        console.log(`Notification: ${eventName}. Details: ${details}.`);

        this.state.events.push(eventName);
        this.setState({ event: eventName });
        this.setState({ details: details });
    }

    async createChatClient() {
        if (!this.state.connectionString) {
            alert("Please enter a connection string");
        }
        const endpoint = parseConnectionString(this.state.connectionString).endpoint;

        const identityClient = new CommunicationIdentityClient(this.state.connectionString);
        const user = await identityClient.createUser();
        const token = await identityClient.getToken(user, ["chat"]);

        const chatClient = new ChatClient(endpoint, new AzureCommunicationTokenCredential(token.token));
        console.log(token.token)
        console.log("Chat Client Created")

        this.setState({ chatClient: chatClient });
        this.setState({ userToken: token.token });

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
            this.handleEvent(event, JSON.stringify(e));
        });

        chatClient.on("participantsRemoved", (e) => {
            let event = `Participants Removed.`;
            this.handleEvent(event, JSON.stringify(e));
        });
    };

    async createChatThread() {
        const createChatThreadResult = await this.state.chatClient.createChatThread({ topic: "Hello, World!" });
        const threadId = createChatThreadResult.chatThread ? createChatThreadResult.chatThread.id : "";
        const chatThreadClient = this.state.chatClient.getChatThreadClient(threadId);

        this.setState({ threadId: threadId });
        this.setState({ threadClient: chatThreadClient });
        this.setState({ messageId: null });
        this.setState({ lastUser: null });
    }

    async sendChatMessage() {
        const sendMessageRequest =
        {
            content: 'Please take a look at the attachment'
        };
        let sendMessageOptions =
        {
            senderDisplayName: 'Jack',
            type: 'text',
            metadata: {
                'hasAttachment': 'true',
                'attachmentUrl': 'https://contoso.com/files/attachment.docx'
            }
        };
        const sendChatMessageResult = await this.state.threadClient.sendMessage(sendMessageRequest, sendMessageOptions);
        const messageId = sendChatMessageResult.id;
        this.setState({ messageId: messageId });
        console.log(`Message sent!, message id:${messageId}`);
    }

    async updateChatMessage() {
        await this.state.threadClient.updateMessage(this.state.messageId, { content: "New content" });
        console.log(`Updated message.`);
    }

    async deleteChatMessage() {
        await this.state.threadClient.deleteMessage(this.state.messageId);
        this.setState({ messageId: null });
        console.log("Deleted message.");
    }

    async sendTypingNotification() {
        const endpoint = parseConnectionString(this.state.connectionString).endpoint;

        const identityClient = new CommunicationIdentityClient(this.state.connectionString);
        let token = await identityClient.createUserAndToken(["chat"]);

        let addParticipantsRequest = {
            participants: [
                {
                    id: token.user,
                }
            ]
        };
        await this.state.threadClient.addParticipants(addParticipantsRequest);

        let chatClient = new ChatClient(endpoint, new AzureCommunicationTokenCredential(token.token));
        let chatThreadClient = chatClient.getChatThreadClient(this.state.threadId);

        await chatThreadClient.sendTypingNotification();
        this.setState({ lastUser: token.user });
        console.log("Send Typing Notification.");
    }

    async sendReadReceipt() {
        const endpoint = parseConnectionString(this.state.connectionString).endpoint;

        const identityClient = new CommunicationIdentityClient(this.state.connectionString);
        let token = await identityClient.createUserAndToken(["chat"]);

        let addParticipantsRequest = {
            participants: [
                {
                    id: token.user,
                }
            ]
        };
        await this.state.threadClient.addParticipants(addParticipantsRequest);

        let chatClient = new ChatClient(endpoint, new AzureCommunicationTokenCredential(token.token));
        let chatThreadClient = chatClient.getChatThreadClient(this.state.threadId);

        await chatThreadClient.sendReadReceipt({ chatMessageId: this.state.messageId });
        this.setState({ lastUser: token.user });

        console.log("Send Read Receipt.");
    }

    async updateTopic() {
        await this.state.threadClient.updateTopic("New Topic");
        console.log(`Updated thread's topic.`);
    }

    async deleteChatThread() {
        await this.state.chatClient.deleteChatThread(this.state.threadId);

        this.setState({ messageId: null });
        this.setState({ threadId: null });
        this.setState({ threadClient: null });
    }

    async addParticipants() {
        const identityClient = new CommunicationIdentityClient(this.state.connectionString);
        let userSue = await identityClient.createUserAndToken(["chat"]);
        let addParticipantsRequest = {
            participants: [
                {
                    id: userSue.user,
                    displayName: "Sue"
                }
            ]
        };
        await this.state.threadClient.addParticipants(addParticipantsRequest);
        this.setState({ lastUser: userSue.user });
        console.log(`Added chat participant user.`);
    }

    async removeParticipant() {
        await this.state.threadClient.removeParticipant(this.state.lastUser);
        this.setState({ lastUser: null });
        console.log("Removed chat participant user.");
    }

    displayUserToken() {
        return (<p>User Token: {this.state.userToken}</p>)
    }

    displayThreadId() {
        return (<p>Thread ID: {this.state.threadId ?? "NULL"}</p>)
    }

    displaMessageId() {
        return (<p>Message ID: {this.state.messageId ?? "NULL"}</p>)
    }

    updateInputValue(evt) {
        const val = evt.target.value;
        this.setState({
            connectionString: val
        });
    }
    render() {
        if (this.state.chatClient === null) {
            return (
                <div className="btn-group">
                    <input
                        value={this.state.connectionString}
                        type="text"
                        id="message"
                        onChange={evt => this.updateInputValue(evt)}
                        placeholder="Enter the connection string"
                    />
                    <button onClick={this.createChatClient}>Start!</button>
                </div>
            );
        }
        else {
            return (
                <div>
                    {this.displayThreadId()}
                    {this.displaMessageId()}
                    <div className="btn-group">
                        <button onClick={this.createChatThread}>Create Chat Thread</button>
                        <button onClick={this.updateTopic} disabled={this.state.threadId === null}>Update Topic</button>
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