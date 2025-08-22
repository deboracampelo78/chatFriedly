import { useEffect, useRef, useState, useCallback } from "react";
import { SafeAreaView, FlatList, TextInput, Button, Text, View, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import io from "socket.io-client";
import * as Speech from 'expo-speech';

// CONFIRA seu IP aqui:
const SERVER_URL = "http://192.168.0.89:4000";
const ME = { id: "me" };

const tabs = [
  { id: "ai", title: "🤖" }
];

export default function App() {
  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [chatId, setChatId] = useState("ai");
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef(messages);
  const all = useRef({ global: [], ai: [] });
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const sendTimerRef = useRef(null);

  // Função para ativar o microfone do teclado
  const activateKeyboardMic = () => {
    // Garante que o teclado está visível
    inputRef.current?.focus();
    
    // Em Android, simula um toque longo no botão de espaço para ativar o microfone
    if (Platform.OS === 'android') {
      // Pequeno delay para garantir que o teclado está visível
      setTimeout(() => {
        const keyEvent = new KeyboardEvent('keydown', {
          key: ' ',
          code: 'Space',
          location: 0,
          repeat: true,
          isComposing: false,
          charCode: 0,
          keyCode: 32,
          which: 32,
        });
        inputRef.current?.focus();
        document.dispatchEvent(keyEvent);
      }, 300);
    }
  };

  const clearChat = useCallback(() => {
    // Limpa as mensagens do chat atual
    all.current[chatId] = [];
    setMessages([]);
    
    // Notifica o servidor para limpar o contexto da conversa
    if (socketRef.current?.connected) {
      socketRef.current.emit("chat:clear", { chatId, senderId: ME.id });
      console.log("[socket] Limpando contexto do chat:", chatId, "para usuário:", ME.id);
    }
  }, [chatId]);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    // ✅ adiciona polling como fallback, tenta reconectar, e loga erros
    const socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      timeout: 10000,
      withCredentials: false,
      forceNew: true, // evita reutilizar conexões quebradas
      path: "/socket.io" // default, mas deixamos explícito
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", "global");
      socket.emit("join", "ai");
      console.log("[socket] connected", socket.id);
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      console.log("[socket] disconnect:", reason);
    });

    socket.on("connect_error", (err) => {
      setConnected(false);
      console.log("[socket] connect_error:", err?.message);
    });

    socket.on("msg:new", (m) => {
      const list = all.current[m.chatId] || [];
      // Verifica se a mensagem já existe na lista
      if (!list.some(msg => msg.id === m.id)) {
        all.current[m.chatId] = [...list, m]; // Adiciona no final da lista
        if (m.chatId === chatId) {
          setMessages(prev => {
            // Evita duplicatas também no estado
            if (prev.some(msg => msg.id === m.id)) return prev;
            // Se for mensagem do amigo, vamos falar
            if (m.senderId === "amigo") {
              // Primeiro, vamos obter as vozes disponíveis
              Speech.getAvailableVoicesAsync().then(voices => {
                // Filtra por vozes em português
                const ptVoices = voices.filter(v => v.language.startsWith('pt'));
                // Se encontrar uma voz em português, usa ela
                const voice = ptVoices.length > 0 ? ptVoices[0].identifier : null;

                Speech.speak(m.text, {
                  language: 'pt-BR',
                  rate: 1.40,    // velocidade mais lenta (valores entre 0.1 e 2.0)
                  pitch: 0.4,    // tom um pouco mais alto (valores entre 0.5 e 2.0)
                  volume: 0.6,   // volume máximo (valores entre 0.0 e 1.0)
                  onStart: () => setIsSpeaking(true),
                  onDone: () => setIsSpeaking(false),
                  onError: (err) => console.warn('Erro ao falar:', err)
                });
              });
            }
            return [...prev, m]; // Adiciona no final da lista
          });
        }
      }
    });

    return () => {
      socket.off("msg:new");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatId]);

  const switchTab = (id) => {
    // Se estiver mudando de aba, notifica o servidor que mudamos de contexto
    if (id !== chatId && socketRef.current?.connected) {
      socketRef.current.emit("chat:switch", { from: chatId, to: id });
      console.log("[socket] Mudando contexto do chat:", chatId, "->", id);
    }
    setChatId(id);
    setMessages(all.current[id] || []);
  };

  const send = useCallback((voiceText) => {
    const messageText = voiceText || text;
    if (!messageText.trim()) return;
    const now = Date.now();
    const msg = {
      id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId: ME.id,
      text: messageText,
      isVoiceMessage: Boolean(voiceText), // Indica se veio de uma mensagem de voz
      createdAt: now
    };
    // Mostra já
    const list = [...(all.current[chatId] || []), msg]; // Adiciona no final da lista
    all.current[chatId] = list;
    setMessages(list);

    // Se não estiver conectado, tentamos reconectar e não travamos o botão
    if (!socketRef.current || !socketRef.current.connected) {
      console.log("[socket] not connected, trying to reconnect…");
      socketRef.current?.connect();
      // opcional: aqui você poderia enfileirar msg pra reenvio
    } else {
      socketRef.current.emit("msg:send", msg);
    }
    setText("");
  }, [text, chatId]);

  const renderItem = ({ item }) => (
    <View style={{
      alignSelf: item.senderId === ME.id ? "flex-end" : "flex-start",
      backgroundColor: item.senderId === ME.id ? "#DCF8C6" : (item.senderId === "amigo" ? "#EAE7FF" : "#FFF"),
      padding: 10, margin: 6, borderRadius: 10, maxWidth: "80%",
      borderWidth: 1, borderColor: "#eee"
    }}>
      <Text>{item.text}</Text>
      <Text style={{ fontSize: 10, opacity: 0.6 }}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ 
        flex: 1, 
        paddingTop: Platform.OS === "ios" ? 44 : 45, // Aumentado para Android
        backgroundColor: "#f7f7f7",
        paddingBottom: Platform.OS === "android" ? 35 : 0 // Aumentado para Android
      }}>
        {/* Header com Tabs e botão de limpar */}
        <View style={{ 
          flexDirection: "row", 
          gap: 8, 
          padding: 8, 
          borderBottomWidth: 1, 
          borderBottomColor: "#eee",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {tabs.map(t => (
              <TouchableOpacity key={t.id} onPress={() => switchTab(t.id)}
                style={{
                  paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
                  backgroundColor: chatId === t.id ? "#4ddbfeff" : "#fff", borderWidth: 1, borderColor: "#ddd"
                }}>
                <Text style={{ color: chatId === t.id ? "#fff" : "#222" }}>{t.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity 
            onPress={clearChat}
            style={{
              padding: 8,
              backgroundColor: "#ffebebff",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "transparent"
            }}
          >
            <Text style={{ color: "#ef0808ff", fontSize: 12 }}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {/* Input de mensagem */}
        <View style={{ 
          flexDirection: "row", 
          padding: 8,
          paddingTop: 8,
          paddingBottom: 12,
          gap: 8, 
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#eee",
          elevation: Platform.OS === "android" ? 3 : 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        }}>
          <TextInput
            ref={inputRef}
            style={{ 
              flex: 1, 
              borderWidth: 1, 
              borderColor: "#ccc", 
              borderRadius: 8, 
              padding: 10, 
              backgroundColor: "#fff",
              maxHeight: 100
            }}
            value={text}
            onChangeText={(newText) => {
              setText(newText);
              // Limpa o timer anterior se existir
              if (sendTimerRef.current) {
                clearTimeout(sendTimerRef.current);
              }
              // Se o texto mudou e veio do teclado virtual (provavelmente do microfone)
              if (newText !== text && newText.trim()) {
                // Define um novo timer
                sendTimerRef.current = setTimeout(() => {
                  send(newText);
                  sendTimerRef.current = null;
                }, 1500); // Aumentei para 1.5 segundos para dar mais tempo para a transcrição completa
              }
            }}
            multiline={true}
            placeholder={connected ? (chatId === "ai" ? "Fale com o Amigo 🤖" : "Mensagem") : "Conectando..."}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                // Primeiro, garantimos que o teclado está aberto
                Keyboard.dismiss();
                // Pequeno delay antes de abrir o teclado novamente
                setTimeout(() => {
                  inputRef.current?.focus();
                  // Garante que o foco permanece e o teclado fica visível
                  Platform.OS === 'android' && inputRef.current?.blur();
                  Platform.OS === 'android' && inputRef.current?.focus();
                }, 100);
                
                setIsListening(true);
                setTimeout(() => setIsListening(false), 500);
              }}
              style={{
                padding: 12,
                backgroundColor: isListening ? "#ff4444" : "#f1b606ff",
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: isListening ? 0.7 : 1
              }}
            >
              <Text style={{ 
                color: "#fff",
                fontSize: 16,
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                🎤
              </Text>
            </TouchableOpacity>
            {/* Botão de envio customizado com ícone de avião */}
            <TouchableOpacity
              onPress={() => send()}
              style={{
                padding: 12,
                backgroundColor: "#05c3f7ff",
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                minWidth: 48
              }}
            >
              <Text style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                ➡️
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de mensagens */}
        <FlatList 
          data={messages} 
          keyExtractor={(m) => m.id} 
          renderItem={renderItem}
          inverted={false} // Remove a inversão da lista
          contentContainerStyle={{ paddingVertical: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })} // Rola para o final quando chegar nova mensagem
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })} // Rola para o final quando carregar
          ref={flatListRef} // Referência para poder rolar a lista
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
