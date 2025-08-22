# ChatFriedly 🤖

Um chatbot interativo com interface amigável, suporte a comandos de voz e resposta por voz.

## 🌟 Funcionalidades

- 💬 Chat em tempo real com IA
- 🎤 Suporte a comandos de voz
- 🔊 Respostas por voz em português
- 📱 Interface mobile-first responsiva
- 🔄 Reconexão automática
- 🧹 Limpeza de histórico

## 🛠️ Tecnologias Utilizadas

### Frontend (Mobile)
- React Native (Expo)
- Socket.IO Client
- Expo Speech (para Text-to-Speech)
- React Native Components

### Backend
- Node.js
- Socket.IO
- Express
- Axios
- Google APIs

## 📦 Versões das Dependências

### Mobile (mobile53/package.json)
```json
{
  "expo": "~49.0.5",
  "react": "18.2.0",
  "react-native": "0.72.3",
  "socket.io-client": "^4.7.2",
  "expo-speech": "~11.3.0"
}
```

### Server (server/package.json)
```json
{
  "socket.io": "^4.7.2",
  "express": "^4.18.2",
  "axios": "latest",
  "googleapis": "latest"
}
```

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js instalado
- Expo CLI instalado (`npm install -g expo-cli`)
- Um dispositivo móvel com Expo Go instalado ou um emulador

### Configuração do Servidor
1. Navegue até a pasta do servidor:
   ```bash
   cd server
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor:
   ```bash
   node server.js
   ```

### Configuração do App Mobile
1. Navegue até a pasta do app:
   ```bash
   cd mobile53
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Atualize o endereço IP do servidor no arquivo `App.js`:
   ```javascript
   const SERVER_URL = "http://SEU_IP:4000";
   ```

4. Inicie o app:
   ```bash
   npx expo start
   ```

5. Escaneie o QR code com o Expo Go (Android) ou Câmera (iOS)

## 📱 Uso

1. Ao abrir o app, ele se conectará automaticamente ao servidor
2. Use o botão de microfone 🎤 para enviar mensagens por voz
3. Digite no campo de texto para enviar mensagens escritas
4. Use o botão ✈️ para enviar as mensagens
5. O botão 🗑️ limpa o histórico da conversa
6. As respostas do chatbot serão faladas automaticamente

## 🤝 Contribuição

Sinta-se à vontade para contribuir com o projeto através de Pull Requests. Para mudanças maiores, abra uma Issue primeiro para discutirmos as alterações propostas.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ✨ Autor

Desenvolvido por Débora Campelo
