import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  ArrowLeft,
  Phone,
  Send,
  MapPin,
  Image as ImageIcon,
  MoreVertical,
  User,
} from 'lucide-react-native';
import { useChatStore } from '../../store';
import { Colors } from '../../config/colors';
import { ChatMessage, DriverProfile, QuickReply } from '../../types';
import { chatService, socketManager } from '../../services';
import { useAuthStore } from '../../store';

type RouteParams = {
  Chat: {
    offerId?: string;
    rideId?: string;
    driver: DriverProfile;
  };
};

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'Chat'>>();
  const { driver } = route.params;
  const rideId = route.params.rideId;
  const { user } = useAuthStore();

  const {
    messages,
    quickReplies,
    addMessage,
    setMessages,
    setTyping,
    otherTyping,
    setOtherTyping,
    markAllAsRead,
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    let mounted = true;
    const bootstrapChat = async () => {
      if (!rideId) return;
      try {
        if (!socketManager.isConnected()) {
          await socketManager.connect();
        }
        socketManager.subscribeToRide(rideId);
        const response = await chatService.getRideMessages(rideId);
        if (mounted) {
          setMessages(response.messages);
        }
        await chatService.markRideMessagesAsRead(rideId);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      }
    };

    const unsubNew = socketManager.onChatMessage((incoming: ChatMessage) => {
      if (!rideId || incoming.rideId !== rideId) return;
      addMessage(incoming);
    });
    const unsubTyping = socketManager.onChatTyping((payload: { rideId: string; userId: string; isTyping: boolean }) => {
      if (!rideId || payload.rideId !== rideId || payload.userId === user?._id) return;
      setOtherTyping(payload.isTyping);
    });
    const unsubRead = socketManager.onChatRead((payload: { rideId: string; userId: string }) => {
      if (!rideId || payload.rideId !== rideId || payload.userId === user?._id) return;
      markAllAsRead();
    });

    bootstrapChat();

    return () => {
      mounted = false;
      setOtherTyping(false);
      unsubNew();
      unsubTyping();
      unsubRead();
    };
  }, [rideId, user?._id]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    if (!rideId) return;

    const content = inputText.trim();
    socketManager.setChatTyping({ rideId, isTyping: false });
    setInputText('');

    chatService.sendRideMessage(rideId, {
      content,
      type: 'text',
    }).then((response) => {
      addMessage(response.chatMessage);
    }).catch((error) => {
      console.error('Failed to send message:', error);
    });
  };

  const handleQuickReply = (reply: QuickReply) => {
    setInputText(reply.text);
  };

  const handleCall = () => {
    // In production: Linking.openURL(`tel:${driver.phone}`)
    console.log('Calling driver...');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.senderType === 'passenger';
    const isSystem = item.type === 'system';

    if (isSystem) {
      return (
        <View className="items-center my-2">
          <View className="bg-gray-100 px-4 py-2 rounded-full">
            <Text className="text-xs text-gray-500">{item.content}</Text>
          </View>
        </View>
      );
    }

    return (
      <View className={`flex-row mb-3 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
        {!isMyMessage && (
          <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-2">
            <User size={16} color={Colors.gray500} />
          </View>
        )}
        <View
          className={`max-w-[75%] px-4 py-3 rounded-2xl ${
            isMyMessage
              ? 'bg-primary rounded-br-sm'
              : 'bg-gray-100 rounded-bl-sm'
          }`}
        >
          <Text className={`text-sm ${isMyMessage ? 'text-secondary' : 'text-secondary'}`}>
            {item.content}
          </Text>
          <View className="flex-row items-center justify-end mt-1">
            <Text className={`text-xs ${isMyMessage ? 'text-secondary/70' : 'text-gray-400'}`}>
              {formatTime(item.createdAt)}
            </Text>
            {isMyMessage && item.read && (
              <Text className="text-xs text-secondary/70 ml-1">✓✓</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-white border-b border-gray-100">
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center"
          >
            <ArrowLeft size={24} color={Colors.secondary} />
          </TouchableOpacity>

          <TouchableOpacity className="flex-1 flex-row items-center ml-2">
            <View className="relative">
              <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center">
                <User size={24} color={Colors.gray500} />
              </View>
              <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-lg font-semibold text-secondary">{driver.name}</Text>
              <Text className="text-sm text-gray-500">
                {driver.vehicle?.make} {driver.vehicle?.model} • {driver.vehicle?.licensePlate}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCall}
            className="w-10 h-10 rounded-full bg-green-500 items-center justify-center ml-2"
          >
            <Phone size={18} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity className="w-10 h-10 items-center justify-center ml-1">
            <MoreVertical size={20} color={Colors.gray500} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item: ChatMessage) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View className="items-center py-10">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
              <Text className="text-3xl">💬</Text>
            </View>
            <Text className="text-gray-500 text-center">
              Send a message to coordinate{'\n'}your pickup with the driver
            </Text>
          </View>
        }
      />

      {/* Typing Indicator */}
      {otherTyping && (
        <View className="px-4 py-2">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-2">
              <User size={16} color={Colors.gray500} />
            </View>
            <View className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
              <View className="flex-row">
                <View className="w-2 h-2 bg-gray-400 rounded-full mr-1 animate-pulse" />
                <View className="w-2 h-2 bg-gray-400 rounded-full mr-1 animate-pulse" />
                <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Quick Replies */}
      <View className="px-4 py-2 border-t border-gray-100">
        <FlatList
          horizontal
          data={quickReplies}
          keyExtractor={(item: QuickReply) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }: { item: QuickReply }) => (
            <TouchableOpacity
              onPress={() => handleQuickReply(item)}
              className="bg-gray-100 px-4 py-2 rounded-full mr-2 flex-row items-center"
            >
              {item.icon && <Text className="mr-1">{item.icon}</Text>}
              <Text className="text-sm text-secondary">{item.text}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <SafeAreaView edges={['bottom']} className="border-t border-gray-100 bg-white">
          <View className="flex-row items-center px-4 py-3">
            <TouchableOpacity className="w-10 h-10 items-center justify-center">
              <ImageIcon size={22} color={Colors.gray500} />
            </TouchableOpacity>

            <TouchableOpacity className="w-10 h-10 items-center justify-center">
              <MapPin size={22} color={Colors.gray500} />
            </TouchableOpacity>

            <View className="flex-1 flex-row items-center bg-gray-100 rounded-full mx-2 px-4">
              <TextInput
                className="flex-1 py-3 text-secondary"
                placeholder="Type a message..."
                placeholderTextColor={Colors.gray400}
                value={inputText}
                onChangeText={(value) => {
                  setInputText(value);
                  if (rideId) {
                    const typing = value.trim().length > 0;
                    setTyping(typing);
                    socketManager.setChatTyping({ rideId, isTyping: typing });
                  }
                }}
                multiline
                maxLength={500}
              />
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim()}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                inputText.trim() ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <Send
                size={20}
                color={inputText.trim() ? Colors.secondary : Colors.gray400}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatScreen;
