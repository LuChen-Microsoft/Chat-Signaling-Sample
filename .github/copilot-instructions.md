# Copilot Instructions - Azure Communication Services Chat Demo

## Project Overview
This is a modern React-based demonstration application for **Azure Communication Services (ACS) Chat SDK v1.6.0** with real-time notifications. The app provides a comprehensive testing interface for chat operations including thread management, messaging, participants, and real-time event handling with an intuitive UI.

## Key Architecture Patterns

### Component Structure
- **Main component**: `src/Chat.js` - Class-based React component containing all chat functionality
- **Entry point**: `src/App.js` - Simple wrapper that renders the Chat component
- **Styling**: `src/ChatUI.css` - Modern UI with Microsoft design language
- **Configuration**: `src/config.js` - Contains Azure Communication Services connection strings

### State Management (Refactored)
The `Chat` component manages organized state categories:
- **Core ACS State**: `chatClient`, `threadId`, `threadClient`, `messageId`, `lastUser`, `isConnected`
- **UI Data State**: `messages[]`, `participants[]`, `events[]`, `messageInput`
- **Participant Management**: `participantNames[]` (26 diverse names), `usedNameIndex`
- **Legacy State**: `userToken`, `event`, `details` (marked for future removal)

## Critical Configuration

### Connection String Setup
**REQUIRED**: Update `ConnectionString` in `src/config.js` before running:
```javascript
export const ConnectionString = "endpoint=https://your-acs-resource.communication.azure.com/;accesskey=your-key";
```

Multiple environment options available (EMEA, Norway, INT) - commented out in config file.

## Development Workflow

### Local Development
```bash
npm install          # Install dependencies
npm start           # Runs on http://localhost:3000
npm run build       # Production build to /build folder
```

### Real-time Notifications Setup
The app demonstrates proper ACS real-time notification setup:
1. Create chat client with token credential
2. Register event handlers for all chat events (11 different event types)
3. Call `startRealtimeNotifications()` 
4. UI displays events in real-time with JSON formatting

## Component Features & Patterns

### Modern UI Layout
- **Split-screen design**: Main chat area (left) + participants/events sidebar (right, 450px width)
- **Real-time chat box**: Message history with sender names, timestamps, message IDs, and types
- **System message detection**: Non-text messages or messages without senders display as "System" with special styling
- **Interactive elements**: Message input with Enter key support, participant management buttons

### Smart Participant Management
- **26 diverse names**: Alice, Bob, Charlie, Diana, Emma, Frank, Grace, Henry, Isabella, Jack, Kate, Liam, Maya, Nathan, Olivia, Peter, Quinn, Rachel, Sam, Tina, Uma, Victor, Wendy, Xavier, Yara, Zoe
- **Automatic cycling**: `getNextParticipantName()` method rotates through name pool
- **Visual management**: Participant list with remove buttons for recently added users

### Event Monitoring (Enhanced)
- **Large events panel**: 500px max-height for better visibility of real-time events
- **JSON formatting**: Events displayed in properly formatted JSON with syntax highlighting
- **Event history**: Keeps last 50 events with timestamps
- **System message integration**: Thread operations automatically refresh messages to show system notifications

### Message Handling Patterns
- **Auto-refresh**: Messages reload after operations that might generate system messages
- **Delayed loading**: 1-second timeout for system message propagation
- **Message metadata**: Display ID, type, sender, and timestamp for each message
- **System message styling**: Yellow background, brown border, italic sender name

## Code Organization (Refactored)

### Method Categories
```javascript
// EVENT HANDLING
handleEvent(), loadMessages(), loadParticipants()

// AZURE COMMUNICATION SERVICES - CLIENT SETUP  
createChatClient()

// CHAT THREAD OPERATIONS
createChatThread(), updateTopic(), updateMetadata(), updateRetentionPolicy(), deleteChatThread()

// MESSAGE OPERATIONS
sendChatMessage(), updateChatMessage(), deleteChatMessage()

// REAL-TIME FEATURES
sendTypingNotification(), sendReadReceipt()

// PARTICIPANT MANAGEMENT
addParticipants(), removeParticipant(), getNextParticipantName()

// UI RENDERING
renderMessage(), renderParticipant(), renderEvent()
```

## Testing Features
The UI provides comprehensive testing capabilities:
- **Thread Operations**: Create, update topic/metadata/retention policy, delete
- **Message Operations**: Send, update, delete messages with metadata display
- **Participant Management**: Add/remove with diverse display names and metadata
- **Real-time Features**: Typing notifications, read receipts with participant simulation
- **Event Monitoring**: Live display of all real-time events with JSON details
- **System Messages**: Automatic display of thread operation notifications

## Common Patterns

### Error Handling & Logging
- Uses Azure Logger with verbose logging redirected to console
- Console logging for all major operations
- Error handling in async operations (try-catch in loadMessages/loadParticipants)

### UI State Management
- Buttons conditionally disabled based on current state
- Thread operations require `threadId !== null`
- Message operations require `messageId !== null`
- Participant removal requires both `threadId` and `lastUser`

### Auto-refresh Pattern
Thread operations and participant changes automatically:
1. Perform ACS operation
2. Wait 1 second for system message propagation  
3. Refresh relevant UI data (messages, participants)
4. Update event log with operation details

## Key Files Reference
- `src/Chat.js` - Main application logic (well-organized with section comments)
- `src/ChatUI.css` - Modern styling with system message support
- `src/config.js` - **MUST UPDATE** connection string before use
- `README.md` - Comprehensive setup and usage instructions
- `package.json` - Dependencies including ACS Chat SDK v1.6.0
