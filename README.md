# Azure Communication Services - Chat Demo Application

A modern React-based demonstration application for Azure Communication Services Chat SDK with real-time notifications, comprehensive chat operations, and an intuitive testing interface.

![Azure Communication Services Chat Demo](https://img.shields.io/badge/Azure-Communication%20Services-0078d4?style=flat-square&logo=microsoft-azure)
![React](https://img.shields.io/badge/React-18.2.0-61dafb?style=flat-square&logo=react)
![Chat SDK](https://img.shields.io/badge/ACS%20Chat%20SDK-1.6.0-success?style=flat-square)

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or later)
- npm or yarn
- Azure Communication Services resource

### 1. Clone and Install
```bash
git clone https://github.com/LuChen-Microsoft/Chat-Signaling-Sample.git
cd Chat-Signaling-Sample
npm install
```

### 2. Configure Azure Communication Services
**⚠️ REQUIRED:** Update the connection string in `src/config.js`:

```javascript
export const ConnectionString = "endpoint=https://your-acs-resource.communication.azure.com/;accesskey=your-access-key";
```

**How to get your connection string:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Azure Communication Services resource
3. Go to "Keys" in the left navigation
4. Copy the "Connection string" from the Primary key section

### 3. Run the Application
```bash
npm start
```
The app will open at [http://localhost:3000](http://localhost:3000)

## 🎯 Features

### ✨ Modern Chat Interface
- **Real-time chat box** with message history
- **Interactive message input** with Enter key support
- **Live participant management** with add/remove functionality
- **System message detection** with special styling
- **Message metadata display** (ID, type, timestamp)

### 📡 Real-time Notifications
- **Live events panel** showing all ACS notifications in real-time
- **JSON-formatted event details** for debugging
- **Connection status monitoring**
- **Event history** (keeps last 50 events)

### 🔧 Comprehensive Testing Features
- **Thread Management**: Create, update topic/metadata/retention policy, delete
- **Message Operations**: Send, update, delete messages
- **Participant Management**: Add/remove participants with diverse names
- **Real-time Features**: Typing notifications, read receipts
- **System Messages**: Automatic display of thread operation notifications

### 👥 Smart Participant Management
- **26 diverse participant names**: Alice, Bob, Charlie, Diana, Emma, Frank, Grace, Henry, Isabella, Jack, Kate, Liam, Maya, Nathan, Olivia, Peter, Quinn, Rachel, Sam, Tina, Uma, Victor, Wendy, Xavier, Yara, Zoe
- **Automatic name cycling**: Names rotate through the pool automatically
- **Visual participant list** with remove buttons for recent additions

## 🏗️ Application Architecture

### Key Components
- **`src/Chat.js`** - Main React component with all chat functionality
- **`src/ChatUI.css`** - Modern styling with Microsoft design language
- **`src/config.js`** - Azure Communication Services configuration
- **`src/App.js`** - Application entry point

### State Management
The application manages several key state objects:
- **Chat Client State**: `chatClient`, `threadId`, `threadClient`, `messageId`
- **UI State**: `messages[]`, `participants[]`, `events[]`, `messageInput`
- **Connection State**: `isConnected`, `lastUser`
- **Participant Management**: `participantNames[]`, `usedNameIndex`

### Real-time Event Flow
1. User performs action → ACS SDK operation
2. ACS sends real-time notification → Event handler processes
3. UI state updates → Components re-render
4. Visual feedback displayed → JSON event details shown

## 🧪 Testing Guide

### Basic Testing Flow
1. **Initialize**: Click "Initialize Chat Client" to start
2. **Create Thread**: Click "Create Chat Thread" to begin a conversation
3. **Send Messages**: Type and send messages in the chat box
4. **Add Participants**: Click "Add Participant" to simulate multi-user scenarios
5. **Monitor Events**: Watch the real-time events panel for all notifications

### Advanced Operations
- **Thread Operations**: Test topic updates, metadata changes, retention policies
- **Message Management**: Update or delete specific messages
- **Real-time Features**: Send typing notifications and read receipts
- **Participant Management**: Add multiple participants and remove specific ones

### Event Monitoring
- **System Messages**: Appear in yellow with "System" sender for thread operations
- **User Messages**: Standard chat messages with sender names and timestamps
- **Real-time Events**: JSON-formatted events in the sidebar panel
- **Connection Status**: Monitor real-time notification connection health

## 🛠️ Development

### Project Structure
```
src/
├── Chat.js           # Main chat component (class-based React)
├── ChatUI.css        # Styling and layout
├── config.js         # ACS connection configuration
├── App.js            # Application wrapper
├── App.css           # Application-level styles
└── index.js          # React app entry point
```

### Key Dependencies
- **@azure/communication-chat**: Core chat functionality
- **@azure/communication-identity**: User and token management
- **@azure/communication-common**: Shared utilities and credentials
- **@azure/logger**: Logging and debugging support

### Build and Deploy
```bash
npm run build    # Creates optimized production build in /build
npm test         # Runs test suite
```

## 🔍 Troubleshooting

### Common Issues

**Connection String Error**
- Ensure your connection string is correctly formatted
- Verify your Azure Communication Services resource is active
- Check that the access key hasn't expired

**Real-time Notifications Not Working**
- Verify the connection status shows "Connected"
- Check browser console for WebSocket connection errors
- Ensure firewall/proxy settings allow WebSocket connections

**Messages Not Appearing**
- Check that a thread has been created first
- Verify the message was sent successfully (check console logs)
- Try refreshing the message list manually

### Debug Mode
The application includes verbose logging. Check your browser's developer console for detailed ACS SDK operations and debugging information.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📚 Resources

- [Azure Communication Services Documentation](https://docs.microsoft.com/en-us/azure/communication-services/)
- [Chat SDK Reference](https://docs.microsoft.com/en-us/javascript/api/@azure/communication-chat/)
- [React Documentation](https://reactjs.org/docs/)

---

**Built with ❤️ for Azure Communication Services developers**